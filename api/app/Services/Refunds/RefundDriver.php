<?php

namespace App\Services\Refunds;

use App\Models\Refund;

interface RefundDriver
{
    /** Provider id as stored on `refunds.provider`. */
    public function id(): string;

    /**
     * Initiate a refund. Implementations mark the row Processing on success
     * (with a provider reference) and either Refunded or Failed once the
     * webhook arrives.
     *
     * Returns true if the provider accepted the request, false otherwise.
     */
    public function refund(Refund $refund): bool;
}
