<?php

namespace App\Services\Payouts;

use App\Models\LogisticsBooking;
use App\Models\Payout;
use App\Models\ToolBooking;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * PayoutService — entry point used by listeners + admin tools.
 *
 *   • `enqueueForLogisticsBooking($booking)` / `enqueueForToolBooking($booking)`
 *     are idempotent. Calling them twice on the same booking returns the
 *     existing payout row instead of creating a duplicate (unique index on
 *     `(payable_type, payable_id)` enforces that at the DB level too).
 *   • `disburse($payout)` picks the driver by `provider` field. Wraps the
 *     driver call so any thrown exception ends up on the Payout row, not in
 *     a queue worker's stack trace.
 */
class PayoutService
{
    public function __construct(
        private readonly MpesaB2cDriver $mpesa,
    ) {}

    public function enqueueForLogisticsBooking(LogisticsBooking $booking): ?Payout
    {
        if (!$booking->provider_id) return null;
        $amount = (float) ($booking->provider_payout ?? 0);
        if ($amount <= 0) return null;

        return $this->upsertPayout(
            recipient: User::find($booking->provider_id),
            amount: $amount,
            payableType: LogisticsBooking::class,
            payableId: $booking->id,
        );
    }

    public function enqueueForToolBooking(ToolBooking $booking): ?Payout
    {
        // Pay the tool owner.
        $tool = $booking->tool;
        if (!$tool) return null;
        $owner = User::find($tool->owner_id);
        if (!$owner) return null;
        $amount = (float) ($booking->owner_payout ?? 0);
        if ($amount <= 0) return null;

        return $this->upsertPayout(
            recipient: $owner,
            amount: $amount,
            payableType: ToolBooking::class,
            payableId: $booking->id,
        );
    }

    public function disburse(Payout $payout): bool
    {
        $driver = match ($payout->provider) {
            'mpesa', 'mpesa_b2c' => $this->mpesa,
            default => null,
        };
        if (!$driver) {
            $payout->markFailed("No driver for provider '{$payout->provider}'");
            return false;
        }
        try {
            return $driver->disburse($payout);
        } catch (\Throwable $e) {
            Log::warning('Payout driver threw', ['payout' => $payout->id, 'error' => $e->getMessage()]);
            $payout->markFailed(substr($e->getMessage(), 0, 200));
            return false;
        }
    }

    private function upsertPayout(?User $recipient, float $amount, string $payableType, int $payableId): ?Payout
    {
        if (!$recipient) return null;

        // Idempotent: same (payable_type, payable_id) returns the existing row.
        return DB::transaction(function () use ($recipient, $amount, $payableType, $payableId) {
            $row = Payout::firstOrCreate(
                ['payable_type' => $payableType, 'payable_id' => $payableId],
                [
                    'recipient_id' => $recipient->id,
                    'amount' => $amount,
                    'currency' => 'TZS',
                    'status' => 'Pending',
                    'provider' => 'mpesa_b2c',
                ],
            );
            return $row;
        });
    }
}
