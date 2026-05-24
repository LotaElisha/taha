<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payment_gateway_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('provider', 32); // Selcom, AzamPay, M-Pesa, TigoPesa, Bank
            $table->boolean('enabled')->default(false);
            // Encrypted at rest by Laravel's encrypted cast in the model.
            $table->text('api_key')->nullable();
            $table->text('api_secret')->nullable();
            $table->string('vendor_provider_id')->nullable();
            $table->string('shortcode')->nullable();
            $table->string('account_name')->nullable();
            $table->string('account_number')->nullable();
            $table->string('bank_name')->nullable();
            $table->timestamps();

            $table->unique(['vendor_id', 'provider']);
        });

        Schema::create('push_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('token')->unique();
            // 'web' = Web Push; 'expo' = Expo Notifications. Same contract.
            $table->enum('platform', ['web', 'expo'])->default('web');
            $table->json('keys')->nullable(); // p256dh + auth for Web Push.
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'platform']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('push_tokens');
        Schema::dropIfExists('payment_gateway_configs');
    }
};
