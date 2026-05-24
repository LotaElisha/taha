<?php

use App\Jobs\ProcessPayoutJob;
use App\Models\LogisticsBooking;
use App\Models\Payout;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Bus;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);

    $this->admin = User::create([
        'name' => 'Sys Admin',
        'email' => 'admin@mkulima.app',
        'role' => 'SuperAdmin',
        'kyc_status' => 'Verified',
        'region' => 'TZ',
    ]);
    $this->admin->syncRoles(['SuperAdmin']);

    $this->auditor = User::create([
        'name' => 'Finance Auditor',
        'email' => 'auditor@mkulima.app',
        'role' => 'FinancialAuditor',
        'kyc_status' => 'Verified',
        'region' => 'TZ',
    ]);
    $this->auditor->syncRoles(['FinancialAuditor']);

    $this->farmer = User::create([
        'name' => 'Random Farmer',
        'phone' => '+255712000099',
        'role' => 'Farmer',
        'kyc_status' => 'Verified',
        'region' => 'TZ',
    ]);
    $this->farmer->syncRoles(['Farmer']);

    $this->provider = User::create([
        'name' => 'Provider',
        'phone' => '+255700000099',
        'role' => 'LogisticsProvider',
        'kyc_status' => 'Verified',
        'region' => 'TZ',
    ]);
    $this->provider->syncRoles(['LogisticsProvider']);

    $booking = LogisticsBooking::create([
        'farmer_id' => $this->farmer->id,
        'provider_id' => $this->provider->id,
        'pickup_location' => 'A',
        'dropoff_location' => 'B',
        'cargo_details' => 'maize',
        'truck_type_id' => 'pickup',
        'pickup_date' => now()->addDay(),
        'status' => 'Delivered',
        'fare' => 100000,
        'platform_fee' => 12000,
        'provider_payout' => 88000,
        'distance_km' => 50,
    ]);
    $this->payout = Payout::create([
        'recipient_id' => $this->provider->id,
        'amount' => 88000,
        'currency' => 'TZS',
        'payable_type' => LogisticsBooking::class,
        'payable_id' => $booking->id,
        'status' => 'Failed',
        'provider' => 'mpesa_b2c',
        'failure_reason' => 'Daraja rejected: invalid initiator',
        'attempts' => 1,
    ]);
});

/* --------------------------------- retry -------------------------------- */
it('retries a Failed payout — flips to Pending and dispatches the job', function () {
    Bus::fake();
    $this->actingAs($this->auditor); // auditor is allowed to retry
    $this->postJson("/api/v1/admin/payouts/{$this->payout->id}/retry")->assertOk();

    $this->payout->refresh();
    expect($this->payout->status)->toBe('Pending');
    expect($this->payout->failure_reason)->toBeNull();
    Bus::assertDispatched(ProcessPayoutJob::class);
});

it('refuses to retry a Paid payout', function () {
    $this->payout->update(['status' => 'Paid', 'paid_at' => now()]);
    $this->actingAs($this->admin);
    $this->postJson("/api/v1/admin/payouts/{$this->payout->id}/retry")->assertStatus(422);
});

it('forbids non-financial roles from retrying', function () {
    $this->actingAs($this->farmer);
    $this->postJson("/api/v1/admin/payouts/{$this->payout->id}/retry")->assertStatus(403);
});

/* ------------------------------- mark-paid ------------------------------ */
it('marks a Failed payout as paid with an audit note', function () {
    $this->actingAs($this->admin);
    $resp = $this->postJson("/api/v1/admin/payouts/{$this->payout->id}/mark-paid", [
        'note' => 'Wired manually via CRDB ref 12345 on 14 May',
        'provider_reference' => 'CRDB-12345',
    ]);
    $resp->assertOk();
    $this->payout->refresh();
    expect($this->payout->status)->toBe('Paid');
    expect($this->payout->paid_at)->not->toBeNull();
    expect($this->payout->failure_reason)->toContain('MANUAL:');
    expect($this->payout->provider_reference)->toBe('CRDB-12345');
});

it('refuses mark-paid without a note', function () {
    $this->actingAs($this->admin);
    $this->postJson("/api/v1/admin/payouts/{$this->payout->id}/mark-paid", [])
        ->assertStatus(422);
});

it('refuses an auditor (not Admin) from marking paid', function () {
    $this->actingAs($this->auditor);
    $this->postJson("/api/v1/admin/payouts/{$this->payout->id}/mark-paid", [
        'note' => 'should not work',
    ])->assertStatus(403);
});

/* -------------------------------- cancel -------------------------------- */
it('cancels a Failed payout with an audit note', function () {
    $this->actingAs($this->admin);
    $this->postJson("/api/v1/admin/payouts/{$this->payout->id}/cancel", [
        'note' => 'Duplicate booking — fare already settled elsewhere',
    ])->assertOk();
    $this->payout->refresh();
    expect($this->payout->status)->toBe('Cancelled');
    expect($this->payout->failure_reason)->toContain('CANCELLED:');
});

it('refuses to cancel a Paid payout', function () {
    $this->payout->update(['status' => 'Paid', 'paid_at' => now()]);
    $this->actingAs($this->admin);
    $this->postJson("/api/v1/admin/payouts/{$this->payout->id}/cancel", [
        'note' => 'too late',
    ])->assertStatus(422);
});
