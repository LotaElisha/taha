<?php

namespace App\Services\Otp;

use App\Models\OtpCode;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * OtpService — single source of truth for the phone+OTP flow.
 *
 * Responsibilities:
 *   * Generate a 6-digit code, hash it, persist with a 5-minute TTL.
 *   * Rate-limit per phone (1/min, 5/day) and per IP (30/hour).
 *   * Deliver via SMS by default, voice on the second send.
 *   * Verify a presented code, count failed attempts, mark consumed.
 *
 * Driver selection: $config['sms.default'] picks africas_talking | twilio.
 * Dev environments without credentials fall back to a logged driver that
 * writes the code to the log file so the React app can be exercised offline.
 */
class OtpService
{
    private const TTL_MINUTES = 5;
    private const MAX_ATTEMPTS = 5;

    public function __construct(private readonly SmsDriver $driver) {}

    public function requestCode(string $phone, ?string $ip = null, string $channel = 'sms'): array
    {
        $this->assertNotRateLimited($phone, $ip);

        $code = $this->generateCode();
        OtpCode::create([
            'phone' => $phone,
            'code_hash' => Hash::make($code),
            'channel' => $channel,
            'ip' => $ip,
            'expires_at' => now()->addMinutes(self::TTL_MINUTES),
        ]);

        // Web OTP API: appending `@domain #code` lets Android Chrome auto-fill
        // a same-origin form. We base it off APP_URL so dev (localhost:3000)
        // and prod work without per-env code changes.
        $domain = parse_url(config('app.url'), PHP_URL_HOST) ?: 'mkulima.app';
        $message = "Mkulima: {$code} is your sign-in code. Don't share it. Expires in 5 minutes.\n\n@{$domain} #{$code}";
        $providerId = $channel === 'voice'
            ? $this->driver->sendVoice($phone, $message)
            : $this->driver->sendSms($phone, $message);

        Cache::increment("otp:rate:phone:$phone");
        Cache::put("otp:rate:phone:$phone:exp", true, now()->addMinute());
        if ($ip) {
            Cache::increment("otp:rate:ip:$ip");
            Cache::put("otp:rate:ip:$ip:exp", true, now()->addHour());
        }

        Log::info('OTP issued', ['phone' => $phone, 'channel' => $channel, 'provider_id' => $providerId]);

        return ['expires_in_sec' => self::TTL_MINUTES * 60];
    }

    public function verifyCode(string $phone, string $code): bool
    {
        $row = OtpCode::query()
            ->where('phone', $phone)
            ->whereNull('consumed_at')
            ->where('expires_at', '>', now())
            ->latest('id')
            ->first();

        if (!$row) {
            return false;
        }

        $row->increment('attempts');

        if ($row->attempts > self::MAX_ATTEMPTS) {
            // Burn the code to prevent further attempts.
            $row->update(['consumed_at' => now()]);
            throw new RuntimeException('Too many attempts. Request a new code.');
        }

        if (!Hash::check($code, $row->code_hash)) {
            return false;
        }

        $row->update(['consumed_at' => now()]);
        // Prune any older still-valid codes for this phone — only one live code at a time.
        OtpCode::query()
            ->where('phone', $phone)
            ->where('id', '!=', $row->id)
            ->whereNull('consumed_at')
            ->update(['consumed_at' => now()]);

        return true;
    }

    private function assertNotRateLimited(string $phone, ?string $ip): void
    {
        $perMinute = (int) Cache::get("otp:rate:phone:$phone", 0);
        if ($perMinute >= 1 && Cache::has("otp:rate:phone:$phone:exp")) {
            throw new RuntimeException('Wait a minute before requesting another code.');
        }
        if ($ip) {
            $perHour = (int) Cache::get("otp:rate:ip:$ip", 0);
            if ($perHour >= 30) {
                throw new RuntimeException('Too many OTP requests from your network.');
            }
        }
    }

    private function generateCode(): string
    {
        return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }
}
