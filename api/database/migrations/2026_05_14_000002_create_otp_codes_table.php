<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // We persist OTPs server-side so we can:
        //   * Rate-limit per phone and per IP (DESIGN_SPEC §9.2 fraud controls).
        //   * Expire codes after 5 minutes.
        //   * Distinguish SMS vs. voice delivery for analytics.
        // Codes are stored hashed — never plaintext.
        Schema::create('otp_codes', function (Blueprint $table) {
            $table->id();
            $table->string('phone', 20)->index();
            $table->string('code_hash', 255);
            $table->enum('channel', ['sms', 'voice'])->default('sms');
            $table->string('ip', 45)->nullable();
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamp('expires_at');
            $table->timestamp('consumed_at')->nullable();
            $table->timestamps();

            $table->index(['phone', 'expires_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('otp_codes');
    }
};
