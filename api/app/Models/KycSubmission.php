<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class KycSubmission extends Model
{
    use HasFactory;
    use LogsActivity;

    protected $fillable = [
        'user_id', 'nin', 'id_front_path', 'id_back_path', 'selfie_path',
        'status', 'reviewed_by', 'reviewed_at', 'reviewer_note', 'checks',
    ];

    protected function casts(): array
    {
        return [
            'checks' => 'array',
            'reviewed_at' => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'reviewer_note', 'reviewed_by'])
            ->logOnlyDirty();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * Generate a short-lived signed URL for each KYC document.
     * Admin KYC queue calls this when rendering thumbnails.
     */
    public function signedUrls(int $ttlMinutes = 10): array
    {
        $disk = Storage::disk('r2-private');
        $expires = now()->addMinutes($ttlMinutes);
        return [
            'id_front' => $this->id_front_path ? $disk->temporaryUrl($this->id_front_path, $expires) : null,
            'id_back' => $this->id_back_path ? $disk->temporaryUrl($this->id_back_path, $expires) : null,
            'selfie' => $this->selfie_path ? $disk->temporaryUrl($this->selfie_path, $expires) : null,
        ];
    }
}
