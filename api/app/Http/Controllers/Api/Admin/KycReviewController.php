<?php

namespace App\Http\Controllers\Api\Admin;

use App\Events\KycStatusUpdated;
use App\Models\KycSubmission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;

/**
 * Admin KYC review — protected by role middleware: Admin, SuperAdmin,
 * or KYCOfficer. All actions write to the activity log via the model trait.
 */
class KycReviewController extends Controller
{
    public function queue(Request $request): JsonResponse
    {
        $filter = $request->query('filter', 'pending');

        $q = KycSubmission::query()
            ->with('user:id,name,role,phone,nin,kyc_status,kyc_submitted_at')
            ->latest();

        match ($filter) {
            'pending' => $q->where('status', 'Pending'),
            'flagged' => $q->where('status', 'Rejected'),
            'approved' => $q->where('status', 'Verified'),
            default => null,
        };

        if ($search = $request->query('q')) {
            $q->whereHas('user', function ($w) use ($search) {
                $w->where('name', 'ilike', "%{$search}%")
                  ->orWhere('phone', 'ilike', "%{$search}%")
                  ->orWhere('nin', 'ilike', "%{$search}%");
            });
        }

        return response()->json($q->paginate(50));
    }

    public function show(KycSubmission $submission): JsonResponse
    {
        $submission->load('user');
        return response()->json([
            'data' => array_merge(
                $submission->toArray(),
                ['signed_urls' => $submission->signedUrls()]
            ),
        ]);
    }

    public function decide(Request $request, KycSubmission $submission): JsonResponse
    {
        $data = $request->validate([
            'verdict' => ['required', Rule::in(['Verified', 'Rejected', 'Pending'])],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $admin = $request->user();
        $submission->update([
            'status' => $data['verdict'],
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
            'reviewer_note' => $data['note'] ?? null,
        ]);

        // Mirror onto the user's denormalized kyc_status so the React app
        // doesn't have to join through submissions on every page.
        $submission->user->update([
            'kyc_status' => $data['verdict'] === 'Pending' ? 'Not Submitted' : $data['verdict'],
            'kyc_reviewed_at' => now(),
            'kyc_reviewed_by' => $admin->id,
        ]);

        $fresh = $submission->fresh();
        KycStatusUpdated::dispatch($fresh);

        return response()->json(['ok' => true, 'data' => $fresh]);
    }
}
