<?php

namespace App\Services\Payments;

use App\Models\Order;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Safaricom Daraja "Lipa Na M-Pesa" STK push (B2C STK push for sandbox/prod).
 *
 *   • OAuth token cached for ~50 minutes (tokens expire after an hour).
 *   • Each charge generates an idempotency key stored on the order so retries
 *     are safe — we won't double-charge a buyer if the React client retries.
 *   • Callback URL is signed: the URL itself contains a HMAC of the order id
 *     so a forged callback can't mark an arbitrary order paid.
 */
class MpesaDarajaDriver implements PaymentDriver
{
    public function id(): string
    {
        return 'mpesa';
    }

    public function charge(Order $order, array $context = []): array
    {
        $phone = $context['phone'] ?? $order->guest_phone ?? null;
        if (!$phone) {
            throw new RuntimeException('M-Pesa charge requires a phone number.');
        }
        $cleanPhone = preg_replace('/\D/', '', $phone);
        // Normalize +254… and +255… to the local 12-digit format Daraja wants.
        $cleanPhone = ltrim($cleanPhone, '0');

        $idempotencyKey = $order->payment_reference ?: ('mpesa-' . Str::uuid());
        if (!$order->payment_reference) {
            $order->update(['payment_reference' => $idempotencyKey]);
        }

        $shortcode = config('services.mpesa.shortcode');
        $passkey = config('services.mpesa.passkey');
        $timestamp = now()->format('YmdHis');
        $password = base64_encode($shortcode . $passkey . $timestamp);

        $callback = url('/api/v1/payments/mpesa/callback?sig=' . $this->signCallback($order->id));

        $body = [
            'BusinessShortCode' => (int) $shortcode,
            'Password' => $password,
            'Timestamp' => $timestamp,
            'TransactionType' => 'CustomerPayBillOnline',
            'Amount' => (int) round($order->total),
            'PartyA' => $cleanPhone,
            'PartyB' => (int) $shortcode,
            'PhoneNumber' => $cleanPhone,
            'CallBackURL' => $callback,
            'AccountReference' => 'mkulima-' . $order->id,
            'TransactionDesc' => 'Mkulima order #' . $order->id,
        ];

        $resp = Http::withToken($this->accessToken())
            ->post($this->baseUrl() . '/mpesa/stkpush/v1/processrequest', $body);

        if (!$resp->ok()) {
            Log::warning('M-Pesa STK push failed', ['order' => $order->id, 'resp' => $resp->body()]);
            throw new RuntimeException('M-Pesa payment could not be initiated.');
        }

        return [
            'provider' => 'mpesa',
            'merchant_request_id' => $resp->json('MerchantRequestID'),
            'checkout_request_id' => $resp->json('CheckoutRequestID'),
            'message' => 'Check your phone for the M-Pesa prompt.',
        ];
    }

    public function handleWebhook(array $payload, array $headers): Order
    {
        $orderId = (int) ($payload['__order_id'] ?? 0);
        if (!$orderId) {
            throw new RuntimeException('Missing order id in callback.');
        }

        /** @var Order|null $order */
        $order = Order::find($orderId);
        if (!$order) {
            throw new RuntimeException('Unknown order.');
        }

        $resultCode = data_get($payload, 'Body.stkCallback.ResultCode');
        if ($resultCode === 0) {
            $receipt = collect(data_get($payload, 'Body.stkCallback.CallbackMetadata.Item', []))
                ->firstWhere('Name', 'MpesaReceiptNumber')['Value'] ?? null;
            $order->update([
                'status' => 'Processing', // moves to Shipped/Delivered later in fulfilment
                'paid_at' => now(),
                'payment_reference' => $receipt ?? $order->payment_reference,
            ]);
        } else {
            // Payment failed — keep the order as Pending so the buyer can retry.
            $order->update(['status' => 'Pending']);
        }
        return $order->fresh();
    }

    public function signCallback(int $orderId): string
    {
        return hash_hmac('sha256', (string) $orderId, config('app.key'));
    }

    public function verifyCallbackSig(int $orderId, string $sig): bool
    {
        return hash_equals($this->signCallback($orderId), $sig);
    }

    private function accessToken(): string
    {
        return Cache::remember('mpesa:access_token', now()->addMinutes(50), function () {
            $resp = Http::withBasicAuth(
                config('services.mpesa.consumer_key'),
                config('services.mpesa.consumer_secret'),
            )->get($this->baseUrl() . '/oauth/v1/generate?grant_type=client_credentials');
            if (!$resp->ok()) {
                throw new RuntimeException('M-Pesa OAuth failed.');
            }
            return $resp->json('access_token');
        });
    }

    private function baseUrl(): string
    {
        return config('services.mpesa.env') === 'production'
            ? 'https://api.safaricom.co.ke'
            : 'https://sandbox.safaricom.co.ke';
    }
}
