<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('price', 12, 2);
            $table->string('currency', 3)->default('TZS');
            $table->enum('category', [
                'Seeds', 'Fertilizers', 'Pesticides', 'Tools',
                'Animal Medicine', 'Agrovet Services',
            ]);
            $table->string('image_url')->nullable();
            $table->integer('stock')->default(0);
            $table->string('barcode')->nullable()->index();
            $table->boolean('is_featured')->default(false);
            $table->timestamps();

            $table->index(['vendor_id', 'category']);
            $table->index(['category', 'stock']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
