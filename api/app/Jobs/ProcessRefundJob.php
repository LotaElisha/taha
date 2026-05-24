<?php

namespace App\Jobs;

use App\Models\Refund;
use App\Services\Refunds\RefundService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Picks up a Pending refund and ships it through the driver. Mirrors
 * ProcessPayoutJob — same retry profile, same idempotency contract.
 */
class ProcessRefundJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(public readonly int $refundId) {}

    public function handle(RefundService $refunds): void
    {
        /** @var Refund|null $refund */
        $refund = Refund::find($this->refundId);
        if (!$refund) return;

        if (!in_array($refund->status, ['Pending', 'Failed'], true)) return;

        $refunds->refund($refund);
    }
}
