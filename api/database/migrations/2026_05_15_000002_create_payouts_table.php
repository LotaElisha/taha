<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * `payouts` — money going OUT to a vendor / provider / tool owner.
 *
 *   • Polymorphic `payable` — currently LogisticsBooking or ToolBooking, but
 *     the shape lets us add Order-level vendor splits later without a schema
 *     change.
 *   • `provider_reference` is the field we use for idempotency: the same
 *     payable can only ever produce one payout row (enforced by the unique
 *     index on (payable_type, payable_id)).
 *   • `attempts` increments every time we retry a Failed payout. The queue
 *     worker has its own retry backoff; this column is for human auditing.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('payouts', function (Blueprint $table) {
            $table->id();

            // Who is being paid + how much.
            $table->foreignId('recipient_id')->constrained('users')->restrictOnDelete();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('TZS');

            // What the payout is FOR. One payout per payable (idempotency).
            $table->string('payable_type', 80);
            $table->unsignedBigInteger('payable_id');

            // State machine.
            $table->enum('status', [
                'Pending', 'Processing', 'Paid', 'Failed', 'Cancelled',
            ])->default('Pending');
            $table->string('provider', 32)->default('mpesa'); // mpesa_b2c, stripe, ...
            $table->string('provider_reference')->nullable();  // CallbackResultURL conversation id
            $table->string('failure_reason')->nullable();
            $table->unsignedTinyInteger('attempts')->default(0);

            $table->timestamp('queued_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->unique(['payable_type', 'payable_id'], 'payouts_payable_unique');
            $table->index(['recipient_id', 'status']);
            $table->index(['status', 'queued_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payouts');
    }
};
