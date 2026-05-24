<?php

namespace App\Http\Controllers\Api\AI;

use App\Services\Gemini\GeminiClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;

class PlantScanController extends Controller
{
    public function analyze(Request $request): JsonResponse
    {
        $data = $request->validate([
            'image' => ['required', 'string'], // base64 (no data: prefix)
            'mime' => ['required', 'string', 'in:image/jpeg,image/png,image/webp'],
            'language' => ['nullable', 'string', 'in:English,Swahili'],
        ]);
        $language = $data['language'] ?? 'English';
        $hash = hash('sha256', $data['image']);

        // Cache identical scans for 24h — saves Gemini cost on duplicate uploads.
        return Cache::remember(
            "plant-scan:$hash:$language",
            now()->addHours(24),
            function () use ($data, $language) {
                $client = new GeminiClient(
                    config('services.gemini.api_key'),
                    config('services.gemini.base_url'),
                );
                $body = [
                    'contents' => [[
                        'role' => 'user',
                        'parts' => [
                            ['inline_data' => ['mime_type' => $data['mime'], 'data' => $data['image']]],
                            ['text' => "Diagnose plant disease. Reply ONLY with JSON: {\"diagnosis\":string,\"causes\":string,\"recommendations\":string,\"suggestedProductTypes\":string[],\"confidence\":number}. All text in {$language}."],
                        ],
                    ]],
                    'generationConfig' => ['responseMimeType' => 'application/json'],
                ];
                $result = $client->generate(config('services.gemini.default_model'), $body);
                $text = $client->extractText($result);
                $parsed = json_decode($text, true) ?: [
                    'diagnosis' => 'Unknown',
                    'causes' => '',
                    'recommendations' => '',
                    'suggestedProductTypes' => [],
                    'confidence' => 0,
                ];
                return response()->json(['data' => $parsed]);
            }
        );
    }
}
