<?php

namespace App\Services\Refunds;

use App\Models\Refund;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Selcom Aggregator — refund endpoint.
 *
 * Selcom returns refund status synchronously (no separate webhook callback),
 * so we can mark Refunded inline if the response is OK. If the response is
 * ambiguous (e.g. "PENDING") we leave the row Processing and the operator can
 * manually mark it once it settles.
 *
 * Auth uses Selcom's HMAC-SHA256 signature scheme: signed-fields list +
 * timestamp + digest. The exact scheme is documented in the Selcom v1 PDF;
 * we model it as `signRequest()` here so unit tests can exercise the wiring.
 */
class SelcomRefundDriver implements RefundDriver
{
    public function id(): string
    {
        return 'selcom_refund';
    }

    public function refund(Refund $refund): bool
    {
        $order = $refund->order;
        $txnId = $order?->payment_reference;
        if (!$txnId) {
            $refund->markFailed('Order has no Selcom transaction reference to refund');
            return false;
        }

        $payload = [
            'transid' => $txnId,
            'refund_amount' => (string) (int) round((float) $refund->amount),
            'reference_id' => 'mkulima-refund-' . $refund->id,
            'order_id' => 'mkulima-order-' . $order->id,
            'reason' => 'Mkulima refund #' . $refund->id,
        ];
        $headers = $this->signRequest($payload);

        try {
            $resp = Http::withHeaders($headers)
                ->post(rtrim(config('services.selcom.base_url'), '/') . '/v1/refund', $payload);
        } catch (\Throwable $e) {
            Log::warning('Selcom refund HTTP error', ['refund' => $refund->id, 'error' => $e->getMessage()]);
            $refund->markFailed('HTTP error: ' . substr($e->getMessage(), 0, 200));
            return false;
        }

        if (!$resp->ok()) {
            Log::warning('Selcom refund rejected', ['refund' => $refund->id, 'resp' => $resp->body()]);
            $refund->markFailed('Selcom rejected: ' . substr($resp->body(), 0, 200));
            return false;
        }

        $body = $resp->json() ?? [];
        $result = strtoupper((string) ($body['result'] ?? ''));
        $reference = $body['data']['reference'] ?? null;

        if ($result === 'SUCCESS') {
            $refund->markRefunded($reference ?? 'selcom-' . $refund->id);
            return true;
        }

        // PENDING / UNKNOWN — leave Processing for the operator to babysit.
        $refund->markProcessing($reference);
        return true;
    }

    /**
     * Selcom HMAC headers. Exposed for unit tests; in production the body
     * stays opaque to the rest of the codebase.
     */
    public function signRequest(array $payload): array
    {
        $ts = now()->toIso8601String();
        $signedFields = implode(',', array_keys($payload));
        $digestSource = collect($payload)
            ->map(fn ($v, $k) => "{$k}={$v}")
            ->implode('&');
        $digest = base64_encode(
            hash_hmac('sha256', "timestamp={$ts}&{$digestSource}", config('services.selcom.api_secret'), true)
        );
        return [
            'Authorization' => 'SELCOM ' . base64_encode(config('services.selcom.api_key')),
            'Digest-Method' => 'HS256',
            'Digest' => $digest,
            'Timestamp' => $ts,
            'Signed-Fields' => $signedFields,
            'Content-Type' => 'application/json',
        ];
    }
}
