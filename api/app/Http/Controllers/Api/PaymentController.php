<?php

namespace App\Http\Controllers\Api;

use App\Models\Order;
use App\Services\Payments\MpesaDarajaDriver;
use App\Services\Payments\SelcomDriver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class PaymentController extends Controller
{
    /** POST /api/v1/orders/{order}/charge — kick off the chosen tender. */
    public function charge(Request $request, Order $order): JsonResponse
    {
        $data = $request->validate([
            'method' => ['required', Rule::in(['mpesa', 'selcom'])],
            'phone' => ['nullable', 'string', 'regex:/^\+\d{10,15}$/'],
        ]);

        $user = $request->user();
        if ($user && $order->user_id !== $user->id) {
            abort(403);
        }

        $driver = match ($data['method']) {
            'mpesa' => app(MpesaDarajaDriver::class),
            'selcom' => app(SelcomDriver::class),
        };

        try {
            $result = $driver->charge($order, ['phone' => $data['phone'] ?? null]);
            return response()->json(['data' => $result]);
        } catch (\Throwable $e) {
            Log::warning('Payment initiation failed', [
                'order' => $order->id, 'method' => $data['method'], 'error' => $e->getMessage(),
            ]);
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /** POST /api/v1/payments/mpesa/callback?sig=… — Daraja STK callback. */
    public function mpesaCallback(Request $request): JsonResponse
    {
        $orderId = (int) ($request->query('order') ?? 0);
        $sig = (string) $request->query('sig', '');

        // The order id is encoded in the AccountReference; pull it from the
        // standard Daraja result body when the query param is missing.
        if (!$orderId) {
            $ref = data_get($request->all(), 'Body.stkCallback.MerchantRequestID', '');
            // Daraja doesn't echo our AccountReference; fall back to looking up
            // the order by CheckoutRequestID stashed earlier in payment_reference.
            $checkoutId = data_get($request->all(), 'Body.stkCallback.CheckoutRequestID');
            $orderId = (int) Order::where('payment_reference', $checkoutId)->value('id');
        }

        $driver = app(MpesaDarajaDriver::class);
        if (!$orderId || !$driver->verifyCallbackSig($orderId, $sig)) {
            Log::warning('Invalid M-Pesa callback signature', ['orderId' => $orderId]);
            return response()->json(['ResultCode' => 1, 'ResultDesc' => 'Bad signature']);
        }

        $payload = $request->all();
        $payload['__order_id'] = $orderId;
        $driver->handleWebhook($payload, $request->headers->all());

        return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Accepted']);
    }

    /** POST /api/v1/payments/selcom/ipn — Selcom signed webhook. */
    public function selcomIpn(Request $request): JsonResponse
    {
        $driver = app(SelcomDriver::class);
        try {
            $driver->handleWebhook($request->all(), $request->headers->all());
            return response()->json(['ok' => true]);
        } catch (\Throwable $e) {
            Log::warning('Selcom IPN rejected', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Bad webhook'], 422);
        }
    }
}
