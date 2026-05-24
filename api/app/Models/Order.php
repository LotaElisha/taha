<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Order extends Model
{
    use HasFactory;
    use LogsActivity;

    protected $fillable = [
        'user_id', 'guest_name', 'guest_phone', 'guest_address',
        'subtotal', 'delivery_cost', 'tax', 'discount', 'total', 'currency',
        'status', 'channel', 'delivery_option_id', 'payment_method_id',
        'payment_reference', 'paid_at',
        'disputable_until', 'dispute_status',
    ];

    /** Window during which a customer can open a dispute after Delivered. */
    public const DISPUTE_WINDOW_DAYS = 7;

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'delivery_cost' => 'decimal:2',
            'tax' => 'decimal:2',
            'discount' => 'decimal:2',
            'total' => 'decimal:2',
            'paid_at' => 'datetime',
            'disputable_until' => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'payment_reference', 'paid_at'])
            ->logOnlyDirty();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function disputes(): HasMany
    {
        return $this->hasMany(Dispute::class);
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(Refund::class);
    }

    /**
     * Can a customer still open a dispute on this order?
     *   • Order must be Delivered or Completed.
     *   • Within the dispute window (default 7d).
     *   • No active dispute already.
     */
    public function isDisputable(): bool
    {
        if (!in_array($this->status, ['Delivered', 'Completed'], true)) {
            return false;
        }
        if ($this->disputable_until && $this->disputable_until->isPast()) {
            return false;
        }
        return !$this->disputes()
            ->whereIn('status', ['Open', 'UnderReview', 'Approved'])
            ->exists();
    }
}
