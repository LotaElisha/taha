<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('email')->nullable()->unique();
            $table->string('password')->nullable(); // Admin email-path users only.
            $table->timestamp('email_verified_at')->nullable();

            // Phone-OTP identity — primary path per DESIGN_SPEC §9.2.
            $table->string('phone', 20)->nullable()->unique();
            $table->timestamp('phone_verified_at')->nullable();
            $table->enum('region', ['TZ', 'KE'])->default('TZ');

            // Role kept as a column (and mirrored via Spatie permissions) so
            // the React app can read it directly from /api/v1/me.
            $table->string('role', 32)->default('Farmer');

            // KYC.
            $table->enum('kyc_status', ['Not Submitted', 'Pending', 'Verified', 'Rejected'])
                ->default('Not Submitted');
            $table->string('nin', 32)->nullable();
            $table->timestamp('kyc_submitted_at')->nullable();
            $table->timestamp('kyc_reviewed_at')->nullable();
            $table->foreignId('kyc_reviewed_by')->nullable()->constrained('users')->nullOnDelete();

            // Business profile fields used by vendors.
            $table->string('location')->nullable();
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lon', 10, 7)->nullable();
            $table->text('business_description')->nullable();
            $table->string('logo_url')->nullable();
            $table->string('operating_hours')->nullable();
            $table->json('specialties')->nullable();
            $table->json('whatsapp_config')->nullable();
            $table->json('google_business_config')->nullable();
            $table->decimal('rating', 3, 2)->default(0);

            $table->rememberToken();
            $table->timestamps();

            $table->index(['role', 'kyc_status']);
            $table->index('phone');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
