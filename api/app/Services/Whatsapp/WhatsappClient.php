<?php

namespace App\Services\Whatsapp;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Meta WhatsApp Cloud API wrapper. The access token NEVER leaves the server.
 *
 *   • Prefers an approved template message when one is supplied (better
 *     deliverability for outbound messages outside the 24h window).
 *   • Falls back to a free-form text message inside an active session.
 */
class WhatsappClient
{
    public function __construct(
        private readonly ?string $phoneNumberId,
        private readonly ?string $accessToken,
    ) {}

    public function sendText(string $recipient, string $body): ?string
    {
        if (!$this->ready()) {
            Log::info('[WhatsApp/dev] would send', ['to' => $recipient, 'body' => $body]);
            return null;
        }

        $resp = Http::withToken($this->accessToken)
            ->post("https://graph.facebook.com/v20.0/{$this->phoneNumberId}/messages", [
                'messaging_product' => 'whatsapp',
                'to' => preg_replace('/\D/', '', $recipient),
                'type' => 'text',
                'text' => ['body' => $body],
            ]);

        if (!$resp->ok()) {
            Log::warning('WhatsApp send failed', ['status' => $resp->status(), 'body' => $resp->body()]);
            return null;
        }
        return $resp->json('messages.0.id');
    }

    public function sendTemplate(string $recipient, string $template, array $params = []): ?string
    {
        if (!$this->ready()) {
            Log::info('[WhatsApp/dev] would send template', [
                'to' => $recipient, 'template' => $template, 'params' => $params,
            ]);
            return null;
        }
        $resp = Http::withToken($this->accessToken)
            ->post("https://graph.facebook.com/v20.0/{$this->phoneNumberId}/messages", [
                'messaging_product' => 'whatsapp',
                'to' => preg_replace('/\D/', '', $recipient),
                'type' => 'template',
                'template' => [
                    'name' => $template,
                    'language' => ['code' => 'en'],
                    'components' => [[
                        'type' => 'body',
                        'parameters' => array_map(fn($v) => ['type' => 'text', 'text' => (string) $v], $params),
                    ]],
                ],
            ]);
        if (!$resp->ok()) {
            Log::warning('WhatsApp template failed', ['status' => $resp->status(), 'body' => $resp->body()]);
            return null;
        }
        return $resp->json('messages.0.id');
    }

    private function ready(): bool
    {
        return !empty($this->phoneNumberId) && !empty($this->accessToken);
    }
}
