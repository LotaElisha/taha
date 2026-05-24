<?php

use App\Models\Product;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);

    $this->vendor = User::create([
        'name' => 'Kibo Agri',
        'phone' => '+255700000001',
        'role' => 'Agrodealer',
        'kyc_status' => 'Verified',
        'region' => 'TZ',
    ]);
    $this->vendor->syncRoles(['Agrodealer']);

    $this->product = Product::create([
        'vendor_id' => $this->vendor->id,
        'name' => 'DK 8033 Maize 2kg',
        'price' => 12500,
        'currency' => 'TZS',
        'category' => 'Seeds',
        'stock' => 5,
    ]);

    $this->farmer = User::create([
        'name' => 'Test Farmer',
        'phone' => '+255712000001',
        'role' => 'Farmer',
        'kyc_status' => 'Verified',
        'region' => 'TZ',
    ]);
    $this->farmer->syncRoles(['Farmer']);
});

it('places an order and decrements stock atomically', function () {
    $this->actingAs($this->farmer);
    $resp = $this->postJson('/api/v1/orders', [
        'items' => [['product_id' => $this->product->id, 'quantity' => 2]],
        'delivery_option_id' => 'standard',
        'delivery_cost' => 5000,
        'payment_method_id' => 'mpesa',
    ]);
    $resp->assertCreated()
        ->assertJsonPath('data.total', '30000.00');
    expect($this->product->fresh()->stock)->toBe(3);
});

it('refuses to oversell', function () {
    $this->actingAs($this->farmer);
    $this->postJson('/api/v1/orders', [
        'items' => [['product_id' => $this->product->id, 'quantity' => 6]],
        'delivery_option_id' => 'standard',
        'delivery_cost' => 5000,
        'payment_method_id' => 'mpesa',
    ])->assertStatus(422);
    expect($this->product->fresh()->stock)->toBe(5);
});
