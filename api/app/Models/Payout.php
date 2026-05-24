<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Payout extends Model
{
    use LogsActivity;

    protected $fillable = [
        'recipient_id', 'amount', 'currency',
        'payable_type', 'payable_id',
        'status', 'provider', 'provider_reference',
        'failure_reason', 'attempts',
        'queued_at', 'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'attempts' => 'integer',
            'queued_at' => 'datetime',
            'paid_at' => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'amount', 'provider_reference', 'failure_reason', 'attempts'])
            ->logOnlyDirty();
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }

    public function payable(): MorphTo
    {
        return $this->morphTo();
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

    public function markPaid(?string $providerReference = null): void
    {
        $this->update([
            'status' => 'Paid',
            'provider_reference' => $providerReference ?? $this->provider_reference,
            'paid_at' => now(),
            'failure_reason' => null,
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
