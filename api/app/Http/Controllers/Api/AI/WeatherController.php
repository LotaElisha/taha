<?php

namespace App\Http\Controllers\Api\AI;

use App\Services\Gemini\GeminiClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;

class WeatherController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $data = $request->validate([
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lon' => ['required', 'numeric', 'between:-180,180'],
            'language' => ['nullable', 'string', 'in:English,Swahili'],
        ]);
        $language = $data['language'] ?? 'English';
        // Quantize the cell to ~1.1 km so nearby farmers share a cache entry.
        $cellLat = round((float) $data['lat'], 2);
        $cellLon = round((float) $data['lon'], 2);

        return Cache::remember(
            "weather:{$cellLat}:{$cellLon}:{$language}",
            now()->addMinutes(30),
            function () use ($cellLat, $cellLon, $language) {
                $client = new GeminiClient(
                    config('services.gemini.api_key'),
                    config('services.gemini.base_url'),
                );
                $prompt = "Use Google Search to find current weather and 3-day agricultural forecast for lat {$cellLat}, lon {$cellLon}. Recommend the top 3 crops to plant in this East African region now. Reply ONLY with JSON shaped: { weather: { temp, condition, icon, humidity, windSpeed, forecast: [{date,temp,condition,icon}] }, advice: { bestCrops: [{name,reason,plantingTip}], soilPreparation, alert? } }. All text in {$language}.";
                $body = [
                    'contents' => [['role' => 'user', 'parts' => [['text' => $prompt]]]],
                    'tools' => [['google_search' => (object)[]]],
                    'generationConfig' => ['responseMimeType' => 'application/json'],
                ];
                $result = $client->generate(config('services.gemini.pro_model'), $body);
                $text = $client->extractText($result);
                $parsed = json_decode($text, true) ?: [
                    'weather' => [
                        'temp' => 24, 'condition' => 'Clear', 'icon' => '☀️',
                        'humidity' => 60, 'windSpeed' => 10, 'forecast' => [],
                    ],
                    'advice' => ['bestCrops' => [], 'soilPreparation' => 'Check moisture before planting.'],
                ];
                return response()->json(['data' => $parsed]);
            }
        );
    }
}
