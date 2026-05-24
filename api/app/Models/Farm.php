<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Farm extends Model
{
    protected $fillable = ['user_id', 'name', 'location', 'lat', 'lon', 'size_acres', 'main_crops'];

    protected function casts(): array
    {
        return ['main_crops' => 'array', 'lat' => 'decimal:7', 'lon' => 'decimal:7', 'size_acres' => 'decimal:2'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
