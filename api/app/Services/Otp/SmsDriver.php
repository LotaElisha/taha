<?php

namespace App\Services\Otp;

interface SmsDriver
{
    /** Send a one-time code by SMS. Returns the provider's message id on success. */
    public function sendSms(string $phone, string $message): string;

    /**
     * Place a TTS voice call that reads the code aloud.
     * Returns the provider's call id on success.
     */
    public function sendVoice(string $phone, string $message): string;
}
