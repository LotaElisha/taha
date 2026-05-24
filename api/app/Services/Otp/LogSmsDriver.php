<?php

namespace App\Services\Otp;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * LogSmsDriver — dev fallback used when no real SMS credentials are configured.
 * Writes the message to the Laravel log (storage/logs/laravel.log) so the
 * React app can be exercised end-to-end without an Africa's Talking key.
 */
class LogSmsDriver implements SmsDriver
{
    public function sendSms(string $phone, string $message): string
    {
        Log::info("[OTP/SMS] {$phone} :: {$message}");
        return 'log-' . Str::uuid();
    }

    public function sendVoice(string $phone, string $message): string
    {
        Log::info("[OTP/VOICE] {$phone} :: {$message}");
        return 'log-voice-' . Str::uuid();
    }
}
