<?php

namespace App\Http\Controllers\Api;

use App\Jobs\ProcessRefundJob;
use App\Models\Refund;
use App\Services\Refunds\MpesaReversalDriver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;

/**
 * Admin refund queue + operator actions. Mirrors PayoutController so the
 * UI / role gates / muscle memory all transfer.
 *
 *   GET    /api/v1/admin/refunds                 — filtered list
 *   POST   /api/v1/admin/refunds/{refund}/retry  — re-dispatch a Failed refund
 *   POST   /api/v1/admin/refunds/{refund}/mark-refunded
 *   POST   /api/v1/admin/refunds/{refund}/cancel
 *
 * Plus the two M-Pesa Reversal callback endpoints (signed, public) so Daraja
 * can settle Refunded / Failed asynchronously.
 */
class RefundController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Refund::query()
            ->with([
                'recipient:id,name,phone,role',
                'order:id,total,currency,payment_method_id',
                'dispute:id,reason,status',
            ])
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
     * POST /api/v1/payments/mpesa/reversal/result — Daraja webhook.
     * Signed URL prevents forgery.
     */
    public function mpesaResult(Request $request): JsonResponse
    {
        $refundId = (int) $request->query('refund', 0);
        $sig = (string) $request->query('sig', '');
        $driver = app(MpesaReversalDriver::class);

        if (!$refundId || !$driver->verifySig($refundId, $sig)) {
            Log::warning('Invalid reversal result signature', ['refundId' => $refundId]);
            return response()->json(['ResultCode' => 1, 'ResultDesc' => 'Bad signature']);
        }

        /** @var Refund|null $refund */
        $refund = Refund::find($refundId);
        if (!$refund) {
            return response()->json(['ResultCode' => 1, 'ResultDesc' => 'Unknown refund']);
        }

        $resultCode = data_get($request->all(), 'Result.ResultCode');
        $conversationId = data_get($request->all(), 'Result.ConversationID');

        if ($resultCode === 0) {
            $refund->markRefunded($conversationId ?? $refund->provider_reference);
        } else {
            $refund->markFailed(
                data_get($request->all(), 'Result.ResultDesc', 'M-Pesa reversal failed')
            );
        }

        return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Accepted']);
    }

    public function mpesaTimeout(Request $request): JsonResponse
    {
        $refundId = (int) $request->query('refund', 0);
        $sig = (string) $request->query('sig', '');
        $driver = app(MpesaReversalDriver::class);

        if (!$refundId || !$driver->verifySig($refundId, $sig)) {
            return response()->json(['ResultCode' => 1, 'ResultDesc' => 'Bad signature']);
        }

        $refund = Refund::find($refundId);
        $refund?->markFailed('M-Pesa reversal queue timeout');
        return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Accepted']);
    }

    /**
     * POST /api/v1/admin/refunds/{refund}/retry — re-dispatch a Failed (or
     * stuck Pending) refund. Same gate as the payout equivalent.
     */
    public function retry(Request $request, Refund $refund): JsonResponse
    {
        if (in_array($refund->status, ['Refunded', 'Cancelled'], true)) {
            return response()->json(
                ['message' => "Refund is already {$refund->status}; nothing to retry."],
                422,
            );
        }
        $refund->update([
            'status' => 'Pending',
            'failure_reason' => null,
        ]);
        ProcessRefundJob::dispatch($refund->id);
        return response()->json(['data' => $refund->fresh()]);
    }

    /**
     * POST /api/v1/admin/refunds/{refund}/mark-refunded — for off-platform
     * settlements (cash returned, bank wire). Required for `manual` refunds
     * and as an escape hatch when a provider is stuck.
     */
    public function markRefunded(Request $request, Refund $refund): JsonResponse
    {
        $data = $request->validate([
            'note' => ['required', 'string', 'min:3', 'max:500'],
            'provider_reference' => ['nullable', 'string', 'max:120'],
        ]);
        if ($refund->status === 'Refunded') {
            return response()->json(['message' => 'Already Refunded.'], 422);
        }
        if ($refund->status === 'Cancelled') {
            return response()->json(['message' => 'Cannot mark a Cancelled refund as Refunded.'], 422);
        }
        $refund->update([
            'status' => 'Refunded',
            'refunded_at' => now(),
            'failure_reason' => "MANUAL: {$data['note']}",
            'provider_reference' => $data['provider_reference'] ?? $refund->provider_reference,
        ]);
        // Advance the dispute if one's attached.
        $refund->dispute()->whereIn('status', ['Approved'])->update([
            'status' => 'Resolved',
        ]);
        return response()->json(['data' => $refund->fresh()]);
    }

    /**
     * POST /api/v1/admin/refunds/{refund}/cancel — void a refund that should
     * never settle (e.g. duplicate row, customer accepted store credit).
     */
    public function cancel(Request $request, Refund $refund): JsonResponse
    {
        $data = $request->validate([
            'note' => ['required', 'string', 'min:3', 'max:500'],
        ]);
        if ($refund->status === 'Refunded') {
            return response()->json(['message' => 'Cannot cancel a Refunded refund.'], 422);
        }
        $refund->update([
            'status' => 'Cancelled',
            'failure_reason' => "CANCELLED: {$data['note']}",
        ]);
        return response()->json(['data' => $refund->fresh()]);
    }
}
