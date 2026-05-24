<?php

namespace App\Events;

use App\Models\Product;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired by the OrderController stock-decrement path when a product's
 * remaining stock crosses the 10-unit threshold downward.
 */
class LowStockAlert implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(public readonly Product $product) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel("vendors.{$this->product->vendor_id}")];
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->product->id,
            'name' => $this->product->name,
            'stock' => $this->product->stock,
        ];
    }
}
