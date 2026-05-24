<?php

namespace App\Http\Controllers\Api;

use App\Models\Dispute;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

/**
 * Customer-facing dispute surface.
 *
 *   POST /api/v1/orders/{order}/disputes  — open a dispute
 *   GET  /api/v1/disputes/mine             — list caller's disputes
 *
 * Admin endpoints live in Admin\AdminDisputeController.
 */
class DisputeController extends Controller
{
    /**
     * Open a dispute on an order the caller owns.
     *
     * Guard rails (in order):
     *   1. Caller must own the order.
     *   2. Order must be Delivered or Completed (otherwise nothing to dispute).
     *   3. Dispute window not closed.
     *   4. No existing Open / UnderReview / Approved dispute on the order.
     */
    public function store(Request $request, Order $order): JsonResponse
    {
        $user = Auth::user();
        abort_unless($user, 401);

        if ($order->user_id !== $user->id) {
            return response()->json(['message' => 'You can only dispute your own orders.'], 403);
        }

        if (!in_array($order->status, ['Delivered', 'Completed'], true)) {
            return response()->json([
                'message' => 'You can only dispute a delivered order.',
            ], 422);
        }

        if ($order->disputable_until && $order->disputable_until->isPast()) {
            return response()->json([
                'message' => 'The dispute window for this order has closed.',
            ], 422);
        }

        if (!$order->isDisputable()) {
            return response()->json([
                'message' => 'This order already has an active dispute.',
            ], 422);
        }

        $data = $request->validate([
            'reason' => ['required', 'string', Rule::in(Dispute::REASONS)],
            'description' => ['nullable', 'string', 'max:2000'],
        ]);

        $dispute = Dispute::create([
            'order_id' => $order->id,
            'opened_by_user_id' => $user->id,
            'reason' => $data['reason'],
            'description' => $data['description'] ?? null,
            'status' => 'Open',
        ]);

        // Mirror dispute_status on the order so listing queries can filter
        // without a join.
        $order->update(['dispute_status' => 'Open']);

        return response()->json(['data' => $dispute->fresh()], 201);
    }

    /**
     * GET /api/v1/disputes/mine — caller's disputes, latest first.
     */
    public function mine(Request $request): JsonResponse
    {
        $user = Auth::user();
        abort_unless($user, 401);

        $q = Dispute::query()
            ->with(['order:id,total,currency,status', 'refund'])
            ->where('opened_by_user_id', $user->id)
            ->latest();

        return response()->json($q->paginate(50));
    }
}
