<?php

namespace App\Http\Controllers\Api\Auth;

use App\Models\User;
use App\Services\Otp\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use RuntimeException;

/**
 * Phone+OTP auth endpoints. Sanctum SPA mode — verify() opens a session
 * cookie that the React frontend uses for every subsequent request.
 */
class OtpController extends Controller
{
    public function __construct(private readonly OtpService $otp) {}

    public function request(Request $request): JsonResponse
    {
        $data = $request->validate([
            'phone' => ['required', 'string', 'regex:/^\+\d{10,15}$/'],
            'region' => ['required', Rule::in(['TZ', 'KE'])],
            'channel' => ['nullable', Rule::in(['sms', 'voice'])],
        ]);

        try {
            $result = $this->otp->requestCode(
                $data['phone'],
                $request->ip(),
                $data['channel'] ?? 'sms',
            );
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 429);
        }

        return response()->json(['ok' => true, 'expires_in_sec' => $result['expires_in_sec']]);
    }

    public function verify(Request $request): JsonResponse
    {
        $data = $request->validate([
            'phone' => ['required', 'string', 'regex:/^\+\d{10,15}$/'],
            'code' => ['required', 'digits:6'],
            'region' => ['required', Rule::in(['TZ', 'KE'])],
            // role + name are only required when this is the user's first ever
            // verification (no account exists yet).
            'role' => ['nullable', Rule::in([
                'Farmer', 'Agrodealer', 'Agrovet', 'Agronomist', 'LogisticsProvider',
            ])],
            'name' => ['nullable', 'string', 'max:120'],
        ]);

        try {
            $ok = $this->otp->verifyCode($data['phone'], $data['code']);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 429);
        }

        if (!$ok) {
            return response()->json(['message' => 'Incorrect or expired code.'], 422);
        }

        $user = User::firstOrNew(['phone' => $data['phone']]);
        $isNew = !$user->exists;

        if ($isNew) {
            $user->role = $data['role'] ?? 'Farmer';
            $user->name = $data['name'] ?? '';
            $user->kyc_status = 'Not Submitted';
        }

        $user->region = $data['region'];
        $user->phone_verified_at = now();
        $user->save();
        $user->syncRoles([$user->role]);

        // Sanctum stateful mode — log in to the web guard, cookie is issued.
        Auth::guard('web')->login($user, remember: true);
        // Session middleware only wires in for SANCTUM_STATEFUL_DOMAINS hosts.
        // Non-SPA callers (or test hosts that aren't in the allowlist) get no
        // session — fine, they just don't get a cookie.
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        return response()->json([
            'ok' => true,
            'is_new' => $isNew,
            'user' => $user->only([
                'id', 'name', 'email', 'phone', 'role', 'region',
                'kyc_status', 'location', 'logo_url', 'rating',
            ]),
        ]);
    }
}
