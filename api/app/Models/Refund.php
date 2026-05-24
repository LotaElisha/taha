<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

/**
 * Refund — money going BACK to a customer.
 *
 * Modelled deliberately to mirror Payout so the operator UI (retry, mark,
 * cancel) feels symmetric.
 *
 * State machine:
 *   Pending → Processing → (Refunded | Failed)
 *               ↓
 *           Cancelled (terminal, set by admin)
 *
 * The `provider` column picks the rail:
 *   • mpesa_reversal — Safaricom Daraja Reversal API.
 *   • selcom_refund  — Selcom refund endpoint.
 *   • manual         — Off-platform (cash returned, bank wire). Marked
 *                       Refunded via `mark-refunded` admin action; never
 *                       hits a provider.
 */
class Refund extends Model
{
    use LogsActivity;

    protected $fillable = [
        'dispute_id', 'order_id', 'recipient_id',
        'amount', 'currency',
        'status', 'provider', 'provider_reference',
        'failure_reason', 'attempts',
        'queued_at', 'refunded_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'attempts' => 'integer',
            'queued_at' => 'datetime',
            'refunded_at' => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'amount', 'provider', 'provider_reference', 'failure_reason', 'attempts'])
            ->logOnlyDirty();
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function dispute(): BelongsTo
    {
        return $this->belongsTo(Dispute::class);
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }

    public function markProcessing(?string $providerReference = null): void
    {
        $this->update([
            'status' => 'Processing',
            'provider_reference' => $providerReference ?? $this->provider_reference,
            'attempts' => $this->attempts + 1,
            'queued_at' => $this->queued_at ?? now(),
        ]);
    }

    /**
     * Mark the refund settled. If a dispute is attached, advance it to Resolved.
     * This is the only place dispute status flips Approved → Resolved.
     */
    public function markRefunded(?string $providerReference = null): void
    {
        $this->update([
            'status' => 'Refunded',
            'provider_reference' => $providerReference ?? $this->provider_reference,
            'refunded_at' => now(),
            'failure_reason' => null,
        ]);

        $this->dispute()->whereIn('status', ['Approved'])->update([
            'status' => 'Resolved',
        ]);
    }

    public function markFailed(string $reason): void
    {
        $this->update([
            'status' => 'Failed',
            'failure_reason' => $reason,
        ]);
    }
}
