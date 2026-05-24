<?php

namespace App\Services\Fares;

/**
 * FareCalculator — pure functions. Distance is computed with the Haversine
 * formula; fares apply a fixed base + a per-km rate. Platform fee is 12 %
 * of the gross, payable to the provider is the remainder.
 *
 * Numbers are tuned for the Tanzanian intercity context, not Nairobi/Dar
 * city deliveries. Tune in production once we have real-trip data.
 */
class FareCalculator
{
    public const TRUCK_BASE = 15000.00; // TZS
    public const TRUCK_PER_KM = 1800.00;
    public const TOOL_PLATFORM_PCT = 0.12;

    public function distanceKm(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $R = 6371.0;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) ** 2;
        return $R * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    public function logisticsFare(float $distanceKm): array
    {
        $gross = self::TRUCK_BASE + (self::TRUCK_PER_KM * $distanceKm);
        $platformFee = round($gross * self::TOOL_PLATFORM_PCT, 2);
        return [
            'distance_km' => round($distanceKm, 2),
            'fare' => round($gross, 2),
            'platform_fee' => $platformFee,
            'provider_payout' => round($gross - $platformFee, 2),
        ];
    }

    public function toolFare(float $dailyRate, int $days): array
    {
        $gross = $dailyRate * max(1, $days);
        $platformFee = round($gross * self::TOOL_PLATFORM_PCT, 2);
        return [
            'total_cost' => round($gross, 2),
            'platform_fee' => $platformFee,
            'owner_payout' => round($gross - $platformFee, 2),
        ];
    }
}
