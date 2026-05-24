<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ToolBooking extends Model
{
    protected $fillable = [
        'tool_id', 'farmer_id', 'start_date', 'end_date', 'total_cost', 'status',
        'platform_fee', 'owner_payout', 'paid_to_owner_at',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'total_cost' => 'decimal:2',
            'platform_fee' => 'decimal:2',
            'owner_payout' => 'decimal:2',
            'paid_to_owner_at' => 'datetime',
        ];
    }

    public function tool(): BelongsTo
    {
        return $this->belongsTo(Tool::class);
    }

    public function farmer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'farmer_id');
    }
}
