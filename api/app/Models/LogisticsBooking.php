<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LogisticsBooking extends Model
{
    protected $fillable = [
        'farmer_id', 'provider_id', 'pickup_location', 'dropoff_location',
        'cargo_details', 'truck_type_id', 'pickup_date', 'status', 'fare',
        'platform_fee', 'provider_payout', 'distance_km', 'paid_to_provider_at',
    ];

    protected function casts(): array
    {
        return [
            'pickup_date' => 'date',
            'fare' => 'decimal:2',
            'platform_fee' => 'decimal:2',
            'provider_payout' => 'decimal:2',
            'distance_km' => 'decimal:2',
            'paid_to_provider_at' => 'datetime',
        ];
    }

    public function farmer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'farmer_id');
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'provider_id');
    }
}
