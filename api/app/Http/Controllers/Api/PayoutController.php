<?php

namespace App\Http\Controllers\Api;

use App\Jobs\ProcessPayoutJob;
use App\Models\Payout;
use App\Services\Payouts\MpesaB2cDriver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class PayoutController extends Controller
{
    /**
     * Admin payouts queue. Gated by Admin/SuperAdmin/FinancialAuditor at
     * the route definition. Filter via `?status=Failed&recipient=123`.
     */
    public function index(Request $request): JsonResponse
    {
        $q = Payout::query()
            ->with(['recipient:id,name,phone,role', 'payable'])
            ->latest();

        if ($status = $request->query('status')) {
            $q->where('status', $status);
        }
        if ($recipient = $request->query('recipient')) {
            $q->where('recipient_id', (int) $recipient);
        }

        return response()->json($q->paginate(50));
    }

    /**
     * POST /api/v1/payments/mpesa/b2c/result — Safaricom callback when a
     * B2C transfer settles (or fails). Signed URL prevents forgery.
     */
    public function mpesaResult(Request $request): JsonResponse
    {
        $payoutId = (int) $request->query('payout', 0);
        $sig = (string) $request->query('sig', '');
        $driver = app(MpesaB2cDriver::class);

        if (!$payoutId || !$driver->verifySig($payoutId, $sig)) {
            Log::warning('Invalid B2C result signature', ['payoutId' => $payoutId]);
            return response()->json(['ResultCode' => 1, 'ResultDesc' => 'Bad signature']);
        }

        /** @var Payout|null $payout */
        $payout = Payout::find($payoutId);
        if (!$payout) {
            return response()->json(['ResultCode' => 1, 'ResultDesc' => 'Unknown payout']);
        }

        $resultCode = data_get($request->all(), 'Result.ResultCode');
        $conversationId = data_get($request->all(), 'Result.ConversationID');

        if ($resultCode === 0) {
            $payout->markPaid($conversationId ?? $payout->provider_reference);
        } else {
            $payout->markFailed(
                data_get($request->all(), 'Result.ResultDesc', 'M-Pesa B2C failed')
            );
        }

        return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Accepted']);
    }

    /** Queue-timeout callback. We mark the payout Failed; admin can retry. */
    public function mpesaTimeout(Request $request): JsonResponse
    {
        $payoutId = (int) $request->query('payout', 0);
        $sig = (string) $request->query('sig', '');
        $driver = app(MpesaB2cDriver::class);

        if (!$payoutId || !$driver->verifySig($payoutId, $sig)) {
            return response()->json(['ResultCode' => 1, 'ResultDesc' => 'Bad signature']);
        }

        $payout = Payout::find($payoutId);
        $payout?->markFailed('M-Pesa B2C queue timeout');
        return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Accepted']);
    }

    /**
     * POST /api/v1/admin/payouts/{payout}/retry
     *
     * Re-dispatch a Failed (or stuck Pending) payout. Refuses if it's already
     * Paid or Cancelled — those are terminal states. The Process job picks
     * the row up and tries the driver again; the activity log records the
     * attempt count from the model trait.
     */
    public function retry(Request $request, Payout $payout): JsonResponse
    {
        if (in_array($payout->status, ['Paid', 'Cancelled'], true)) {
            return response()->json(
                ['message' => "Payout is already {$payout->status}; nothing to retry."],
                422,
            );
        }
        // Reset to Pending so the job's own gate (acts only on Pending/Failed) fires.
        $payout->update([
            'status' => 'Pending',
            'failure_reason' => null,
        ]);
        ProcessPayoutJob::dispatch($payout->id);
        return response()->json(['data' => $payout->fresh()]);
    }

    /**
     * POST /api/v1/admin/payouts/{payout}/mark-paid
     *
     * For off-platform settlements — e.g. bank wire, cash, or a manual M-Pesa
     * transfer initiated outside Mkulima. The note is required so the audit
     * log captures *why*, not just *when*.
     */
    public function markPaid(Request $request, Payout $payout): JsonResponse
    {
        $data = $request->validate([
            'note' => ['required', 'string', 'min:3', 'max:500'],
            'provider_reference' => ['nullable', 'string', 'max:120'],
        ]);
        if ($payout->status === 'Paid') {
            return response()->json(['message' => 'Already Paid.'], 422);
        }
        if ($payout->status === 'Cancelled') {
            return response()->json(['message' => 'Cannot mark a Cancelled payout as Paid.'], 422);
        }
        $payout->update([
            'status' => 'Paid',
            'paid_at' => now(),
            'failure_reason' => "MANUAL: {$data['note']}",
            'provider_reference' => $data['provider_reference'] ?? $payout->provider_reference,
        ]);
        return response()->json(['data' => $payout->fresh()]);
    }

    /**
     * POST /api/v1/admin/payouts/{payout}/cancel
     *
     * Voids a payout that should never be paid (e.g. duplicate, fraudulent
     * trip, recipient changed account). Refuses Paid rows — once money is
     * out the door, reversal is a separate flow.
     */
    public function cancel(Request $request, Payout $payout): JsonResponse
    {
        $data = $request->validate([
            'note' => ['required', 'string', 'min:3', 'max:500'],
        ]);
        if ($payout->status === 'Paid') {
            return response()->json(['message' => 'Cannot cancel a Paid payout.'], 422);
        }
        $payout->update([
            'status' => 'Cancelled',
            'failure_reason' => "CANCELLED: {$data['note']}",
        ]);
        return response()->json(['data' => $payout->fresh()]);
    }
}
