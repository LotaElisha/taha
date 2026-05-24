<?php

namespace App\Http\Controllers\Api;

use App\Events\LowStockAlert;
use App\Events\OrderStatusUpdated;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Notifications\VendorOrderNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class OrderController extends Controller
{
    public function mine(Request $request): JsonResponse
    {
        $user = $request->user();
        $orders = Order::query()
            ->where('user_id', $user->id)
            ->with('items')
            ->latest()
            ->paginate(20);
        return response()->json($orders);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'delivery_option_id' => ['required', 'string', 'max:32'],
            'delivery_cost' => ['required', 'numeric', 'min:0'],
            'payment_method_id' => ['required', 'string', 'max:32'],

            // Guest checkout (only present when not authenticated).
            'guest_name' => ['nullable', 'string', 'max:120'],
            'guest_phone' => ['nullable', 'string', 'max:20'],
            'guest_address' => ['nullable', 'string', 'max:500'],
        ]);

        $user = $request->user();
        if (!$user) {
            $request->validate([
                'guest_name' => ['required', 'string', 'max:120'],
                'guest_phone' => ['required', 'string', 'max:20'],
                'guest_address' => ['required', 'string', 'max:500'],
            ]);
        }

        return DB::transaction(function () use ($data, $user) {
            $subtotal = 0;
            $rows = [];

            // Lock each product row to prevent concurrent stock oversell.
            foreach ($data['items'] as $line) {
                /** @var Product $p */
                $p = Product::lockForUpdate()->findOrFail($line['product_id']);
                if ($p->stock < $line['quantity']) {
                    abort(422, "Not enough stock for {$p->name}.");
                }
                $lineTotal = (float) $p->price * $line['quantity'];
                $subtotal += $lineTotal;
                $rows[] = [
                    'product' => $p,
                    'quantity' => $line['quantity'],
                    'unit_price' => $p->price,
                    'line_total' => $lineTotal,
                ];
                $p->decrement('stock', $line['quantity']);
                if ($p->stock < 10) {
                    LowStockAlert::dispatch($p->fresh());
                }
            }

            $order = Order::create([
                'user_id' => $user?->id,
                'guest_name' => $data['guest_name'] ?? null,
                'guest_phone' => $data['guest_phone'] ?? null,
                'guest_address' => $data['guest_address'] ?? null,
                'subtotal' => $subtotal,
                'delivery_cost' => $data['delivery_cost'],
                'total' => $subtotal + $data['delivery_cost'],
                'currency' => 'TZS',
                'status' => 'Processing',
                'channel' => 'online',
                'delivery_option_id' => $data['delivery_option_id'],
                'payment_method_id' => $data['payment_method_id'],
            ]);

            foreach ($rows as $r) {
                $order->items()->create([
                    'product_id' => $r['product']->id,
                    'vendor_id' => $r['product']->vendor_id,
                    'product_name' => $r['product']->name,
                    'quantity' => $r['quantity'],
                    'unit_price' => $r['unit_price'],
                    'line_total' => $r['line_total'],
                ]);
            }

            $order = $order->fresh('items');

            // Notify every vendor whose product is in this order. Queued
            // notification — the buyer's HTTP response isn't delayed.
            $vendorIds = collect($rows)->pluck('product.vendor_id')->unique()->all();
            User::whereIn('id', $vendorIds)->get()
                ->each(fn($v) => Notification::send($v, new VendorOrderNotification($order)));

            // Realtime fan-out to the buyer + every vendor channel.
            OrderStatusUpdated::dispatch($order);

            return response()->json(['data' => $order], 201);
        });
    }
}
