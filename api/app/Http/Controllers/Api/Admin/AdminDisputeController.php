<?php

namespace App\Http\Controllers\Api\Admin;

use App\Jobs\ProcessRefundJob;
use App\Models\Dispute;
use App\Models\Refund;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Admin dispute queue + decisions.
 *
 *   GET    /api/v1/admin/disputes              — paginated, filtered list
 *   GET    /api/v1/admin/disputes/{dispute}    — detail
 *   POST   /api/v1/admin/disputes/{dispute}/approve — create refund + queue
 *   POST   /api/v1/admin/disputes/{dispute}/reject  — close without refund
 *
 * Roles: Admin | SuperAdmin | SupportAgent (gated at route level).
 */
class AdminDisputeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Dispute::query()
            ->with([
                'order:id,user_id,total,currency,status,payment_method_id,payment_reference,paid_at',
                'openedBy:id,name,phone,role',
                'decidedBy:id,name',
                'refund:id,dispute_id,status,amount,provider,refunded_at',
            ])
            ->latest();

        if ($status = $request->query('status')) {
            $q->where('status', $status);
        } else {
            // Default to active queue.
            $q->whereIn('status', ['Open', 'UnderReview']);
        }
        if ($reason = $request->query('reason')) {
            $q->where('reason', $reason);
        }

        return response()->json($q->paginate(50));
    }

    public function show(Dispute $dispute): JsonResponse
    {
        $dispute->load([
            'order.items',
            'order.user:id,name,phone',
            'openedBy:id,name,phone,role',
            'decidedBy:id,name',
            'refund',
        ]);
        return response()->json(['data' => $dispute]);
    }

    /**
     * Approve a dispute. Creates a Refund row (full or partial) and enqueues
     * the rail-side job. We pick the provider based on the order's original
     * payment method:
     *   • mpesa → mpesa_reversal
     *   • selcom → selcom_refund
     *   • cod / unknown → manual (admin will mark-refunded once the cash is
     *     handed back; no provider call).
     */
    public function approve(Request $request, Dispute $dispute): JsonResponse
    {
        if (!$dispute->isActionable()) {
            return response()->json([
                'message' => "Dispute is {$dispute->status}; cannot approve.",
            ], 422);
        }

        $order = $dispute->order;
        $maxAmount = (float) $order->total;

        $data = $request->validate([
            'amount' => [
                'required', 'numeric',
                'min:1',
                'max:' . $maxAmount,
            ],
            'note' => ['required', 'string', 'min:3', 'max:500'],
            // Optional override; otherwise we infer from the order.
            'provider' => ['nullable', Rule::in(['mpesa_reversal', 'selcom_refund', 'manual'])],
        ]);

        $provider = $data['provider'] ?? match ($order->payment_method_id) {
            'mpesa' => 'mpesa_reversal',
            'card', 'selcom' => 'selcom_refund',
            default => 'manual',
        };

        $refund = DB::transaction(function () use ($dispute, $order, $data, $provider) {
            $dispute->update([
                'status' => 'Approved',
                'decided_by_user_id' => Auth::id(),
                'resolution_note' => $data['note'],
                'decided_at' => now(),
            ]);
            $order->update(['dispute_status' => 'Approved']);

            return Refund::create([
                'dispute_id' => $dispute->id,
                'order_id' => $order->id,
                'recipient_id' => $order->user_id,
                'amount' => $data['amount'],
                'currency' => $order->currency,
                'status' => 'Pending',
                'provider' => $provider,
            ]);
        });

        // Manual provider doesn't dispatch — operator settles off-platform.
        if ($refund->provider !== 'manual') {
            ProcessRefundJob::dispatch($refund->id);
        }

        return response()->json([
            'data' => $dispute->fresh(['refund', 'decidedBy:id,name']),
        ]);
    }

    /**
     * Reject the dispute. Requires a note explaining why — that note is
     * customer-visible (the customer can see it on their dispute list).
     */
    public function reject(Request $request, Dispute $dispute): JsonResponse
    {
        if (!$dispute->isActionable()) {
            return response()->json([
                'message' => "Dispute is {$dispute->status}; cannot reject.",
            ], 422);
        }

        $data = $request->validate([
            'note' => ['required', 'string', 'min:3', 'max:500'],
        ]);

        DB::transaction(function () use ($dispute, $data) {
            $dispute->update([
                'status' => 'Rejected',
                'decided_by_user_id' => Auth::id(),
                'resolution_note' => $data['note'],
                'decided_at' => now(),
            ]);
            $dispute->order->update(['dispute_status' => 'Rejected']);
        });

        return response()->json([
            'data' => $dispute->fresh(['decidedBy:id,name']),
        ]);
    }
}
