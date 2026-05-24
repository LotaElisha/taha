<?php

namespace App\Services\Otp;

use AfricasTalking\SDK\AfricasTalking;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class AfricasTalkingDriver implements SmsDriver
{
    public function __construct(
        private readonly string $username,
        private readonly string $apiKey,
        private readonly string $senderId,
    ) {}

    public function sendSms(string $phone, string $message): string
    {
        $at = new AfricasTalking($this->username, $this->apiKey);
        $result = $at->sms()->send([
            'to' => $phone,
            'message' => $message,
            'from' => $this->senderId,
        ]);
        $first = $result['data']->SMSMessageData->Recipients[0] ?? null;
        if (!$first || ($first->status ?? '') !== 'Success') {
            Log::warning('AT SMS failure', ['phone' => $phone, 'result' => $result]);
            throw new RuntimeException('SMS provider rejected the message.');
        }
        return $first->messageId ?? 'at-' . uniqid();
    }

    public function sendVoice(string $phone, string $message): string
    {
        $at = new AfricasTalking($this->username, $this->apiKey);
        $result = $at->voice()->call([
            'from' => $this->senderId,
            'to' => $phone,
        ]);
        // The full TTS playback callback URL is configured in the AT dashboard
        // — its script reads `$message` aloud using the sayMessage action.
        return $result['data']->entries[0]->sessionId ?? 'at-voice-' . uniqid();
    }
}
