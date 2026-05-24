<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens;
    use HasFactory;
    use HasRoles;
    use LogsActivity;
    use Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'phone_verified_at',
        'region',
        'role',
        'kyc_status',
        'nin',
        'kyc_submitted_at',
        'kyc_reviewed_at',
        'kyc_reviewed_by',
        'location',
        'lat',
        'lon',
        'business_description',
        'logo_url',
        'operating_hours',
        'specialties',
        'whatsapp_config',
        'google_business_config',
        'rating',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'kyc_submitted_at' => 'datetime',
            'kyc_reviewed_at' => 'datetime',
            'password' => 'hashed',
            'specialties' => 'array',
            'whatsapp_config' => 'encrypted:array',
            'google_business_config' => 'encrypted:array',
            'lat' => 'decimal:7',
            'lon' => 'decimal:7',
            'rating' => 'decimal:2',
        ];
    }

    /** Spatie activitylog: track every change to identity + KYC fields. */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'email', 'phone', 'role', 'kyc_status', 'nin'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'vendor_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function farms(): HasMany
    {
        return $this->hasMany(Farm::class);
    }

    public function kycSubmissions(): HasMany
    {
        return $this->hasMany(KycSubmission::class);
    }

    public function pushTokens(): HasMany
    {
        return $this->hasMany(PushToken::class);
    }

    /** True for any role that can act on KYC + admin-only screens. */
    public function isStaff(): bool
    {
        return in_array($this->role, [
            'Admin', 'SuperAdmin', 'KYCOfficer',
            'CatalogManager', 'SupportAgent', 'FinancialAuditor',
        ], true);
    }

    public function isVendor(): bool
    {
        return in_array($this->role, ['Agrodealer', 'Agrovet'], true);
    }
}
