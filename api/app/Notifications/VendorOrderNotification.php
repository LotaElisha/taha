<?php

namespace App\Notifications;

use App\Models\Order;
use App\Services\Whatsapp\WhatsappClient;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

/**
 * Notifies a vendor (Agrodealer/Agrovet) about a new online order over WhatsApp.
 * Runs on the queue so the buyer's checkout response isn't blocked by the
 * outbound Meta call.
 */
class VendorOrderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly Order $order) {}

    public function via(object $notifiable): array
    {
        return ['whatsapp'];
    }

    public function toWhatsapp(object $notifiable): void
    {
        $vendorPhone = $notifiable->whatsapp_config['phoneNumber']
            ?? $notifiable->phone
            ?? null;
        if (!$vendorPhone) {
            return;
        }

        $itemsForVendor = $this->order->items()
            ->where('vendor_id', $notifiable->id)
            ->get();
        if ($itemsForVendor->isEmpty()) {
            return;
        }

        $summary = $itemsForVendor
            ->map(fn($i) => "{$i->product_name} (x{$i->quantity})")
            ->implode(', ');

        $buyer = $this->order->user?->name
            ?? $this->order->guest_name
            ?? 'a customer';
        $contact = $this->order->user?->phone
            ?? $this->order->guest_phone
            ?? '—';
        $body = "Mkulima: new order #{$this->order->id} from {$buyer}. Items: {$summary}. Contact: {$contact}.";

        app(WhatsappClient::class)->sendText($vendorPhone, $body);
    }
}
