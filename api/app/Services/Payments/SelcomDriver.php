<?php

namespace App\Services\Payments;

use App\Models\Order;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Selcom Aggregator API — primary card + Tigo Pesa + Airtel Money gateway in TZ.
 *
 *   • Auth: HMAC-SHA256 over the request body, vendor id + secret in headers.
 *   • Charge returns a hosted checkout URL the React app opens.
 *   • IPN webhook is signed with the same vendor secret; we verify before
 *     mutating the order.
 */
class SelcomDriver implements PaymentDriver
{
    public function id(): string
    {
        return 'selcom';
    }

    public function charge(Order $order, array $context = []): array
    {
        $vendorId = config('services.selcom.vendor_id');
        $apiKey = config('services.selcom.api_key');
        $apiSecret = config('services.selcom.api_secret');
        if (!$vendorId || !$apiKey || !$apiSecret) {
            throw new RuntimeException('Selcom credentials are not configured.');
        }

        $body = [
            'vendor' => $vendorId,
            'order_id' => 'mkulima-' . $order->id,
            'buyer_name' => $order->user?->name ?? $order->guest_name ?? 'Mkulima customer',
            'buyer_phone' => $order->user?->phone ?? $order->guest_phone,
            'amount' => (int) round($order->total),
            'currency' => 'TZS',
            'redirect_url' => url('/api/v1/payments/selcom/return?order=' . $order->id),
            'cancel_url' => url('/api/v1/payments/selcom/cancel?order=' . $order->id),
            'webhook_url' => url('/api/v1/payments/selcom/ipn'),
            'no_of_items' => $order->items()->count(),
        ];

        $headers = $this->signedHeaders($body, $apiKey, $apiSecret);

        $resp = Http::withHeaders($headers)
            ->post('https://apigw.selcommobile.com/v1/checkout/create-order-minimal', $body);

        if (!$resp->ok()) {
            Log::warning('Selcom checkout failed', ['order' => $order->id, 'resp' => $resp->body()]);
            throw new RuntimeException('Selcom payment could not be initiated.');
        }

        $url = $resp->json('data.0.payment_gateway_url');
        $order->update(['payment_reference' => 'selcom-' . $order->id]);
        return ['provider' => 'selcom', 'checkout_url' => $url];
    }

    public function handleWebhook(array $payload, array $headers): Order
    {
        $providedDigest = $headers['Digest'] ?? $headers['digest'] ?? null;
        if (!$providedDigest || !$this->verifyIpnSignature($payload, $providedDigest)) {
            throw new RuntimeException('Selcom IPN signature mismatch.');
        }

        $reference = $payload['order_id'] ?? '';
        if (!str_starts_with($reference, 'mkulima-')) {
            throw new RuntimeException('Unrecognized order reference.');
        }
        $orderId = (int) substr($reference, strlen('mkulima-'));
        /** @var Order|null $order */
        $order = Order::find($orderId);
        if (!$order) {
            throw new RuntimeException('Unknown order.');
        }

        if (($payload['payment_status'] ?? '') === 'COMPLETED') {
            $order->update([
                'paid_at' => now(),
                'payment_reference' => $payload['transid'] ?? $order->payment_reference,
            ]);
        }
        return $order->fresh();
    }

    private function signedHeaders(array $body, string $apiKey, string $apiSecret): array
    {
        $timestamp = now()->toIso8601String();
        $payload = base64_encode(json_encode($body));
        $digest = base64_encode(hash_hmac('sha256', $payload, $apiSecret, true));
        return [
            'Content-Type' => 'application/json',
            'Authorization' => 'SELCOM ' . base64_encode($apiKey),
            'Digest-Method' => 'HS256',
            'Digest' => $digest,
            'Timestamp' => $timestamp,
            'Signed-Fields' => implode(',', array_keys($body)),
        ];
    }

    private function verifyIpnSignature(array $payload, string $providedDigest): bool
    {
        $apiSecret = config('services.selcom.api_secret');
        $serialized = base64_encode(json_encode($payload));
        $expected = base64_encode(hash_hmac('sha256', $serialized, $apiSecret, true));
        return hash_equals($expected, $providedDigest);
    }
}
