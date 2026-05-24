<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Spatie laravel-activitylog v4 schema, inlined.
 *
 * Normally this comes from `php artisan vendor:publish --provider="Spatie\\Activitylog\\ActivitylogServiceProvider"`.
 * We inline it so `migrate:fresh --seed` works on a clean clone without
 * extra setup. Columns match Spatie's published default verbatim — including
 * the v3 → v4 additions (`batch_uuid`, `event`) merged into a single create.
 */
return new class extends Migration {
    public function up(): void
    {
        $table = config('activitylog.table_name', 'activity_log');

        Schema::create($table, function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->string('log_name')->nullable();
            $t->text('description');
            $t->nullableMorphs('subject', 'subject');
            $t->nullableMorphs('causer', 'causer');
            $t->json('properties')->nullable();
            $t->uuid('batch_uuid')->nullable();
            $t->string('event')->nullable();
            $t->timestamps();
            $t->index('log_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(config('activitylog.table_name', 'activity_log'));
    }
};
