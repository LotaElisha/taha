<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('farms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('location');
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lon', 10, 7)->nullable();
            $table->decimal('size_acres', 8, 2);
            $table->json('main_crops')->nullable();
            $table->timestamps();
        });

        Schema::create('tools', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('image_url')->nullable();
            $table->decimal('daily_rate', 12, 2);
            $table->enum('availability', ['Available', 'Rented Out', 'Maintenance'])->default('Available');
            $table->enum('category', ['Tractor', 'Tillage', 'Seeding', 'Harvester', 'Other'])->default('Other');
            $table->json('unavailable_ranges')->nullable();
            $table->timestamps();

            $table->index(['owner_id', 'availability']);
        });

        Schema::create('tool_bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tool_id')->constrained()->cascadeOnDelete();
            $table->foreignId('farmer_id')->constrained('users')->cascadeOnDelete();
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('total_cost', 12, 2);
            $table->enum('status', [
                'Pending', 'Confirmed', 'Active', 'Completed', 'Cancelled', 'Rejected',
            ])->default('Pending');
            $table->timestamps();

            $table->index(['farmer_id', 'status']);
            $table->index(['tool_id', 'start_date', 'end_date']);
        });

        Schema::create('logistics_bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('farmer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('provider_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('pickup_location');
            $table->string('dropoff_location');
            $table->text('cargo_details');
            $table->string('truck_type_id', 64);
            $table->date('pickup_date');
            $table->enum('status', [
                'Pending', 'Confirmed', 'In Transit', 'Delivered', 'Cancelled',
            ])->default('Pending');
            $table->decimal('fare', 12, 2)->nullable();
            $table->timestamps();

            $table->index(['provider_id', 'status']);
            $table->index(['status', 'pickup_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('logistics_bookings');
        Schema::dropIfExists('tool_bookings');
        Schema::dropIfExists('tools');
        Schema::dropIfExists('farms');
    }
};
