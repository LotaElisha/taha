<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tool extends Model
{
    protected $fillable = [
        'owner_id', 'name', 'description', 'image_url',
        'daily_rate', 'availability', 'category', 'unavailable_ranges',
    ];

    protected function casts(): array
    {
        return [
            'daily_rate' => 'decimal:2',
            'unavailable_ranges' => 'array',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(ToolBooking::class);
    }
}
