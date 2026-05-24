<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Full-text + trigram search on products. Postgres-only.
 *
 * Skipped on non-pgsql connections (SQLite in tests, MySQL if anyone tries
 * it) so this migration doesn't blow up `php artisan test` or local SQLite
 * dev. Production runs on Postgres per DESIGN_SPEC §14, where this is where
 * the search actually lives.
 *
 *   • pg_trgm extension enables fuzzy / typo-tolerant matching
 *     ("Karte" → "Karate") via the `similarity()` function.
 *
 *   • search_vector is a GENERATED tsvector column (Postgres 12+).
 *     Auto-updates whenever name/description/category changes — no triggers.
 *     Weighted A > B > C so name matches rank above description/category.
 *
 *   • Two GIN indexes:
 *       - products_search_vector_idx covers `@@ plainto_tsquery(...)`
 *       - products_name_trgm_idx covers `similarity(name, ?)` and ILIKE.
 *
 *   • The `simple` dictionary is used (no stemming) because product names
 *     are mostly proper nouns + SKUs ("DK 8033", "YaraMila") where stemming
 *     would hurt precision.
 */
return new class extends Migration {
    public function up(): void
    {
        if (!$this->isPostgres()) {
            return;
        }

        DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');

        DB::statement("
            ALTER TABLE products ADD COLUMN search_vector tsvector
            GENERATED ALWAYS AS (
                setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
                setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
                setweight(to_tsvector('simple', coalesce(category, '')), 'C')
            ) STORED
        ");

        DB::statement('CREATE INDEX products_search_vector_idx ON products USING gin (search_vector)');
        DB::statement('CREATE INDEX products_name_trgm_idx ON products USING gin (name gin_trgm_ops)');
    }

    public function down(): void
    {
        if (!$this->isPostgres()) {
            return;
        }
        DB::statement('DROP INDEX IF EXISTS products_name_trgm_idx');
        DB::statement('DROP INDEX IF EXISTS products_search_vector_idx');
        Schema::table('products', function ($t) {
            $t->dropColumn('search_vector');
        });
        // We don't drop the pg_trgm extension — other tables may depend on it.
    }

    private function isPostgres(): bool
    {
        return Schema::getConnection()->getDriverName() === 'pgsql';
    }
};
