<?php

use App\Http\Controllers\Api\Admin\AdminDisputeController;
use App\Http\Controllers\Api\Admin\AdminStatsController;
use App\Http\Controllers\Api\Admin\KycReviewController;
use App\Http\Controllers\Api\AI\PlantScanController;
use App\Http\Controllers\Api\AI\SearchController;
use App\Http\Controllers\Api\AI\WeatherController;
use App\Http\Controllers\Api\Auth\AdminLoginController;
use App\Http\Controllers\Api\Auth\OtpController;
use App\Http\Controllers\Api\Auth\SessionController;
use App\Http\Controllers\Api\DisputeController;
use App\Http\Controllers\Api\KycController;
use App\Http\Controllers\Api\LogisticsController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PayoutController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\PushTokenController;
use App\Http\Controllers\Api\RefundController;
use App\Http\Controllers\Api\ToolBookingController;
use Illuminate\Support\Facades\Route;

/*
 * All routes are mounted under /api/v1 (apiPrefix in bootstrap/app.php).
 * Public routes do not require Sanctum. Protected routes require a
 * stateful SPA session via auth:sanctum.
 */

// Public marketplace + auth surface
Route::middleware('throttle:60,1')->group(function () {
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{product}', [ProductController::class, 'show']);

    // Searches go through Gemini — heavier rate cap.
    Route::middleware('throttle:30,1')->group(function () {
        Route::post('/search', [SearchController::class, 'search']);
        Route::post('/ai/weather', [WeatherController::class, 'show']);
    });
});

// Auth — phone-OTP primary path.
Route::middleware('throttle:20,1')->group(function () {
    Route::post('/auth/otp/request', [OtpController::class, 'request']);
    Route::post('/auth/otp/verify', [OtpController::class, 'verify']);
    Route::post('/auth/admin/login', [AdminLoginController::class, 'login']);
});
Route::get('/me', [SessionController::class, 'me']);

// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [SessionController::class, 'logout']);
    Route::patch('/me/role', [SessionController::class, 'updateRole']);

    Route::get('/orders/mine', [OrderController::class, 'mine']);
    Route::post('/orders', [OrderController::class, 'store']);

    Route::post('/kyc/submit', [KycController::class, 'submit']);

    // Disputes — customer surface.
    Route::post('/orders/{order}/disputes', [DisputeController::class, 'store']);
    Route::get('/disputes/mine', [DisputeController::class, 'mine']);

    // Payments — initiating a charge requires auth (the order must belong
    // to the caller). Webhooks below are public + signature-verified.
    Route::post('/orders/{order}/charge', [PaymentController::class, 'charge']);

    // Push token registration — idempotent per (user, token).
    Route::post('/push-tokens', [PushTokenController::class, 'store']);
    Route::delete('/push-tokens/{token}', [PushTokenController::class, 'destroy']);

    // Logistics + tool bookings (with server-side fare calculation).
    Route::post('/logistics/quote', [LogisticsController::class, 'quote']);
    Route::post('/logistics/bookings', [LogisticsController::class, 'store']);
    Route::post('/logistics/bookings/{booking}/transition', [LogisticsController::class, 'transition']);

    Route::post('/tool-bookings', [ToolBookingController::class, 'store']);
    Route::post('/tool-bookings/{booking}/transition', [ToolBookingController::class, 'transition']);

    // Plant scan is privileged because it costs real Gemini money.
    Route::middleware('throttle:30,1')->post('/ai/plant-scan', [PlantScanController::class, 'analyze']);

    // Product CRUD routes
    Route::middleware('role:Agrodealer|Agrovet|Admin|SuperAdmin|CatalogManager')->group(function () {
        Route::post('/products', [ProductController::class, 'store']);
        Route::put('/products/{product}', [ProductController::class, 'update']);
        Route::delete('/products/{product}', [ProductController::class, 'destroy']);
    });
});


// Payment webhooks — public, signature-verified inside the controller.
// They sit outside the Sanctum/CSRF stateful group because the provider
// can't carry our session cookie.
Route::post('/payments/mpesa/callback', [PaymentController::class, 'mpesaCallback'])
    ->withoutMiddleware(['throttle:api']);
Route::post('/payments/selcom/ipn', [PaymentController::class, 'selcomIpn'])
    ->withoutMiddleware(['throttle:api']);
Route::post('/payments/mpesa/b2c/result', [PayoutController::class, 'mpesaResult'])
    ->withoutMiddleware(['throttle:api']);
Route::post('/payments/mpesa/b2c/timeout', [PayoutController::class, 'mpesaTimeout'])
    ->withoutMiddleware(['throttle:api']);

// M-Pesa Reversal callbacks — same signed-URL pattern as B2C, gated by HMAC
// of the refund id. Public so Daraja can hit them; signature verified inline.
Route::post('/payments/mpesa/reversal/result', [RefundController::class, 'mpesaResult'])
    ->withoutMiddleware(['throttle:api']);
Route::post('/payments/mpesa/reversal/timeout', [RefundController::class, 'mpesaTimeout'])
    ->withoutMiddleware(['throttle:api']);

// Admin — gated by Spatie role middleware (Admin, SuperAdmin, KYCOfficer).
Route::middleware(['auth:sanctum', 'role:Admin|SuperAdmin|KYCOfficer'])
    ->prefix('admin/kyc')->group(function () {
        Route::get('/queue', [KycReviewController::class, 'queue']);
        Route::get('/{submission}', [KycReviewController::class, 'show']);
        Route::post('/{submission}/decide', [KycReviewController::class, 'decide']);
    });

// Payouts queue — gated by financial roles. View + retry are open to all
// financial roles; mark-paid and cancel are admin-only because they bypass
// the provider rails and need stronger accountability.
Route::middleware(['auth:sanctum', 'role:Admin|SuperAdmin|FinancialAuditor'])
    ->prefix('admin')->group(function () {
        Route::get('/payouts', [PayoutController::class, 'index']);
        Route::post('/payouts/{payout}/retry', [PayoutController::class, 'retry']);
    });
Route::middleware(['auth:sanctum', 'role:Admin|SuperAdmin'])
    ->prefix('admin')->group(function () {
        Route::post('/payouts/{payout}/mark-paid', [PayoutController::class, 'markPaid']);
        Route::post('/payouts/{payout}/cancel', [PayoutController::class, 'cancel']);
    });

// Disputes queue — Support agents triage, Admins finalise. Approve / reject
// are split into the second group because they trigger refunds, which is a
// privileged action.
Route::middleware(['auth:sanctum', 'role:Admin|SuperAdmin|SupportAgent'])
    ->prefix('admin')->group(function () {
        Route::get('/disputes', [AdminDisputeController::class, 'index']);
        Route::get('/disputes/{dispute}', [AdminDisputeController::class, 'show']);
    });
Route::middleware(['auth:sanctum', 'role:Admin|SuperAdmin'])
    ->prefix('admin')->group(function () {
        Route::post('/disputes/{dispute}/approve', [AdminDisputeController::class, 'approve']);
        Route::post('/disputes/{dispute}/reject', [AdminDisputeController::class, 'reject']);
    });

// Refunds — view + retry open to financial roles, mark-refunded / cancel
// admin-only (same split as payouts).
Route::middleware(['auth:sanctum', 'role:Admin|SuperAdmin|FinancialAuditor'])
    ->prefix('admin')->group(function () {
        Route::get('/refunds', [RefundController::class, 'index']);
        Route::post('/refunds/{refund}/retry', [RefundController::class, 'retry']);
    });
Route::middleware(['auth:sanctum', 'role:Admin|SuperAdmin'])
    ->prefix('admin')->group(function () {
        Route::post('/refunds/{refund}/mark-refunded', [RefundController::class, 'markRefunded']);
        Route::post('/refunds/{refund}/cancel', [RefundController::class, 'cancel']);
    });

// Admin stats + data tables — SuperAdmin, Admin, FinancialAuditor can read.
Route::middleware(['auth:sanctum', 'role:Admin|SuperAdmin|FinancialAuditor|KYCOfficer|SupportAgent'])
    ->prefix('admin')->group(function () {
        Route::get('/stats', [AdminStatsController::class, 'overview']);
        Route::get('/orders', [AdminStatsController::class, 'orders']);
        Route::get('/users', [AdminStatsController::class, 'users']);
        Route::get('/products', [AdminStatsController::class, 'products']);
        Route::get('/audit-logs', [AdminStatsController::class, 'auditLogs']);
    });
