<?php

namespace App\Services\Payments;

use App\Models\Order;

interface PaymentDriver
{
    /** Provider name as it appears in the DB and the UI ("mpesa", "selcom", …). */
    public function id(): string;

    /**
     * Initiate a payment for the given order. Returns a provider-specific
     * payload the React client can use to complete the charge — for M-Pesa
     * that's a "STK push initiated" message; for Selcom it's a checkout URL.
     */
    public function charge(Order $order, array $context = []): array;

    /**
     * Verify and apply a webhook callback from the provider. Returns the
     * resolved order. Throws if the signature is invalid or the payload
     * doesn't match an order on file.
     */
    public function handleWebhook(array $payload, array $headers): Order;
}
