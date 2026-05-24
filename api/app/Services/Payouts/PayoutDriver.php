<?php

namespace App\Services\Payouts;

use App\Models\Payout;

interface PayoutDriver
{
    /** Provider id as stored on `payouts.provider`. */
    public function id(): string;

    /**
     * Initiate a payout for the given row. Implementations mark the row
     * `Processing` on success (with a provider conversation id) and either
     * `Paid` or `Failed` once the webhook arrives — typically async.
     *
     * Returns true if the provider accepted the request, false otherwise.
     */
    public function disburse(Payout $payout): bool;
}
