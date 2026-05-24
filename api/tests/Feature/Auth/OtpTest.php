<?php

use App\Models\OtpCode;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

it('requests an OTP and stores a hashed code', function () {
    $resp = $this->postJson('/api/v1/auth/otp/request', [
        'phone' => '+255712345678',
        'region' => 'TZ',
    ]);
    $resp->assertOk()->assertJson(['ok' => true]);
    expect(OtpCode::where('phone', '+255712345678')->count())->toBe(1);
});

it('rejects an OTP request with an invalid phone shape', function () {
    $this->postJson('/api/v1/auth/otp/request', [
        'phone' => '0712345678',
        'region' => 'TZ',
    ])->assertStatus(422);
});

it('verifies a correct code and opens a session', function () {
    $code = '123456';
    OtpCode::create([
        'phone' => '+255712345678',
        'code_hash' => Hash::make($code),
        'channel' => 'sms',
        'expires_at' => now()->addMinutes(5),
    ]);

    $resp = $this->postJson('/api/v1/auth/otp/verify', [
        'phone' => '+255712345678',
        'code' => $code,
        'region' => 'TZ',
    ]);
    $resp->assertOk()
        ->assertJsonPath('ok', true)
        ->assertJsonPath('user.phone', '+255712345678')
        ->assertJsonPath('user.role', 'Farmer');

    expect(User::where('phone', '+255712345678')->exists())->toBeTrue();
    expect($this->getJson('/api/v1/me')->json('user.phone'))->toBe('+255712345678');
});

it('rejects an incorrect code', function () {
    OtpCode::create([
        'phone' => '+255712345678',
        'code_hash' => Hash::make('999999'),
        'channel' => 'sms',
        'expires_at' => now()->addMinutes(5),
    ]);
    $this->postJson('/api/v1/auth/otp/verify', [
        'phone' => '+255712345678',
        'code' => '000000',
        'region' => 'TZ',
    ])->assertStatus(422);
});
