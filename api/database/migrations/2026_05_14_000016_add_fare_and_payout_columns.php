<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('logistics_bookings', function (Blueprint $table) {
            // Fare is already nullable in the original migration; add the
            // platform-fee + payout columns the dealer dashboard reads.
            $table->decimal('platform_fee', 12, 2)->default(0)->after('fare');
            $table->decimal('provider_payout', 12, 2)->default(0)->after('platform_fee');
            $table->decimal('distance_km', 8, 2)->nullable()->after('provider_payout');
            $table->timestamp('paid_to_provider_at')->nullable()->after('distance_km');
        });

        Schema::table('tool_bookings', function (Blueprint $table) {
            $table->decimal('platform_fee', 12, 2)->default(0)->after('total_cost');
            $table->decimal('owner_payout', 12, 2)->default(0)->after('platform_fee');
            $table->timestamp('paid_to_owner_at')->nullable()->after('owner_payout');
        });
    }

    public function down(): void
    {
        Schema::table('logistics_bookings', function (Blueprint $table) {
            $table->dropColumn(['platform_fee', 'provider_payout', 'distance_km', 'paid_to_provider_at']);
        });
        Schema::table('tool_bookings', function (Blueprint $table) {
            $table->dropColumn(['platform_fee', 'owner_payout', 'paid_to_owner_at']);
        });
    }
};
