<?php

namespace App\Http\Controllers\Api;

use App\Jobs\ProcessPayoutJob;
use App\Models\Tool;
use App\Models\ToolBooking;
use App\Services\Fares\FareCalculator;
use App\Services\Payouts\PayoutService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;

class ToolBookingController extends Controller
{
    public function __construct(private readonly FareCalculator $fares) {}

    public function store(Request $request): JsonResponse
    {
        $d = $request->validate([
            'tool_id' => ['required', 'integer', 'exists:tools,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
        ]);

        /** @var Tool $tool */
        $tool = Tool::findOrFail($d['tool_id']);
        $days = Carbon::parse($d['start_date'])->diffInDays(Carbon::parse($d['end_date'])) + 1;
        $fare = $this->fares->toolFare((float) $tool->daily_rate, $days);

        $booking = ToolBooking::create([
            'tool_id' => $tool->id,
            'farmer_id' => $request->user()->id,
            'start_date' => $d['start_date'],
            'end_date' => $d['end_date'],
            'total_cost' => $fare['total_cost'],
            'platform_fee' => $fare['platform_fee'],
            'owner_payout' => $fare['owner_payout'],
            'status' => 'Pending',
        ]);

        return response()->json(['data' => $booking], 201);
    }

    /**
     * Tool owners (or admins) move bookings forward. Completing a booking
     * enqueues the owner payout — same idempotent path as logistics.
     */
    public function transition(Request $request, ToolBooking $booking): JsonResponse
    {
        $d = $request->validate([
            'status' => ['required', Rule::in([
                'Confirmed', 'Active', 'Completed', 'Cancelled', 'Rejected',
            ])],
        ]);
        $user = $request->user();

        // Only the tool's owner or staff can transition. Booking belongs to
        // a farmer; the owner is on the Tool model.
        $tool = $booking->tool;
        if (!$tool) abort(404);
        $isOwner = $tool->owner_id === $user->id;
        $isStaff = method_exists($user, 'isStaff') ? $user->isStaff() : false;
        if (!$isOwner && !$isStaff) abort(403);

        $booking->status = $d['status'];
        $booking->save();

        if ($d['status'] === 'Completed') {
            $payout = app(PayoutService::class)->enqueueForToolBooking($booking->fresh());
            if ($payout) {
                ProcessPayoutJob::dispatch($payout->id);
                $booking->forceFill(['paid_to_owner_at' => now()])->save();
            }
        }

        return response()->json(['data' => $booking->fresh()]);
    }
}
