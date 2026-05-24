<?php

namespace App\Services\Payouts;

use App\Models\Payout;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Safaricom Daraja B2C — Business → Customer disbursement.
 *
 *   • OAuth access token cached for ~50 min (same as the STK push driver).
 *   • CommandID `BusinessPayment` is the "salary"-style payout. Other options
 *     (SalaryPayment, PromotionPayment) require an Initiator with different
 *     permissions; BusinessPayment is the safe default for vendor settlements.
 *   • SecurityCredential is the initiator password encrypted with Safaricom's
 *     public certificate. In sandbox we use the published test cert; in prod
 *     this needs to be re-encrypted with the live cert. The encrypted value
 *     lives in the env so we don't ship plaintext credentials.
 *   • ResultURL / QueueTimeOutURL are signed with HMAC of the payout id so
 *     forged callbacks can't mark an arbitrary payout Paid.
 */
class MpesaB2cDriver implements PayoutDriver
{
    public function id(): string
    {
        return 'mpesa_b2c';
    }

    public function disburse(Payout $payout): bool
    {
        $recipient = $payout->recipient;
        if (!$recipient || !$recipient->phone) {
            $payout->markFailed('Recipient has no phone on file');
            return false;
        }

        $phone = ltrim(preg_replace('/\D/', '', $recipient->phone), '0');

        $resultUrl = url('/api/v1/payments/mpesa/b2c/result?sig=' . $this->sign($payout->id) . '&payout=' . $payout->id);
        $timeoutUrl = url('/api/v1/payments/mpesa/b2c/timeout?sig=' . $this->sign($payout->id) . '&payout=' . $payout->id);

        try {
            $resp = Http::withToken($this->accessToken())
                ->post($this->baseUrl() . '/mpesa/b2c/v3/paymentrequest', [
                    'OriginatorConversationID' => 'mkulima-payout-' . $payout->id,
                    'InitiatorName' => config('services.mpesa.initiator_name'),
                    'SecurityCredential' => config('services.mpesa.initiator_security_credential'),
                    'CommandID' => 'BusinessPayment',
                    'Amount' => (int) round((float) $payout->amount),
                    'PartyA' => (int) config('services.mpesa.shortcode'),
                    'PartyB' => (int) $phone,
                    'Remarks' => 'Mkulima payout #' . $payout->id,
                    'QueueTimeOutURL' => $timeoutUrl,
                    'ResultURL' => $resultUrl,
                    'Occasion' => 'payout',
                ]);
        } catch (\Throwable $e) {
            Log::warning('M-Pesa B2C HTTP error', ['payout' => $payout->id, 'error' => $e->getMessage()]);
            $payout->markFailed('HTTP error: ' . substr($e->getMessage(), 0, 200));
            return false;
        }

        if (!$resp->ok()) {
            Log::warning('M-Pesa B2C rejected', ['payout' => $payout->id, 'resp' => $resp->body()]);
            $payout->markFailed('Daraja rejected: ' . substr($resp->body(), 0, 200));
            return false;
        }

        $payout->markProcessing($resp->json('ConversationID'));
        return true;
    }

    public function sign(int $payoutId): string
    {
        return hash_hmac('sha256', (string) $payoutId, config('app.key'));
    }

    public function verifySig(int $payoutId, string $sig): bool
    {
        return hash_equals($this->sign($payoutId), $sig);
    }

    private function accessToken(): string
    {
        return Cache::remember('mpesa:b2c:access_token', now()->addMinutes(50), function () {
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
