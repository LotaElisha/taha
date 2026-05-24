<?php

namespace App\Http\Controllers\Api\Auth;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

/**
 * Admin email + password login. Strictly for staff roles — every other role
 * goes through phone+OTP. Issues the same Sanctum SPA cookie.
 */
class AdminLoginController extends Controller
{
    private const STAFF_ROLES = [
        'Admin', 'SuperAdmin', 'KYCOfficer',
        'CatalogManager', 'SupportAgent', 'FinancialAuditor',
        'Agronomist', // urban professional — can hold an email account too
    ];

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:6'],
        ]);

        $key = 'admin-login:' . sha1(strtolower($data['email']) . '|' . $request->ip());
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            throw ValidationException::withMessages([
                'email' => ["Too many attempts. Try again in {$seconds}s."],
            ]);
        }

        $user = User::where('email', strtolower($data['email']))->first();
        if (!$user || !$user->password || !Hash::check($data['password'], $user->password)) {
            RateLimiter::hit($key, 60);
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        if (!in_array($user->role, self::STAFF_ROLES, true)) {
            // Non-staff trying to use the admin path — generic error so we don't
            // leak which accounts are staff.
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        RateLimiter::clear($key);
        Auth::guard('web')->login($user, remember: true);
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        return response()->json([
            'ok' => true,
            'user' => $user->only([
                'id', 'name', 'email', 'phone', 'role', 'region',
                'kyc_status', 'location', 'logo_url', 'rating',
            ]),
        ]);
    }
}
