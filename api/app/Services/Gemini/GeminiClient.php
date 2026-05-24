<?php

namespace App\Services\Gemini;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Gemini REST client. Server-side only — the API key never leaves PHP.
 * Hits the public generativelanguage endpoint with $apiKey as a query string,
 * because that's still how the public REST API authenticates as of writing.
 */
class GeminiClient
{
    public function __construct(
        private readonly string $apiKey,
        private readonly string $baseUrl,
    ) {}

    public function generate(string $model, array $body): array
    {
        if (!$this->apiKey) {
            throw new RuntimeException('GEMINI_API_KEY is not configured.');
        }
        $response = Http::timeout(60)
            ->acceptJson()
            ->asJson()
            ->post("{$this->baseUrl}/models/{$model}:generateContent?key={$this->apiKey}", $body);

        if (!$response->ok()) {
            throw new RuntimeException("Gemini API error: " . $response->status() . ' ' . $response->body());
        }
        return $response->json();
    }

    public function extractText(array $payload): string
    {
        return $payload['candidates'][0]['content']['parts'][0]['text'] ?? '';
    }
}
