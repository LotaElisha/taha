<?php

use App\Models\LogisticsBooking;
use App\Models\Payout;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Bus;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);

    $this->provider = User::create([
        'name' => 'Logistics Partner',
        'phone' => '+255755020001',
        'role' => 'LogisticsProvider',
        'kyc_status' => 'Verified',
        'region' => 'TZ',
    ]);
    $this->provider->syncRoles(['LogisticsProvider']);

    $this->farmer = User::create([
        'name' => 'Test Farmer',
        'phone' => '+255712000001',
        'role' => 'Farmer',
        'kyc_status' => 'Verified',
        'region' => 'TZ',
    ]);
    $this->farmer->syncRoles(['Farmer']);

    $this->booking = LogisticsBooking::create([
        'farmer_id' => $this->farmer->id,
        'provider_id' => $this->provider->id,
        'pickup_location' => 'Arusha',
        'dropoff_location' => 'Moshi',
        'cargo_details' => '20 bags of maize',
        'truck_type_id' => 'pickup',
        'pickup_date' => now()->addDay(),
        'status' => 'In Transit',
        'fare' => 95000,
        'platform_fee' => 11400,
        'provider_payout' => 83600,
        'distance_km' => 75,
    ]);
});

it('enqueues exactly one Pending payout when a booking transitions to Delivered', function () {
    Bus::fake();

    $this->actingAs($this->provider);
    $resp = $this->postJson(
        "/api/v1/logistics/bookings/{$this->booking->id}/transition",
        ['status' => 'Delivered']
    );

    $resp->assertOk();
    expect(Payout::count())->toBe(1);

    $payout = Payout::first();
    expect((float) $payout->amount)->toBe(83600.0);
    expect($payout->status)->toBe('Pending');
    expect($payout->recipient_id)->toBe($this->provider->id);
    expect($payout->payable_type)->toBe(LogisticsBooking::class);
    expect($payout->payable_id)->toBe($this->booking->id);

    Bus::assertDispatched(\App\Jobs\ProcessPayoutJob::class);
});

it('is idempotent — a second Delivered transition does not create a duplicate', function () {
    Bus::fake();

    $this->actingAs($this->provider);
    $this->postJson("/api/v1/logistics/bookings/{$this->booking->id}/transition", ['status' => 'Delivered'])->assertOk();
    $this->postJson("/api/v1/logistics/bookings/{$this->booking->id}/transition", ['status' => 'Delivered'])->assertOk();

    expect(Payout::count())->toBe(1);
});
