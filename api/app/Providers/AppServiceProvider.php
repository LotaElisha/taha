<?php

namespace App\Providers;

use App\Services\Otp\AfricasTalkingDriver;
use App\Services\Otp\OtpService;
use App\Services\Otp\SmsDriver;
use App\Services\Otp\LogSmsDriver;
use App\Services\Refunds\MpesaReversalDriver;
use App\Services\Refunds\RefundService;
use App\Services\Refunds\SelcomRefundDriver;
use App\Events\KycStatusUpdated;
use App\Events\OrderStatusUpdated;
use App\Listeners\PushOnKycStatus;
use App\Listeners\PushOnOrderStatus;
use App\Notifications\Channels\WhatsappChannel;
use App\Services\Whatsapp\WhatsappClient;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Pick the SMS driver from config — falls back to a logger-only driver
        // when the API key isn't configured, so dev works without credentials.
        $this->app->bind(SmsDriver::class, function () {
            $driver = config('services.sms.default', 'africas-talking');
            return match ($driver) {
                'africas-talking' => $this->buildAfricasTalking(),
                default => app(LogSmsDriver::class),
            };
        });

        $this->app->singleton(OtpService::class, fn($app) => new OtpService($app->make(SmsDriver::class)));

        $this->app->singleton(WhatsappClient::class, fn() => new WhatsappClient(
            config('services.whatsapp.phone_number_id'),
            config('services.whatsapp.access_token'),
        ));

        // RefundService takes an iterable of drivers — we register the two
        // network-backed ones; `manual` provider short-circuits inside the
        // service and never reaches a driver.
        $this->app->singleton(RefundService::class, fn ($app) => new RefundService([
            $app->make(MpesaReversalDriver::class),
            $app->make(SelcomRefundDriver::class),
        ]));
    }

    public function boot(): void
    {
        Event::listen(OrderStatusUpdated::class, PushOnOrderStatus::class);
        Event::listen(KycStatusUpdated::class, PushOnKycStatus::class);

        // Register the custom 'whatsapp' notification channel — Laravel's
        // notification dispatcher needs a driver class for any channel name
        // returned by `via()`. The adapter just calls the notification's
        // own toWhatsapp() method, which talks to WhatsappClient.
        Notification::extend('whatsapp', fn () => new WhatsappChannel());
    }

    private function buildAfricasTalking(): SmsDriver
    {
        $apiKey = config('services.africas_talking.api_key');
        if (!$apiKey) {
            return app(LogSmsDriver::class);
        }
        return new AfricasTalkingDriver(
            config('services.africas_talking.username'),
            $apiKey,
            config('services.africas_talking.sender_id', 'Mkulima'),
        );
    }
}
