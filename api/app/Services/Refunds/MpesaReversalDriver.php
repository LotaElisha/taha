<?php

namespace App\Services\Refunds;

use App\Models\Refund;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Safaricom Daraja Reversal API.
 *
 * Reverses an existing C2B (STK push) transaction. Requires the original
 * payment_reference (TransactionID) from the order. If the reference is
 * missing we mark the refund Failed immediately — there's nothing to
 * reverse on the rails.
 *
 * CommandID `TransactionReversal` is the only valid value here. ResultURL +
 * QueueTimeOutURL follow the same HMAC-signed pattern as B2C payouts so a
 * forged callback can't mark an arbitrary refund Refunded.
 */
class MpesaReversalDriver implements RefundDriver
{
    public function id(): string
    {
        return 'mpesa_reversal';
    }

    public function refund(Refund $refund): bool
    {
        $order = $refund->order;
        $txnId = $order?->payment_reference;
        if (!$txnId) {
            $refund->markFailed('Order has no M-Pesa transaction reference to reverse');
            return false;
        }

        $resultUrl = url('/api/v1/payments/mpesa/reversal/result?sig=' . $this->sign($refund->id) . '&refund=' . $refund->id);
        $timeoutUrl = url('/api/v1/payments/mpesa/reversal/timeout?sig=' . $this->sign($refund->id) . '&refund=' . $refund->id);

        try {
            $resp = Http::withToken($this->accessToken())
                ->post($this->baseUrl() . '/mpesa/reversal/v1/request', [
                    'Initiator' => config('services.mpesa.initiator_name'),
                    'SecurityCredential' => config('services.mpesa.initiator_security_credential'),
                    'CommandID' => 'TransactionReversal',
                    'TransactionID' => $txnId,
                    'Amount' => (int) round((float) $refund->amount),
                    'ReceiverParty' => (int) config('services.mpesa.shortcode'),
                    'RecieverIdentifierType' => 11, // 11 = Shortcode, per Daraja docs.
                    'Remarks' => 'Mkulima refund #' . $refund->id,
                    'QueueTimeOutURL' => $timeoutUrl,
                    'ResultURL' => $resultUrl,
                    'Occasion' => 'refund',
                ]);
        } catch (\Throwable $e) {
            Log::warning('M-Pesa Reversal HTTP error', ['refund' => $refund->id, 'error' => $e->getMessage()]);
            $refund->markFailed('HTTP error: ' . substr($e->getMessage(), 0, 200));
            return false;
        }

        if (!$resp->ok()) {
            Log::warning('M-Pesa Reversal rejected', ['refund' => $refund->id, 'resp' => $resp->body()]);
            $refund->markFailed('Daraja rejected: ' . substr($resp->body(), 0, 200));
            return false;
        }

        $refund->markProcessing($resp->json('ConversationID'));
        return true;
    }

    public function sign(int $refundId): string
    {
        return hash_hmac('sha256', 'refund:' . $refundId, config('app.key'));
    }

    public function verifySig(int $refundId, string $sig): bool
    {
        return hash_equals($this->sign($refundId), $sig);
    }

    private function accessToken(): string
    {
        return Cache::remember('mpesa:reversal:access_token', now()->addMinutes(50), function () {
            $resp = Http::withBasicAuth(
                config('services.mpesa.consumer_key'),
                config('services.mpesa.consumer_secret'),
            )->get($this->baseUrl() . '/oauth/v1/generate?grant_type=client_credentials');
            if (!$resp->ok()) {
                throw new \RuntimeException('M-Pesa OAuth failed.');
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
