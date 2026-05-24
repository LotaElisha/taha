<?php

namespace App\Http\Controllers\Api;

use App\Models\PushToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;

class PushTokenController extends Controller
{
    /**
     * POST /api/v1/push-tokens — idempotent. The same token from the same
     * device should not produce duplicates, so we upsert on (user, token).
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string', 'max:4096'],
            'platform' => ['required', Rule::in(['web', 'expo'])],
            'keys' => ['nullable', 'array'],
        ]);

        $user = $request->user();
        $row = PushToken::updateOrCreate(
            ['user_id' => $user->id, 'token' => $data['token']],
            [
                'platform' => $data['platform'],
                'keys' => $data['keys'] ?? null,
                'last_seen_at' => now(),
            ],
        );

        return response()->json(['data' => $row]);
    }

    public function destroy(Request $request, string $token): JsonResponse
    {
        PushToken::where('user_id', $request->user()->id)
            ->where('token', $token)
            ->delete();
        return response()->json(['ok' => true]);
    }
}
