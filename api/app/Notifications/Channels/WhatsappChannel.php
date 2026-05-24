<?php

namespace App\Notifications\Channels;

use Illuminate\Notifications\Notification;

/**
 * WhatsappChannel — tiny adapter that lets Laravel's notification system
 * route channel `whatsapp` to the notification's own `toWhatsapp()` method.
 *
 * Registered in AppServiceProvider via Notification::extend('whatsapp', …).
 * Each VendorOrderNotification etc. is responsible for actually calling
 * App\Services\Whatsapp\WhatsappClient inside its toWhatsapp() — keeps the
 * channel adapter dumb and the message contracts close to the data.
 */
class WhatsappChannel
{
    public function send(object $notifiable, Notification $notification): void
    {
        if (method_exists($notification, 'toWhatsapp')) {
            $notification->toWhatsapp($notifiable);
        }
    }
}
