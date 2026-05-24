<?php

namespace App\Http\Controllers\Api;

use App\Models\KycSubmission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;

class KycController extends Controller
{
    public function submit(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nin' => ['required', 'string', 'regex:/^[\d-]{10,32}$/'],
            'id_front' => ['required', 'image', 'max:5120'],
            'id_back' => ['nullable', 'image', 'max:5120'],
            'selfie' => ['required', 'image', 'max:5120'],
        ]);

        $user = $request->user();
        $disk = 'r2-private';
        $prefix = "kyc/{$user->id}/" . now()->format('Y/m/d/His');

        $idFrontPath = $request->file('id_front')->store($prefix, $disk);
        $idBackPath = $request->hasFile('id_back')
            ? $request->file('id_back')->store($prefix, $disk)
            : null;
        $selfiePath = $request->file('selfie')->store($prefix, $disk);

        $submission = KycSubmission::create([
            'user_id' => $user->id,
            'nin' => $data['nin'],
            'id_front_path' => $idFrontPath,
            'id_back_path' => $idBackPath,
            'selfie_path' => $selfiePath,
            'status' => 'Pending',
        ]);

        $user->update([
            'kyc_status' => 'Pending',
            'nin' => $data['nin'],
            'kyc_submitted_at' => now(),
        ]);

        return response()->json([
            'data' => [
                'id' => $submission->id,
                'status' => $submission->status,
                'submitted_at' => $submission->created_at,
            ],
        ], 201);
    }
}
