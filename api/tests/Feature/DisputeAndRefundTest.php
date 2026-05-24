<?php

use App\Jobs\ProcessRefundJob;
use App\Models\Dispute;
use App\Models\Order;
use App\Models\Refund;
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

    $this->support = User::create([
        'name' => 'Support Agent',
        'email' => 'support@mkulima.app',
        'role' => 'SupportAgent',
        'kyc_status' => 'Verified',
        'region' => 'TZ',
    ]);
    $this->support->syncRoles(['SupportAgent']);

    $this->auditor = User::create([
        'name' => 'Finance',
        'email' => 'finance@mkulima.app',
        'role' => 'FinancialAuditor',
        'kyc_status' => 'Verified',
        'region' => 'TZ',
    ]);
    $this->auditor->syncRoles(['FinancialAuditor']);

    $this->farmer = User::create([
        'name' => 'Buyer',
        'phone' => '+255712000099',
        'role' => 'Farmer',
        'kyc_status' => 'Verified',
        'region' => 'TZ',
    ]);
    $this->farmer->syncRoles(['Farmer']);

    $this->otherFarmer = User::create([
        'name' => 'Other Buyer',
        'phone' => '+255712000088',
        'role' => 'Farmer',
        'kyc_status' => 'Verified',
        'region' => 'TZ',
    ]);
    $this->otherFarmer->syncRoles(['Farmer']);

    $this->order = Order::create([
        'user_id' => $this->farmer->id,
        'subtotal' => 50000,
        'delivery_cost' => 5000,
        'total' => 55000,
        'currency' => 'TZS',
        'status' => 'Delivered',
        'channel' => 'online',
        'payment_method_id' => 'mpesa',
        'payment_reference' => 'MPESA-TX-001',
        'paid_at' => now()->subDays(1),
        'disputable_until' => now()->addDays(6),
    ]);
});

/* ----------------------------- Open dispute ----------------------------- */
it('lets the order owner open a dispute', function () {
    $this->actingAs($this->farmer);
    $resp = $this->postJson("/api/v1/orders/{$this->order->id}/disputes", [
        'reason' => 'damaged',
        'description' => 'Sack of maize arrived torn and wet.',
    ]);
    $resp->assertCreated();
    expect(Dispute::where('order_id', $this->order->id)->exists())->toBeTrue();
    expect($this->order->fresh()->dispute_status)->toBe('Open');
});

it('forbids opening a dispute on someone else\'s order', function () {
    $this->actingAs($this->otherFarmer);
    $this->postJson("/api/v1/orders/{$this->order->id}/disputes", [
        'reason' => 'damaged',
    ])->assertStatus(403);
});

it('refuses to dispute an order that is not yet delivered', function () {
    $this->order->update(['status' => 'Processing']);
    $this->actingAs($this->farmer);
    $this->postJson("/api/v1/orders/{$this->order->id}/disputes", [
        'reason' => 'damaged',
    ])->assertStatus(422);
});

it('refuses to dispute past the window', function () {
    $this->order->update(['disputable_until' => now()->subDay()]);
    $this->actingAs($this->farmer);
    $this->postJson("/api/v1/orders/{$this->order->id}/disputes", [
        'reason' => 'damaged',
    ])->assertStatus(422);
});

it('refuses a duplicate Open dispute', function () {
    Dispute::create([
        'order_id' => $this->order->id,
        'opened_by_user_id' => $this->farmer->id,
        'reason' => 'damaged',
        'status' => 'Open',
    ]);
    $this->actingAs($this->farmer);
    $this->postJson("/api/v1/orders/{$this->order->id}/disputes", [
        'reason' => 'damaged',
    ])->assertStatus(422);
});

/* ---------------------------- Approve dispute --------------------------- */
it('admin approve creates an mpesa_reversal refund + dispatches the job', function () {
    Bus::fake();
    $dispute = Dispute::create([
        'order_id' => $this->order->id,
        'opened_by_user_id' => $this->farmer->id,
        'reason' => 'damaged',
        'status' => 'Open',
    ]);

    $this->actingAs($this->admin);
    $resp = $this->postJson("/api/v1/admin/disputes/{$dispute->id}/approve", [
        'amount' => 55000,
        'note' => 'Customer photo evidence is clear.',
    ]);
    $resp->assertOk();

    $dispute->refresh();
    expect($dispute->status)->toBe('Approved');
    expect($dispute->decided_by_user_id)->toBe($this->admin->id);

    $refund = Refund::where('dispute_id', $dispute->id)->first();
    expect($refund)->not->toBeNull();
    expect($refund->status)->toBe('Pending');
    expect($refund->provider)->toBe('mpesa_reversal'); // order paid via mpesa
    expect((float) $refund->amount)->toBe(55000.0);

    Bus::assertDispatched(ProcessRefundJob::class);
});

it('admin reject closes the dispute with a customer-visible note', function () {
    $dispute = Dispute::create([
        'order_id' => $this->order->id,
        'opened_by_user_id' => $this->farmer->id,
        'reason' => 'damaged',
        'status' => 'Open',
    ]);
    $this->actingAs($this->admin);
    $resp = $this->postJson("/api/v1/admin/disputes/{$dispute->id}/reject", [
        'note' => 'Photos show packaging intact at delivery time.',
    ]);
    $resp->assertOk();
    expect($dispute->fresh()->status)->toBe('Rejected');
    expect($this->order->fresh()->dispute_status)->toBe('Rejected');
});

it('approve requires amount within order total', function () {
    $dispute = Dispute::create([
        'order_id' => $this->order->id,
        'opened_by_user_id' => $this->farmer->id,
        'reason' => 'damaged',
        'status' => 'Open',
    ]);
    $this->actingAs($this->admin);
    $this->postJson("/api/v1/admin/disputes/{$dispute->id}/approve", [
        'amount' => 100000, // > order total 55000
        'note' => 'oops',
    ])->assertStatus(422);
});

it('SupportAgent can triage (read queue) but cannot approve', function () {
    $dispute = Dispute::create([
        'order_id' => $this->order->id,
        'opened_by_user_id' => $this->farmer->id,
        'reason' => 'damaged',
        'status' => 'Open',
    ]);
    $this->actingAs($this->support);
    $this->getJson('/api/v1/admin/disputes')->assertOk();
    $this->postJson("/api/v1/admin/disputes/{$dispute->id}/approve", [
        'amount' => 5000,
        'note' => 'should be blocked',
    ])->assertStatus(403);
});

/* ---------------------------- Refund actions ---------------------------- */
it('admin retries a Failed refund', function () {
    Bus::fake();
    $refund = Refund::create([
        'order_id' => $this->order->id,
        'recipient_id' => $this->farmer->id,
        'amount' => 30000,
        'currency' => 'TZS',
        'status' => 'Failed',
        'provider' => 'mpesa_reversal',
        'failure_reason' => 'Daraja: ECONOMIC ERROR',
        'attempts' => 1,
    ]);
    $this->actingAs($this->auditor);
    $this->postJson("/api/v1/admin/refunds/{$refund->id}/retry")->assertOk();
    expect($refund->fresh()->status)->toBe('Pending');
    Bus::assertDispatched(ProcessRefundJob::class);
});

it('admin marks a manual refund as Refunded with note', function () {
    $refund = Refund::create([
        'order_id' => $this->order->id,
        'recipient_id' => $this->farmer->id,
        'amount' => 55000,
        'currency' => 'TZS',
        'status' => 'Pending',
        'provider' => 'manual',
    ]);
    $this->actingAs($this->admin);
    $this->postJson("/api/v1/admin/refunds/{$refund->id}/mark-refunded", [
        'note' => 'Cash returned at our Arusha desk on 15 May',
    ])->assertOk();
    expect($refund->fresh()->status)->toBe('Refunded');
    expect($refund->fresh()->refunded_at)->not->toBeNull();
});

it('marking refunded advances the linked dispute to Resolved', function () {
    $dispute = Dispute::create([
        'order_id' => $this->order->id,
        'opened_by_user_id' => $this->farmer->id,
        'reason' => 'damaged',
        'status' => 'Approved',
        'decided_by_user_id' => $this->admin->id,
        'resolution_note' => 'OK',
        'decided_at' => now(),
    ]);
    $refund = Refund::create([
        'dispute_id' => $dispute->id,
        'order_id' => $this->order->id,
        'recipient_id' => $this->farmer->id,
        'amount' => 55000,
        'currency' => 'TZS',
        'status' => 'Pending',
        'provider' => 'manual',
    ]);

    $this->actingAs($this->admin);
    $this->postJson("/api/v1/admin/refunds/{$refund->id}/mark-refunded", [
        'note' => 'Cash returned in person',
    ])->assertOk();

    expect($dispute->fresh()->status)->toBe('Resolved');
});

it('auditor cannot mark refunded (admin-only)', function () {
    $refund = Refund::create([
        'order_id' => $this->order->id,
        'recipient_id' => $this->farmer->id,
        'amount' => 30000,
        'currency' => 'TZS',
        'status' => 'Pending',
        'provider' => 'manual',
    ]);
    $this->actingAs($this->auditor);
    $this->postJson("/api/v1/admin/refunds/{$refund->id}/mark-refunded", [
        'note' => 'should fail',
    ])->assertStatus(403);
});

it('cancels a Pending refund with a note', function () {
    $refund = Refund::create([
        'order_id' => $this->order->id,
        'recipient_id' => $this->farmer->id,
        'amount' => 30000,
        'currency' => 'TZS',
        'status' => 'Pending',
        'provider' => 'mpesa_reversal',
    ]);
    $this->actingAs($this->admin);
    $this->postJson("/api/v1/admin/refunds/{$refund->id}/cancel", [
        'note' => 'Customer opted for store credit instead',
    ])->assertOk();
    expect($refund->fresh()->status)->toBe('Cancelled');
});
