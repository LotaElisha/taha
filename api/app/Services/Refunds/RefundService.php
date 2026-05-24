<?php

namespace App\Services\Refunds;

use App\Models\Refund;
use Illuminate\Support\Facades\Log;

/**
 * Dispatch a refund to the right driver. Mirrors PayoutService.
 *
 *   • `manual` provider is a no-op — operator settles off-platform and clicks
 *     "Mark refunded" in the UI, which calls RefundController::markRefunded().
 *   • Anything else picks the driver via the `id()` lookup.
 */
class RefundService
{
    /** @param iterable<RefundDriver> $drivers */
    public function __construct(private readonly iterable $drivers) {}

    public function refund(Refund $refund): bool
    {
        if ($refund->provider === 'manual') {
            // Nothing to do here — operator action only.
            return true;
        }

        foreach ($this->drivers as $driver) {
            if ($driver->id() === $refund->provider) {
                return $driver->refund($refund);
            }
        }

        Log::warning('No refund driver registered for provider', ['provider' => $refund->provider]);
        $refund->markFailed("No driver configured for provider {$refund->provider}");
        return false;
    }
}
