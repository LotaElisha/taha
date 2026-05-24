<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired whenever an order's status changes — fans out to the buyer's
 * private channel + the vendor's vendor channel so both dashboards update
 * in real time without polling.
 */
class OrderStatusUpdated implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(public readonly Order $order) {}

    public function broadcastOn(): array
    {
        $channels = [];
        if ($this->order->user_id) {
            $channels[] = new PrivateChannel("users.{$this->order->user_id}");
        }
        // Every vendor with a line in this order also wants the update.
        foreach ($this->order->items as $item) {
            $channels[] = new PrivateChannel("vendors.{$item->vendor_id}");
        }
        return $channels;
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->order->id,
            'status' => $this->order->status,
            'paid_at' => $this->order->paid_at,
            'total' => $this->order->total,
        ];
    }
}
