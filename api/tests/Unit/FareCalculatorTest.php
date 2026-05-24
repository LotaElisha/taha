<?php

use App\Services\Fares\FareCalculator;

it('computes a logistics fare that splits 88/12 between provider and platform', function () {
    $fares = new FareCalculator();

    // 75 km between Arusha and Moshi.
    $result = $fares->logisticsFare(75.0);

    // Base 15,000 + 75 * 1,800 = 150,000.
    expect($result['fare'])->toBe(150000.00);
    expect($result['platform_fee'])->toBe(18000.00);
    expect($result['provider_payout'])->toBe(132000.00);
    expect($result['distance_km'])->toBe(75.00);

    // Conservation of money: provider + platform == fare.
    expect($result['provider_payout'] + $result['platform_fee'])->toBe($result['fare']);
});

it('computes a tool fare that splits 88/12 between owner and platform', function () {
    $fares = new FareCalculator();

    // 25,000 TZS/day for 4 days = 100,000.
    $result = $fares->toolFare(25000.0, 4);

    expect($result['total_cost'])->toBe(100000.00);
    expect($result['platform_fee'])->toBe(12000.00);
    expect($result['owner_payout'])->toBe(88000.00);
    expect($result['owner_payout'] + $result['platform_fee'])->toBe($result['total_cost']);
});

it('treats 0 or negative days as 1-day minimum on tool fares', function () {
    $fares = new FareCalculator();

    expect($fares->toolFare(10000.0, 0)['total_cost'])->toBe(10000.00);
    expect($fares->toolFare(10000.0, -3)['total_cost'])->toBe(10000.00);
});

it('Haversine distance between Arusha and Moshi is roughly 75 km', function () {
    $fares = new FareCalculator();

    // Arusha (-3.3869, 36.6829) → Moshi (-3.3473, 37.3398).
    $km = $fares->distanceKm(-3.3869, 36.6829, -3.3473, 37.3398);

    expect($km)->toBeGreaterThan(70.0);
    expect($km)->toBeLessThan(80.0);
});
