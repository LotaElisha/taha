<?php

namespace App\Jobs;

use App\Models\Payout;
use App\Services\Payouts\PayoutService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Picks up a Pending payout and ships it through the driver.
 * The driver flips the row to Processing (sync) then later to Paid/Failed
 * via the webhook handler. This job only catches up-front rejections.
 */
class ProcessPayoutJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;
    public int $backoff = 60; // seconds — first retry at 1 min, then 2 min, then 3.

    public function __construct(public readonly int $payoutId) {}

    public function handle(PayoutService $payouts): void
    {
        /** @var Payout|null $payout */
        $payout = Payout::find($this->payoutId);
        if (!$payout) return;

        // Skip anything already in flight or finalized — protects against
        // duplicate dispatches.
        if (!in_array($payout->status, ['Pending', 'Failed'], true)) return;

        $payouts->disburse($payout);
    }
}
