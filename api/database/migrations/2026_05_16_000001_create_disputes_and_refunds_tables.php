<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sprint 12 — Refunds & Disputes.
 *
 *   • `disputes`     — customer-raised complaints about a delivered order.
 *                      One open dispute per order at a time (partial unique
 *                      index on order_id WHERE status IN (Open,UnderReview)).
 *   • `refunds`      — money going BACK to a customer. Modelled after payouts
 *                      so the operator UX/actions stay symmetric: retry, mark-
 *                      refunded (off-platform), cancel. Provider field tracks
 *                      mpesa_reversal vs selcom_refund vs manual.
 *   • orders.disputable_until — when the dispute window closes (default 7d
 *                      after Delivered). Cached on the row so we don't recompute
 *                      every query.
 *   • orders.dispute_status — denormalised summary so the orders list can
 *                      filter / badge without a join.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('disputes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('opened_by_user_id')->constrained('users')->restrictOnDelete();

            // Free-form reason code; UI uses an enum picker, but we keep this
            // a string so support agents can introduce new categories without
            // a migration.
            $table->string('reason', 40);
            $table->text('description')->nullable();

            // State machine — narrower than orders.status because disputes are
            // pure workflow rows.
            $table->enum('status', [
                'Open',         // Just submitted, awaiting triage.
                'UnderReview',  // An admin picked it up.
                'Approved',     // Resolution = refund (full or partial). A refund row exists.
                'Rejected',     // Closed without refund. resolution_note explains why.
                'Resolved',     // Approved + refund.status=Refunded. Final state.
            ])->default('Open');

            // Who decided it.
            $table->foreignId('decided_by_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->text('resolution_note')->nullable();

            $table->timestamp('decided_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index(['opened_by_user_id', 'status']);
        });

        // Postgres: enforce at most one OPEN/UnderReview dispute per order via
        // a partial unique index. Falls back to a non-unique index on SQLite/MySQL
        // (the controller still guards in code).
        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            \DB::statement(
                "CREATE UNIQUE INDEX disputes_order_open_unique
                 ON disputes (order_id)
                 WHERE status IN ('Open', 'UnderReview')"
            );
        }

        Schema::create('refunds', function (Blueprint $table) {
            $table->id();

            // What's being refunded — links optional because admins can issue a
            // standalone refund without a dispute (e.g. goodwill).
            $table->foreignId('dispute_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('order_id')->constrained()->restrictOnDelete();
            $table->foreignId('recipient_id')->constrained('users')->restrictOnDelete();

            // How much.
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('TZS');

            // State machine — mirrors payouts.
            $table->enum('status', [
                'Pending', 'Processing', 'Refunded', 'Failed', 'Cancelled',
            ])->default('Pending');

            // Which rail. mpesa_reversal = Daraja Reversal API, selcom_refund =
            // Selcom refund endpoint, manual = off-platform (cash, bank wire).
            $table->string('provider', 32)->default('manual');
            $table->string('provider_reference')->nullable();
            $table->string('failure_reason')->nullable();
            $table->unsignedTinyInteger('attempts')->default(0);

            $table->timestamp('queued_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->timestamps();

            $table->index(['recipient_id', 'status']);
            $table->index(['status', 'queued_at']);
            $table->index('order_id');
        });

        Schema::table('orders', function (Blueprint $table) {
            // Cached resolution window. NULL until the order hits Delivered.
            $table->timestamp('disputable_until')->nullable()->after('paid_at');
            // Denormalised summary for queue filtering.
            $table->string('dispute_status', 24)->nullable()->after('disputable_until');

            $table->index('dispute_status');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['dispute_status']);
            $table->dropColumn(['disputable_until', 'dispute_status']);
        });
        Schema::dropIfExists('refunds');
        Schema::dropIfExists('disputes');
    }
};
