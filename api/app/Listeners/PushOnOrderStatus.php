<?php

namespace App\Listeners;

use App\Events\OrderStatusUpdated;
use App\Models\User;
use App\Services\Push\PushService;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * Pushes an order-status update to the buyer's devices. Quietly skips if
 * the order is a POS sale (no online user) or the buyer has no registered
 * push tokens.
 */
class PushOnOrderStatus implements ShouldQueue
{
    public function __construct(private readonly PushService $push) {}

    public function handle(OrderStatusUpdated $event): void
    {
        $order = $event->order;
        if (!$order->user_id) return;
        $user = User::find($order->user_id);
        if (!$user) return;

        $this->push->notify($user, [
            'title' => "Order #{$order->id} update",
            'body' => "Status: {$order->status}",
            'data' => ['type' => 'order', 'order_id' => $order->id],
        ]);
    }
}
