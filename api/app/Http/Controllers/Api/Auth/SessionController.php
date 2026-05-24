<?php

namespace App\Http\Controllers\Api\Auth;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class SessionController extends Controller
{
    /**
     * GET /api/v1/me — used by the React app on boot to hydrate AuthContext.
     * Returns 204 when there's no session, so the frontend can treat that
     * as "guest" without surfacing a 401 in the console.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(null, 204);
        }
        return response()->json(['user' => $this->shape($user)]);
    }

    /**
     * PATCH /api/v1/me/role — used by the AuthFlow role-pick step the first
     * time a phone signs in. Only allowed when the user was just created
     * (no real activity yet) so existing accounts can't change role this way.
     */
    public function updateRole(Request $request): JsonResponse
    {
        $data = $request->validate([
            'role' => ['required', Rule::in([
                'Farmer', 'Agrodealer', 'Agrovet', 'Agronomist', 'LogisticsProvider',
            ])],
            'name' => ['nullable', 'string', 'max:120'],
        ]);

        $user = $request->user();
        $user->update([
            'role' => $data['role'],
            'name' => $data['name'] ?? $user->name,
        ]);
        $user->syncRoles([$user->role]);

        return response()->json(['user' => $this->shape($user->fresh())]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }
        return response()->json(['ok' => true]);
    }

    private function shape($user): array
    {
        return $user->only([
            'id', 'name', 'email', 'phone', 'role', 'region',
            'kyc_status', 'location', 'logo_url', 'rating',
        ]);
    }
}
