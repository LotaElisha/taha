<?php

namespace App\Http\Controllers\Api;

use App\Jobs\ProcessPayoutJob;
use App\Models\LogisticsBooking;
use App\Models\User;
use App\Services\Fares\FareCalculator;
use App\Services\Payouts\PayoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;

class LogisticsController extends Controller
{
    public function __construct(private readonly FareCalculator $fares) {}

    /** POST /api/v1/logistics/quote — pre-flight fare estimate. */
    public function quote(Request $request): JsonResponse
    {
        $d = $request->validate([
            'pickup_lat' => ['required', 'numeric'],
            'pickup_lon' => ['required', 'numeric'],
            'dropoff_lat' => ['required', 'numeric'],
            'dropoff_lon' => ['required', 'numeric'],
        ]);
        $km = $this->fares->distanceKm(
            (float) $d['pickup_lat'], (float) $d['pickup_lon'],
            (float) $d['dropoff_lat'], (float) $d['dropoff_lon'],
        );
        return response()->json(['data' => $this->fares->logisticsFare($km)]);
    }

    public function store(Request $request): JsonResponse
    {
        $d = $request->validate([
            'pickup_location' => ['required', 'string', 'max:200'],
            'dropoff_location' => ['required', 'string', 'max:200'],
            'pickup_lat' => ['required', 'numeric'],
            'pickup_lon' => ['required', 'numeric'],
            'dropoff_lat' => ['required', 'numeric'],
            'dropoff_lon' => ['required', 'numeric'],
            'cargo_details' => ['required', 'string', 'max:500'],
            'truck_type_id' => ['required', 'string', 'max:64'],
            'pickup_date' => ['required', 'date'],
        ]);
        $km = $this->fares->distanceKm(
            (float) $d['pickup_lat'], (float) $d['pickup_lon'],
            (float) $d['dropoff_lat'], (float) $d['dropoff_lon'],
        );
        $fare = $this->fares->logisticsFare($km);

        $booking = LogisticsBooking::create([
            'farmer_id' => $request->user()->id,
            'pickup_location' => $d['pickup_location'],
            'dropoff_location' => $d['dropoff_location'],
            'cargo_details' => $d['cargo_details'],
            'truck_type_id' => $d['truck_type_id'],
            'pickup_date' => $d['pickup_date'],
            'status' => 'Pending',
            'fare' => $fare['fare'],
            'platform_fee' => $fare['platform_fee'],
            'provider_payout' => $fare['provider_payout'],
            'distance_km' => $fare['distance_km'],
        ]);

        return response()->json(['data' => $booking], 201);
    }

    /** Provider marks booking states forward. */
    public function transition(Request $request, LogisticsBooking $booking): JsonResponse
    {
        $d = $request->validate([
            'status' => ['required', Rule::in(['Confirmed', 'In Transit', 'Delivered', 'Cancelled'])],
        ]);
        $user = $request->user();
        if ($booking->provider_id && $booking->provider_id !== $user->id) {
            abort(403);
        }
        // First-time accept claims the booking for the calling provider.
        if (!$booking->provider_id && $d['status'] === 'Confirmed') {
            if ($user->role !== 'LogisticsProvider') abort(403);
            $booking->provider_id = $user->id;
        }
        $booking->status = $d['status'];
        $booking->save();

        // Delivered → enqueue the provider payout. Idempotent: re-running
        // this transition won't double-pay (unique index on payouts.payable).
        if ($d['status'] === 'Delivered') {
            $payout = app(PayoutService::class)->enqueueForLogisticsBooking($booking->fresh());
            if ($payout) {
                ProcessPayoutJob::dispatch($payout->id);
                $booking->forceFill(['paid_to_provider_at' => now()])->save();
            }
        }
        return response()->json(['data' => $booking->fresh()]);
    }
}
