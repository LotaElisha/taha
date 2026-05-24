<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

/**
 * Dispute — a customer-raised complaint about a delivered order.
 *
 * Lifecycle:
 *   Open → UnderReview → (Approved | Rejected)
 *                                ↓
 *                              Resolved   (once the linked refund is Refunded)
 *
 * The Approved → Resolved transition is driven by ProcessRefundJob via
 * Refund::markRefunded(), not by an admin action. Admins decide *whether*
 * to refund; the rails decide *when* it actually settles.
 */
class Dispute extends Model
{
    use LogsActivity;

    /** Reason codes — the UI picker enforces this set but we don't bind in DB. */
    public const REASONS = [
        'damaged',         // Items arrived broken/spoiled.
        'wrong_items',     // Delivered ≠ ordered.
        'missing_items',   // Short delivery.
        'quality',         // Subpar (e.g. expired, off-spec).
        'no_show',         // Delivery never happened.
        'other',
    ];

    protected $fillable = [
        'order_id', 'opened_by_user_id',
        'reason', 'description',
        'status',
        'decided_by_user_id', 'resolution_note', 'decided_at',
    ];

    protected function casts(): array
    {
        return [
            'decided_at' => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'decided_by_user_id', 'resolution_note', 'decided_at'])
            ->logOnlyDirty();
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function openedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'opened_by_user_id');
    }

    public function decidedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'decided_by_user_id');
    }

    /** A dispute may produce at most one refund (admin's decision). */
    public function refund(): HasOne
    {
        return $this->hasOne(Refund::class);
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(Refund::class);
    }

    /** Statuses an admin still needs to action. */
    public function scopeOpen(Builder $q): Builder
    {
        return $q->whereIn('status', ['Open', 'UnderReview']);
    }

    /** Whether this dispute can still accept a decision. */
    public function isActionable(): bool
    {
        return in_array($this->status, ['Open', 'UnderReview'], true);
    }
}
