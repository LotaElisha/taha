<?php

use App\Models\Product;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $vendor = User::create([
        'name' => 'Kibo Agri',
        'phone' => '+255700000001',
        'role' => 'Agrodealer',
        'kyc_status' => 'Verified',
        'region' => 'TZ',
    ]);
    $vendor->syncRoles(['Agrodealer']);
    foreach (['Seeds', 'Fertilizers', 'Tools'] as $cat) {
        Product::create([
            'vendor_id' => $vendor->id,
            'name' => "$cat sample",
            'price' => 1000,
            'currency' => 'TZS',
            'category' => $cat,
            'stock' => 10,
        ]);
    }
});

it('lists products publicly', function () {
    $this->getJson('/api/v1/products')
        ->assertOk()
        ->assertJsonStructure(['data' => [['id', 'name', 'price', 'category', 'vendor']]]);
});

it('filters by category', function () {
    $resp = $this->getJson('/api/v1/products?category=Seeds');
    $resp->assertOk();
    $cats = collect($resp->json('data'))->pluck('category')->unique();
    expect($cats->all())->toBe(['Seeds']);
});

it('allows authenticated dealer to store a product and forces their vendor_id', function () {
    $dealer = User::where('role', 'Agrodealer')->first();
    $this->actingAs($dealer);

    $this->postJson('/api/v1/products', [
        'name' => 'Brand New Seeds',
        'category' => 'Seeds',
        'price' => 25000,
        'stock' => 100,
        'description' => 'Top tier maize seeds',
        'is_featured' => true,
    ])
    ->assertCreated()
    ->assertJsonPath('data.name', 'Brand New Seeds')
    ->assertJsonPath('data.vendor_id', $dealer->id);
});

it('rejects unauthenticated attempts to store a product', function () {
    $this->postJson('/api/v1/products', [
        'name' => 'Brand New Seeds',
        'category' => 'Seeds',
        'price' => 25000,
        'stock' => 100,
    ])
    ->assertUnauthorized();
});

it('allows dealer to update their own product', function () {
    $dealer = User::where('role', 'Agrodealer')->first();
    $this->actingAs($dealer);

    $prod = Product::where('vendor_id', $dealer->id)->first();

    $this->putJson("/api/v1/products/{$prod->id}", [
        'name' => 'Updated Sample Seeds',
        'price' => 15000,
    ])
    ->assertOk()
    ->assertJsonPath('data.name', 'Updated Sample Seeds')
    ->assertJsonPath('data.price', '15000.00');
});

it('forbids dealer from updating another dealer product', function () {
    // Create another dealer
    $otherDealer = User::create([
        'name' => 'Moshi Agro',
        'phone' => '+255700000002',
        'role' => 'Agrodealer',
        'kyc_status' => 'Verified',
        'region' => 'TZ',
    ]);
    $otherDealer->syncRoles(['Agrodealer']);

    $dealer = User::where('role', 'Agrodealer')->where('id', '!=', $otherDealer->id)->first();
    $prod = Product::where('vendor_id', $dealer->id)->first();

    // Authenticate as otherDealer, attempt to update dealer's product
    $this->actingAs($otherDealer);

    $this->putJson("/api/v1/products/{$prod->id}", [
        'name' => 'Hacked seeds name',
    ])
    ->assertForbidden();
});

it('allows dealer to delete their own product', function () {
    $dealer = User::where('role', 'Agrodealer')->first();
    $this->actingAs($dealer);

    $prod = Product::where('vendor_id', $dealer->id)->first();

    $this->deleteJson("/api/v1/products/{$prod->id}")
        ->assertOk();

    expect(Product::find($prod->id))->toBeNull();
});

it('allows admin or catalog manager to update any product', function () {
    $admin = User::create([
        'name' => 'Admin User',
        'phone' => '+255700000003',
        'role' => 'Admin',
        'kyc_status' => 'Verified',
        'region' => 'TZ',
    ]);
    $admin->syncRoles(['Admin']);
    $this->actingAs($admin);

    $dealer = User::where('role', 'Agrodealer')->first();
    $prod = Product::where('vendor_id', $dealer->id)->first();

    $this->putJson("/api/v1/products/{$prod->id}", [
        'name' => 'Admin overridden name',
    ])
    ->assertOk()
    ->assertJsonPath('data.name', 'Admin overridden name');
});
