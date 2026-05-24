<?php

namespace App\Http\Controllers\Api\AI;

use App\Models\Product;
use App\Services\Gemini\GeminiClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class SearchController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        $data = $request->validate([
            'q' => ['required', 'string', 'min:2', 'max:120'],
        ]);

        // Snapshot the catalog narrowly — only id/name/description/category go to Gemini.
        $catalog = Product::query()
            ->select(['id', 'name', 'description', 'category'])
            ->limit(500)
            ->get()
            ->toArray();

        $client = new GeminiClient(
            config('services.gemini.api_key'),
            config('services.gemini.base_url'),
        );
        $body = [
            'contents' => [['role' => 'user', 'parts' => [[
                'text' => "Query: \"{$data['q']}\". Products: " . json_encode($catalog) . " Return JSON { \"productIds\": string[] } ranked by relevance.",
            ]]]],
            'generationConfig' => ['responseMimeType' => 'application/json'],
        ];
        $result = $client->generate(config('services.gemini.default_model'), $body);
        $text = $client->extractText($result);
        $parsed = json_decode($text, true) ?: ['productIds' => []];
        return response()->json(['data' => $parsed]);
    }
}
