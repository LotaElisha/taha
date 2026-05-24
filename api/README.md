# Mkulima API

Laravel 11 backend for the Mkulima Super App (TAHA). This README is for a
developer joining the backend team — it covers the architecture, the
load-bearing patterns, and the cookbook for the most common changes. For the
broader product context (frontend, design spec, deployment) see
`../DEVELOPER_README.md` and `../DESIGN_SPEC.md`.

---

## 1. Orientation

The API is a single Laravel 11 app. It serves five user surfaces — farmer,
agrodealer / agrovet, agronomist, logistics provider, and back-office staff —
plus webhooks for M-Pesa Daraja, Selcom, and the AI proxy for Gemini.

Everything mounts under **`/api/v1`** (see `apiPrefix` in `bootstrap/app.php`).
Auth is **Sanctum SPA mode** — cookies, not bearer tokens. The React frontend
at `app.mkulima.app` rides the same session cookie for every call.

Key external dependencies:

- **PostgreSQL** for everything that matters (FTS, partial indexes, generated
  columns). Tests run on SQLite in-memory; the FTS migration is a no-op there.
- **Redis** for cache, sessions, queues, and OTP rate-limit counters.
- **AWS S3 / Cloudflare R2** for KYC documents (`r2-private` disk, signed URLs).
- **Africa's Talking** for SMS + voice OTP. Twilio is the planned fallback.
- **M-Pesa Daraja** for STK push (C2B), B2C disbursement (payouts), and
  Reversal API (refunds).
- **Selcom Aggregator** for card + Tigo Pesa + Airtel Money, plus refunds.
- **Meta WhatsApp Cloud API** for vendor order notifications.
- **Gemini** (server-side only) for plant disease scans, weather, AI search.
- **Laravel Reverb** for websockets (order status, KYC status, low stock).
- **Laravel Horizon** for queue workers.

---

## 2. Quick start

Prerequisites: PHP 8.3, Composer, PostgreSQL 15+, Redis.

```bash
cd api
composer install
cp .env.example .env
php artisan key:generate
# Edit .env: DB_*, REDIS_HOST, MPESA_*, SELCOM_*, AFRICAS_TALKING_*, AWS_*, GEMINI_API_KEY
createdb mkulima                    # or your psql equivalent
php artisan migrate --seed          # seeds 2 staff + 7 vendors + 20 farmers + products + orders
php artisan serve                   # http://127.0.0.1:8000

# In separate terminals:
php artisan queue:work              # or `php artisan horizon`
php artisan reverb:start            # websockets on :8080
```

Tests:

```bash
./vendor/bin/pest                   # Pest 3, in-memory SQLite, ~all green
./vendor/bin/pest --filter=Payouts  # one suite
```

Dev fallbacks (no third-party creds required for end-to-end exercise):

- SMS without `AFRICAS_TALKING_API_KEY` → `LogSmsDriver` writes the OTP to
  `storage/logs/laravel.log` (`grep '\[OTP/SMS\]' storage/logs/laravel.log`).
- Push without VAPID keys → logs the would-be payload instead of sending.
- WhatsApp without `WHATSAPP_ACCESS_TOKEN` → logs instead of sending.

This is intentional — copy the pattern when adding new third-party services.

---

## 3. Repository map

```
api/
├── app/
│   ├── Events/                 # OrderStatusUpdated, KycStatusUpdated, LowStockAlert (all ShouldBroadcast)
│   ├── Http/Controllers/Api/
│   │   ├── AI/                 # PlantScanController, SearchController, WeatherController (Gemini proxy)
│   │   ├── Admin/              # KycReviewController, AdminDisputeController (role-gated)
│   │   ├── Auth/               # OtpController, AdminLoginController, SessionController
│   │   ├── DisputeController, KycController, LogisticsController,
│   │   ├── OrderController, PaymentController, PayoutController,
│   │   ├── ProductController, PushTokenController, RefundController,
│   │   └── ToolBookingController
│   ├── Jobs/                   # ProcessPayoutJob, ProcessRefundJob (queued, 3 retries, 60s backoff)
│   ├── Listeners/              # PushOnOrderStatus, PushOnKycStatus (ShouldQueue)
│   ├── Models/                 # Eloquent — see §4 for the schema overview
│   ├── Notifications/
│   │   ├── VendorOrderNotification.php
│   │   └── Channels/WhatsappChannel.php
│   ├── Providers/              # App, Auth, Broadcast, Horizon, Telescope
│   └── Services/
│       ├── Fares/              # FareCalculator (pure)
│       ├── Gemini/             # GeminiClient (REST wrapper)
│       ├── Otp/                # OtpService + SmsDriver interface + AT/Log drivers
│       ├── Payments/           # PaymentDriver interface + Mpesa/Selcom drivers
│       ├── Payouts/            # PayoutDriver + MpesaB2c + PayoutService
│       ├── Push/               # PushService (web push + Expo)
│       ├── Refunds/            # RefundDriver + Mpesa reversal + Selcom refund + RefundService
│       └── Whatsapp/           # WhatsappClient (Meta Graph API)
├── bootstrap/                  # app.php (middleware + apiPrefix), providers.php
├── config/                     # services.php, push.php, broadcasting.php, sanctum.php, ...
├── database/
│   ├── migrations/             # one per domain area, dated 2026_05_*
│   └── seeders/                # DatabaseSeeder + RolePermissionSeeder
├── routes/
│   ├── api.php                 # the entire API surface — start here
│   ├── channels.php            # Reverb private channel auth
│   ├── console.php, web.php    # mostly empty
└── tests/
    ├── Feature/                # Pest, one file per domain (PayoutsTest, DisputeAndRefundTest, ...)
    └── Unit/                   # FareCalculatorTest
```

The whole project code is ~7.3k LOC. `vendor/` is ignored.

---

## 4. Data model

The schema is captured exactly by the migrations in `database/migrations/`. The
table summary:

| Table | Purpose | Key columns |
|---|---|---|
| `users` | Every role (farmer, agrodealer, ..., staff). `role` is a string column AND mirrored via Spatie permissions. | `phone` unique, `email` unique, `role`, `kyc_status`, `region` (TZ/KE), `whatsapp_config` encrypted JSON |
| `otp_codes` | One-time codes, hashed. 5-minute TTL, 5 max attempts. | `phone`, `code_hash`, `channel` (sms/voice), `attempts`, `expires_at`, `consumed_at` |
| `products` | Marketplace catalogue. | `vendor_id`, `category` enum, `stock`, `search_vector` tsvector (Postgres) |
| `orders` | Guest + authenticated. `user_id` is nullable for guest checkout. | `total`, `currency`, `status` enum, `channel` (online/pos), `payment_method_id`, `disputable_until`, `dispute_status` |
| `order_items` | Snapshots `product_name` at order time so historic receipts survive renames. | `vendor_id`, `quantity`, `unit_price`, `line_total` |
| `reviews` | Vendor reviews, 1-5 rating. | `vendor_id`, `user_name` (snapshot) |
| `kyc_submissions` | NIN + ID photos + selfie paths on R2 private bucket. | `id_front_path`, `id_back_path`, `selfie_path`, `status`, `checks` (json — future automated checks) |
| `farms` | Per-farmer farm metadata. | `lat`, `lon`, `size_acres`, `main_crops` json |
| `tools` | Tool rental catalogue. | `owner_id`, `daily_rate`, `availability`, `unavailable_ranges` json |
| `tool_bookings` | Tool rental bookings. | `tool_id`, `farmer_id`, date range, `total_cost`, `platform_fee`, `owner_payout` |
| `logistics_bookings` | Trucking bookings. | `farmer_id`, `provider_id`, `fare`, `platform_fee`, `provider_payout`, `distance_km` |
| `push_tokens` | Web Push + Expo, unified contract. | `token`, `platform` (web/expo), `keys` json |
| `payouts` | Money OUT to vendors / providers / tool owners. Polymorphic `payable`. | `recipient_id`, `amount`, `payable_type`, `payable_id`, `status`, `provider`, `attempts` |
| `disputes` | Customer-raised complaints on delivered orders. | `order_id`, `opened_by_user_id`, `reason`, `status`, `decided_by_user_id`, `decided_at` |
| `refunds` | Money BACK to customers. Mirrors payouts. | `dispute_id` (nullable — standalone refunds allowed), `order_id`, `amount`, `status`, `provider` |
| `payment_gateway_configs` | Per-vendor encrypted gateway credentials (legacy from per-vendor M-Pesa wiring). | `api_key`, `api_secret` (encrypted casts in model) |
| `activity_log` | Spatie audit trail. Every Order/Refund/Payout/Dispute/KYC state change is logged. | — |
| Sanctum / Spatie / jobs / cache tables | Framework. | — |

The dispute window is **7 days after `Delivered`**
(`Order::DISPUTE_WINDOW_DAYS`). The `disputable_until` column on `orders` is
cached so the queue can filter without a join.

---

## 5. Request lifecycle

Every `/api/v1/*` request goes through this chain (configured in
`bootstrap/app.php`):

1. **CORS** (`config/cors.php`) — allows `FRONTEND_URL` with credentials.
2. **`EnsureFrontendRequestsAreStateful`** — Sanctum prepended via
   `$middleware->statefulApi()`. Matches the request host against
   `SANCTUM_STATEFUL_DOMAINS` and, if it matches, runs the web session
   middleware (cookie, CSRF, session store).
3. **Throttle** (`throttle:60,1` default; `30,1` for AI; `20,1` for auth). The
   webhook routes are explicitly `withoutMiddleware(['throttle:api'])` because
   providers retry aggressively.
4. **`auth:sanctum`** on protected routes — reads the session cookie set by
   `Auth::guard('web')->login(...)` in the OTP / admin login flows.
5. **`role:Admin|SuperAdmin|...`** (Spatie middleware, aliased in
   `bootstrap/app.php`) on admin routes.
6. **Controller** → **Service** → **Driver** (for payments/payouts/refunds) or
   **Eloquent** (everything else).
7. **JSON response.** `$exceptions->shouldRenderJsonWhen(...)` forces JSON for
   any `api/*` path — no HTML error pages bleed through.

Two callouts:

- `GET /me` returns **204 No Content** when there's no session, so the React
  app can treat that as "guest" without surfacing a 401 in the console.
- Webhook routes sit **outside** the Sanctum group on purpose. Providers can't
  carry the SPA session cookie, so CSRF must not apply. They verify the
  payload inline via HMAC instead — see §8.

---

## 6. Auth model

**Phone-OTP is the primary identity** for every end-user role (Farmer,
Agrodealer, Agrovet, Agronomist, LogisticsProvider). Email + password is **the
secondary path for staff only**: Admin, SuperAdmin, KYCOfficer, CatalogManager,
SupportAgent, FinancialAuditor, Agronomist (urban professionals who may have
laptops). This is locked in `DESIGN_SPEC.md` §9.2 and enforced server-side in
`AdminLoginController::STAFF_ROLES`.

### 6.1 Phone-OTP flow

```
POST /api/v1/auth/otp/request   { phone: "+255712345678", region: "TZ", channel?: "sms"|"voice" }
  → OtpService::requestCode()
    → rate-limit (1/phone/60s, 30/IP/hr)
    → generate 6-digit code, Hash::make, persist with 5-min TTL
    → SmsDriver::sendSms() — Africa's Talking, or LogSmsDriver in dev
    → returns { ok: true, expires_in_sec: 300 }

POST /api/v1/auth/otp/verify    { phone, code, region, role?, name? }
  → OtpService::verifyCode()
    → load latest unconsumed code for phone
    → increment attempts; lock after 5
    → Hash::check; on success mark consumed + burn older codes
  → firstOrNew user by phone; set region + phone_verified_at; syncRoles
  → Auth::guard('web')->login($user, remember: true) — session cookie issued
  → session()->regenerate()
  → returns { ok: true, is_new, user }
```

Edge cases handled:

- **Web OTP API auto-fill**: the SMS body ends with `@{domain} #{code}` so
  Android Chrome can auto-fill same-origin OTP forms.
- **Voice fallback**: pass `channel: "voice"` and the same code is read aloud
  via Africa's Talking voice. Use after one failed SMS delivery (UI logic).
- **Lockout**: after 5 wrong attempts the code is consumed; the user has to
  request a new one.

### 6.2 Admin email/password

`POST /api/v1/auth/admin/login` — same session cookie, but only `STAFF_ROLES`
can use it. Failed attempts hit a per-(email, IP) rate limiter (5/min via
`RateLimiter::tooManyAttempts`). Non-staff get a generic "Invalid credentials"
to avoid leaking which accounts are staff.

### 6.3 Role storage and sync

Role is stored in **two places**:

- `users.role` (string column) — the React app reads this directly from `/me`,
  so the frontend doesn't have to query Spatie tables.
- Spatie `model_has_roles` — what `role:Admin|...` middleware checks.

**Always update both.** The pattern is `$user->role = 'X'; $user->save();
$user->syncRoles([$user->role]);`.

`SuperAdmin` implicitly passes every `Gate` check via the
`Gate::before` in `AuthServiceProvider::boot`.

---

## 7. The driver pattern (Payments / Payouts / Refunds / SMS)

The biggest reused pattern in the codebase. Each money or notification rail
has the same shape:

1. An **interface** in `app/Services/<Group>/<Group>Driver.php` defining
   `id()` and the action method.
2. One or more **concrete drivers** implementing it.
3. A **service** (where it makes sense) that picks the driver by a string
   `provider` column on the row and wraps the call.

| Group | Interface | Concrete | Service | Provider column |
|---|---|---|---|---|
| Payments | `PaymentDriver` | `MpesaDarajaDriver`, `SelcomDriver` | — (resolved inline in `PaymentController`) | request `method` (`mpesa` / `selcom`) |
| Payouts | `PayoutDriver` | `MpesaB2cDriver` | `PayoutService` | `payouts.provider` (`mpesa_b2c`) |
| Refunds | `RefundDriver` | `MpesaReversalDriver`, `SelcomRefundDriver` | `RefundService` (iterable drivers) | `refunds.provider` (`mpesa_reversal` / `selcom_refund` / `manual`) |
| SMS | `SmsDriver` | `AfricasTalkingDriver`, `LogSmsDriver` | `OtpService` | bound in `AppServiceProvider` from `config('services.sms.default')` |

### Why this shape

- Adding a new provider is one file plus a service `match` arm. The controller
  doesn't change, the table doesn't change, the tests for the existing
  provider don't change.
- The `manual` refund provider is a no-op short-circuit inside
  `RefundService::refund()` — the operator marks it refunded by hand after the
  cash is returned off-platform. Don't try to wire it to a driver.
- The SMS service has a graceful fallback to `LogSmsDriver` when the
  Africa's Talking API key is empty. Same pattern in Push (logs without VAPID)
  and WhatsApp (logs without access token). New third-party services should
  copy this.

### Driver responsibilities

A driver MUST:

- Mark the row **`Processing`** synchronously when the provider accepts the
  request (saves the conversation/reference id, increments `attempts`).
- Mark the row **`Failed`** with a 200-char-truncated reason if the provider
  rejects synchronously.
- Trust the **webhook handler** to flip `Processing → Paid`/`Refunded`/`Failed`
  asynchronously.

A driver MUST NOT mutate any row it doesn't own. Never poke at the underlying
Order from a Payout driver — go through events or the controller.

---

## 8. Webhooks — the HMAC-signed URL pattern

Every Daraja callback (STK push C2B, B2C result/timeout, Reversal
result/timeout) uses the same signing scheme:

```php
// In the driver, when constructing the callback URL:
$resultUrl = url('/api/v1/payments/mpesa/b2c/result'
    . '?sig=' . $this->sign($payout->id)
    . '&payout=' . $payout->id);

public function sign(int $payoutId): string {
    return hash_hmac('sha256', (string) $payoutId, config('app.key'));
}
```

The controller verifies the signature **before** doing anything with the body:

```php
if (!$payoutId || !$driver->verifySig($payoutId, $sig)) {
    return response()->json(['ResultCode' => 1, 'ResultDesc' => 'Bad signature']);
}
```

The row id is part of the signed input — a forged callback can't be replayed
against a different row. The shared secret is `APP_KEY`, which is already
rotated on `php artisan key:rotate-encryption-keys`. Don't replace this with a
fixed shared secret.

**Selcom is different.** Selcom signs the **request body** with HMAC-SHA256
using the API secret, in a `Digest` header (see
`SelcomDriver::signedHeaders` and `verifyIpnSignature`). The IPN webhook
verifies the body signature, not the URL. Don't conflate the two schemes when
adding a new provider — pick one based on what the provider supports.

Webhook routes are explicitly **outside** the stateful Sanctum group and use
`->withoutMiddleware(['throttle:api'])`. Don't add session/CSRF middleware to
them.

---

## 9. Money flow

### 9.1 Customer pays → order

```
POST /orders                       → OrderController::store
  (DB transaction, lockForUpdate on each Product, decrement stock,
   create Order + OrderItems, fire LowStockAlert if stock < 10,
   queue VendorOrderNotification (WhatsApp), broadcast OrderStatusUpdated)

POST /orders/{order}/charge        → PaymentController::charge
  → driver = MpesaDarajaDriver | SelcomDriver
  → driver->charge($order, ['phone' => ...])
    M-Pesa: STK push (CustomerPayBillOnline). Returns merchant_request_id +
            checkout_request_id. Callback URL signed with HMAC of order id.
    Selcom: hosted checkout. Returns checkout_url for the SPA to open.

POST /payments/mpesa/callback      → PaymentController::mpesaCallback
  → verify HMAC sig in query string
  → driver->handleWebhook → mark order paid_at + status=Processing
  → returns { ResultCode: 0 } to Daraja

POST /payments/selcom/ipn          → PaymentController::selcomIpn
  → SelcomDriver->handleWebhook verifies Digest header against body
  → mark order paid_at + payment_reference
```

Stock is decremented **inside the order transaction** with
`Product::lockForUpdate()` to prevent oversell (covered by
`OrdersTest::refuses to oversell`).

### 9.2 Vendor / provider payouts

Triggered on `Delivered` / `Completed` booking transitions in
`LogisticsController::transition` and `ToolBookingController::transition`:

```
booking transitions to Delivered/Completed
  → PayoutService::enqueueForLogisticsBooking() | enqueueForToolBooking()
    → upsertPayout — firstOrCreate keyed on (payable_type, payable_id)
      (DB unique index also enforces this — see §10)
  → ProcessPayoutJob::dispatch($payout->id)
    → PayoutService::disburse — match by provider, call MpesaB2cDriver
      → POST to /mpesa/b2c/v3/paymentrequest
      → on accept: payout->markProcessing(ConversationID)
      → on reject: payout->markFailed(reason)

POST /payments/mpesa/b2c/result    → PayoutController::mpesaResult
  → verify HMAC sig
  → ResultCode=0  → payout->markPaid(ConversationID)
  → ResultCode!=0 → payout->markFailed(ResultDesc)
```

### 9.3 Refunds (dispute-driven or standalone)

```
POST /orders/{order}/disputes      → DisputeController::store
  → guards: caller owns order, order Delivered/Completed,
            within disputable_until window, no existing active dispute
  → create Dispute(status=Open), mirror dispute_status onto orders

POST /admin/disputes/{d}/approve   → AdminDisputeController::approve
  → validate amount within order total
  → infer provider from order.payment_method_id:
      mpesa → mpesa_reversal
      card|selcom → selcom_refund
      else → manual
  → DB transaction: dispute→Approved, create Refund(Pending, provider)
  → if provider != manual: ProcessRefundJob::dispatch

ProcessRefundJob → RefundService::refund
  manual           → no-op (returns true, operator settles off-platform)
  mpesa_reversal   → MpesaReversalDriver, POST /mpesa/reversal/v1/request
  selcom_refund    → SelcomRefundDriver, POST /v1/refund (synchronous result)

POST /payments/mpesa/reversal/result → RefundController::mpesaResult
  → verify HMAC sig
  → ResultCode=0 → refund->markRefunded()
                    AND if dispute attached → dispute->status = 'Resolved'
  → ResultCode!=0 → refund->markFailed()
```

The **only** path that flips a dispute `Approved → Resolved` is
`Refund::markRefunded()` (and the admin `mark-refunded` action which mirrors
it). Don't add another transition — the symmetry is what makes the queue
predictable.

---

## 10. Idempotency

Three layers, all required.

**Database-level uniqueness:**

- `payouts (payable_type, payable_id)` unique — one payout per booking, ever.
  Calling `enqueueForLogisticsBooking` twice returns the same row.
- `disputes` partial unique index `WHERE status IN ('Open', 'UnderReview')` —
  **Postgres-only**. On SQLite it's a regular index, so
  `DisputeController::store` guards in code too.

**Service-level upsert:** `PayoutService::upsertPayout()` uses `firstOrCreate`
so concurrent inserts can't bypass the unique index.

**Job-level guard:** `ProcessPayoutJob` / `ProcessRefundJob` early-return if
the row is not in `Pending` or `Failed`. The retry path explicitly resets
to `Pending` so the guard fires; without that reset, the job would no-op.

**Stock decrement:** `Product::lockForUpdate()` per item inside the order
transaction. Postgres takes row-level locks, so concurrent orders for the same
product serialize on this row.

When adding a new external rail, ask three questions in this order:

1. Can the table express "one row per business event" via a unique index?
2. Can the service `firstOrCreate` keyed on that uniqueness tuple?
3. Does the job have a guard that protects against re-dispatch?

If you answer no to any of them, you've left a duplicate-payment foot-gun.

---

## 11. Status machines

All status columns are declared as `enum` at the DB level (Postgres), so the
DB rejects invalid writes. The controller guards on top of that.

```
Order        Pending → Processing → Shipped → Delivered → Completed
                         ↓
                     Cancelled
                   (channel: online | pos)

Dispute      Open → UnderReview → Approved → Resolved
                                ↘ Rejected
             (Resolved is set ONLY by Refund::markRefunded or markRefunded admin)

Refund       Pending → Processing → Refunded
                          ↓        ↑
                       Failed → Pending (via retry)
                          ↓
                       Cancelled (terminal, admin-only)

Payout       Pending → Processing → Paid
                          ↓        ↑
                       Failed → Pending (via retry)
                          ↓
                       Cancelled (terminal, admin-only)

KYC          Pending → Verified
                     ↘ Rejected
             (mirrored to users.kyc_status for fast read)
```

Terminal states (`Paid`, `Refunded`, `Cancelled`) refuse further actions. The
`retry` endpoints check this explicitly.

---

## 12. Role gates and the financial split

Admin endpoints in `routes/api.php` are split into **two** middleware groups
on purpose:

```php
// Financial roles — view + retry only.
Route::middleware(['auth:sanctum', 'role:Admin|SuperAdmin|FinancialAuditor'])
    ->prefix('admin')->group(function () {
        Route::get('/payouts', ...);
        Route::post('/payouts/{payout}/retry', ...);
        Route::get('/refunds', ...);
        Route::post('/refunds/{refund}/retry', ...);
    });

// Admin-only — mark-paid, mark-refunded, cancel, approve, reject.
Route::middleware(['auth:sanctum', 'role:Admin|SuperAdmin'])
    ->prefix('admin')->group(function () {
        Route::post('/payouts/{payout}/mark-paid', ...);
        Route::post('/payouts/{payout}/cancel', ...);
        Route::post('/refunds/{refund}/mark-refunded', ...);
        Route::post('/refunds/{refund}/cancel', ...);
        Route::post('/disputes/{dispute}/approve', ...);
        Route::post('/disputes/{dispute}/reject', ...);
    });

// Disputes triage — SupportAgent can read the queue but not approve.
Route::middleware(['auth:sanctum', 'role:Admin|SuperAdmin|SupportAgent'])
    ->prefix('admin')->group(function () {
        Route::get('/disputes', ...);
        Route::get('/disputes/{dispute}', ...);
    });
```

**Why the split:** `retry` re-runs the rail — recoverable, audit-traced.
`mark-paid` / `mark-refunded` bypass the rail (settle off-platform). `cancel`
voids the row. `approve` / `reject` finalise customer-visible money decisions.
These need stronger accountability — note required (3–500 chars), stored
prefixed with `MANUAL:` or `CANCELLED:` in `failure_reason`, and Spatie
activitylog mirrors the change.

**Don't loosen these gates** without updating `AdminPayoutActionsTest` and
`DisputeAndRefundTest`. Tests assert auditor can retry but not mark-paid,
support can read disputes but not approve, farmer is 403 across the board.

---

## 13. KYC and R2 storage

KYC documents (NIN ID front, back, selfie) land on a **private** R2 bucket
via the `r2-private` filesystem disk. Never publicly readable.

```php
// config/filesystems.php
'r2-private' => [
    'driver' => 's3',
    'visibility' => 'private',
    'endpoint' => env('AWS_ENDPOINT'),     // R2 endpoint
    ...
]
```

```php
// KycController::submit stores under kyc/{userId}/Y/m/d/His/...
$prefix = "kyc/{$user->id}/" . now()->format('Y/m/d/His');
$idFrontPath = $request->file('id_front')->store($prefix, $disk);
```

The admin KYC queue renders thumbnails using **short-lived signed URLs**
(`KycSubmission::signedUrls(int $ttlMinutes = 10)`). Don't return the raw
paths to the React app — always generate fresh signed URLs at request time.

`users.kyc_status` is **denormalised** from the latest submission so the
React app doesn't have to join through `kyc_submissions` on every page. The
admin `decide` endpoint updates both.

---

## 14. AI proxy (Gemini)

**The Gemini API key never leaves the server.** Three endpoints proxy through:

| Route | Controller | Model | Notes |
|---|---|---|---|
| `POST /search` | `AI/SearchController` | `gemini-2.5-flash` | Sends top 500 products as catalog context. Returns ranked productIds. |
| `POST /ai/weather` | `AI/WeatherController` | `gemini-2.5-pro` | Uses `google_search` grounding tool. Cached 30 min per ~1.1 km grid cell. |
| `POST /ai/plant-scan` | `AI/PlantScanController` | `gemini-2.5-flash` | Multimodal (base64 image + prompt). Cached 24 h per (image-sha256, language). |

All three force `responseMimeType: application/json` and `json_decode` the
result with a fallback default if parsing fails. Throttle on the AI group is
`30,1`; plant-scan has its own `30,1` inside `auth:sanctum` because it costs
real money per call.

**`GeminiClient`** is a thin REST wrapper around
`{base}/models/{model}:generateContent?key={apiKey}`. The `default_model` and
`pro_model` are env-driven, default `gemini-2.5-flash` and `gemini-2.5-pro`.

---

## 15. Realtime and push

**Reverb** (Laravel's websocket server) broadcasts three events:

| Event | Channel(s) | Fired by |
|---|---|---|
| `OrderStatusUpdated` | `users.{user_id}` + `vendors.{vendor_id}` per item | `OrderController::store`; any future order status mutation |
| `KycStatusUpdated` | `users.{user_id}` | `KycReviewController::decide` |
| `LowStockAlert` | `vendors.{vendor_id}` | `OrderController::store` when stock crosses below 10 |

Channel auth is in `routes/channels.php`. `users.{userId}` only matches the
owner; `vendors.{vendorId}` requires `$user->isVendor()`; `admin.kyc`
requires `$user->isStaff()`.

**Push** is unified across Web Push (VAPID) and Expo via `PushService`. One
`PushToken` row per (user, token); `platform` enum splits the dispatch:

- Web Push: `minishlink/web-push` with VAPID keys. Stale subs (HTTP 410 Gone)
  auto-pruned.
- Expo: POST to `https://exp.host/--/api/v2/push/send`. `DeviceNotRegistered`
  responses auto-pruned.

Listeners (`PushOnOrderStatus`, `PushOnKycStatus`) implement `ShouldQueue`
so push delivery never blocks a request.

**WhatsApp** is a custom Laravel notification channel. Notifications return
`['whatsapp']` from `via()` and implement `toWhatsapp($notifiable)`. The
channel adapter (`Notifications/Channels/WhatsappChannel`) just forwards to
that method, which calls `WhatsappClient`. Registered via
`Notification::extend('whatsapp', fn() => new WhatsappChannel())` in
`AppServiceProvider::boot`.

---

## 16. Postgres-specific features

Three features assume Postgres; they're either skipped or relaxed on SQLite
(for tests):

### 16.1 Products full-text search

`2026_05_15_000001_add_fulltext_search_to_products.php` adds:

- `CREATE EXTENSION pg_trgm` for fuzzy matching.
- `search_vector tsvector` generated stored column (Postgres 12+):
  `name` weighted A, `description` B, `category` C.
- GIN index on `search_vector` (covers `@@ plainto_tsquery`).
- GIN trigram index on `name` (covers `similarity()` and ILIKE).

The migration **skips on non-pgsql** (`if (!$this->isPostgres()) return;`),
so SQLite-backed tests still pass.

`ProductController::index` tries FTS first, ranked by `ts_rank`. If FTS
returns zero rows, retries with trigram similarity (threshold 0.2, tune
toward 0.4 if precision drops in real traffic). It never calls Gemini — the
catalog endpoint is fast and predictable. AI search escalation lives in
`AI/SearchController`.

The `simple` dictionary is intentional (no stemming) because product names
are proper nouns + SKUs (`DK 8033`, `YaraMila`) where stemming hurts
precision.

### 16.2 Disputes partial unique index

```sql
CREATE UNIQUE INDEX disputes_order_open_unique
  ON disputes (order_id)
  WHERE status IN ('Open', 'UnderReview')
```

Enforces "at most one active dispute per order". Postgres-only; on
SQLite/MySQL it's a regular non-unique index, and the controller guards in
code (`Order::isDisputable()`).

### 16.3 Other Postgres assumptions

- `decimal(12,2)` money columns. We never store cents as integers.
- `json` columns for `specialties`, `whatsapp_config`, `unavailable_ranges`,
  `keys`, `main_crops`, `checks`. SQLite handles these as TEXT — fine for
  tests, but JSON operators (`->>`) only work on Postgres.
- `ilike` for case-insensitive search on the KYC review queue
  (`KycReviewController::queue`). On SQLite it falls back to `LIKE`, which is
  case-insensitive there anyway.

---

## 17. Queues

**Horizon** is the supervisor in production
(`HorizonServiceProvider` gates `/horizon` to Admin + SuperAdmin only).
Locally, `php artisan queue:work` is fine.

Two jobs:

- `ProcessPayoutJob(int $payoutId)` — `tries: 3`, `backoff: 60` (retries at
  1, 2, 3 minutes). Early-returns if the row is not `Pending` or `Failed`.
- `ProcessRefundJob(int $refundId)` — same retry profile, same guard.

Plus the queued notifications and listeners:

- `VendorOrderNotification` (queued — buyer's checkout response isn't
  blocked).
- `PushOnOrderStatus`, `PushOnKycStatus` (queued listeners).

**Don't block a request on a third-party.** If you're calling M-Pesa, Selcom,
Africa's Talking, or Meta, go through a job — see the existing jobs for the
contract.

---

## 18. Testing

Pest 3 + `pestphp/pest-plugin-laravel`. `phpunit.xml` overrides for the test
environment:

```
DB_CONNECTION=sqlite, DB_DATABASE=:memory:
BCRYPT_ROUNDS=4
CACHE_STORE=array
QUEUE_CONNECTION=sync
SESSION_DRIVER=array
BROADCAST_CONNECTION=null
SANCTUM_STATEFUL_DOMAINS=localhost
```

Conventions to follow:

- Every Feature test seeds `RolePermissionSeeder` in `beforeEach` — Spatie
  roles must exist before `syncRoles()` works.
- Use `$this->actingAs($user)` to test authenticated endpoints. Sanctum's
  session middleware is wired through `RefreshDatabase`.
- Assert against `Bus::fake()` for payout/refund job dispatches. See
  `PayoutsTest` and `DisputeAndRefundTest` for the pattern.
- Use `Http::fake()` if you need to assert outbound HTTP from a driver — but
  prefer testing the controller behaviour through the service interface
  rather than mocking the driver itself.
- Money assertions use `(float)` cast: `(float) $payout->amount` rather than
  comparing strings — Laravel returns `decimal:2` casts as strings.

The current test inventory:

| Test | What it covers |
|---|---|
| `Auth/OtpTest` | OTP request/verify flow, session opens |
| `ProductsTest` | Public catalogue + category filter |
| `OrdersTest` | Order place + stock decrement + oversell refusal |
| `PayoutsTest` | Idempotent payout creation on Delivered transition |
| `AdminPayoutActionsTest` | Retry / mark-paid / cancel + role gating |
| `DisputeAndRefundTest` | Dispute lifecycle, refund creation, role gating |
| `Unit/FareCalculatorTest` | Haversine + fare splits |

What's not yet covered (worth adding when touching):

- M-Pesa STK push happy path (mock Daraja with `Http::fake`).
- Selcom IPN signature verification end-to-end.
- Webhook HMAC verification negative path (forged sig should 422).
- KYC submit + R2 store (`Storage::fake('r2-private')`).
- AI proxy with `Http::fake` for Gemini responses.

---

## 19. Conventions

Read these once; the rest of the codebase assumes you've internalised them.

**Controllers stay thin.** Business logic lives in `app/Services/*`. A
controller does: validate → resolve a service / driver → return JSON.
Anything more substantive belongs in a service.

**Money goes through drivers.** Never call M-Pesa or Selcom via Guzzle from
a controller. Add a driver, register it, pick it via the `provider` column.

**Every state change goes to Spatie activitylog.** Order, Refund, Payout,
Dispute, KYC, Product, User all use the `LogsActivity` trait with
`logOnly([...])` + `logOnlyDirty()`. When adding a new tracked column, update
the `getActivitylogOptions()` allowlist.

**Webhooks verify signatures inline.** Before reading any field from the
payload, run the HMAC check. Forged callbacks must 422 / `ResultCode: 1`
without touching the row.

**Anything that talks to a third-party goes through Horizon.** Never block a
request on M-Pesa, Selcom, Africa's Talking, Meta, or Gemini. The buyer's
checkout response must not depend on Daraja being up.

**Use `Intl`-friendly types.** Money is `decimal:2`. Phones are `string`
with `+` prefix and `regex:/^\+\d{10,15}$/` validation. Lat/lon are
`decimal:10,7`. Dates that matter (paid_at, refunded_at, decided_at, etc.)
are `timestamp` not `datetime`.

**Naming.** "Agrodealer" is the canonical term — UI sometimes still says
"vendor" (legacy) but new code should say agrodealer. Currency code is
`TZS`, never `Tsh`. Roles are PascalCase strings: `Farmer`, `Agrodealer`,
`Agrovet`, `Agronomist`, `LogisticsProvider`, `Admin`, `SuperAdmin`,
`KYCOfficer`, `CatalogManager`, `SupportAgent`, `FinancialAuditor`.

**Don't introduce a "registry table" for providers.** The `provider` string
column + service `match` arm is intentional — it's the simplest thing that
works and survives schema migrations cleanly.

---

## 20. Cookbook — common changes

### Add a new payment provider

1. Create `app/Services/Payments/MyProviderDriver.php` implementing
   `PaymentDriver`.
2. Add it to the `match` in `PaymentController::charge`.
3. Add an IPN/webhook route in `routes/api.php` (outside the Sanctum group,
   `withoutMiddleware(['throttle:api'])`).
4. Add a controller method that verifies the signature (URL-HMAC like Daraja,
   or body-HMAC like Selcom) before mutating.
5. Add `MyProviderTest` covering the happy path + a forged-signature case.
6. Update `config/services.php` with the env keys.

### Add a new payout / refund provider

Same as above but in `Services/Payouts` or `Services/Refunds`. Plus:

- Register in `AppServiceProvider::register` (refunds need to be in the
  iterable passed to `RefundService`).
- Add the provider id to the `provider` string column's allowed values (we
  don't constrain at the DB level — pick a unique short identifier like
  `tigopesa_disbursement`).
- Update `enqueueFor...` in `PayoutService` if a new payable type needs payout.

### Add a new role

1. Append it to `RolePermissionSeeder::$roles`.
2. Add it to `User::isStaff()` or wherever the gate matters
   (`AdminLoginController::STAFF_ROLES`, `routes/api.php` `role:...`
   middleware groups).
3. If the role can sign in via phone-OTP, add it to the `Rule::in([...])` in
   `OtpController::verify` and `SessionController::updateRole`.
4. If it gets its own bottom nav / dashboard, that's a frontend change — but
   coordinate with the React app's `role-picker` so the new role surfaces.

### Add a new admin queue (like disputes or payouts)

The pattern (copy from disputes):

1. Migration with status enum, denormalise summary column on the parent
   table for queue filtering.
2. Model with `LogsActivity` + a `scopeOpen` for the active queue.
3. Customer controller (`<Thing>Controller`) — open/list-mine.
4. Admin controller (`Admin\Admin<Thing>Controller`) — index/show/approve/reject.
5. Route group: view + triage gated by `Admin|SuperAdmin|SupportAgent`,
   approve/reject gated by `Admin|SuperAdmin` only.
6. Feature test asserting the role split and the state machine.

### Add a webhook endpoint

1. Add the route in `routes/api.php` after the `auth:sanctum` group, with
   `->withoutMiddleware(['throttle:api'])`.
2. Pick a signing scheme:
   - URL-HMAC (Daraja): `sign($id) = hash_hmac('sha256', $id, config('app.key'))`,
     include `?sig=...&id=...` in the URL you give the provider.
   - Body-HMAC (Selcom): provider signs the body with a shared secret; include
     the digest in a header.
3. Verify before reading any payload field. On failure, return a non-success
   provider response (`ResultCode: 1` for Daraja, `422` for everyone else).
4. Make the handler idempotent — providers retry. If the row is already in a
   terminal state, return success without mutating.

### Add a new Reverb channel

1. Add the auth callback in `routes/channels.php` — return truthy for
   authorised users.
2. Make the event `ShouldBroadcast` and return the channel(s) from
   `broadcastOn()`.
3. The React app uses `laravel-echo`/`pusher-js` to subscribe. Channel names
   are the contract; keep them stable.

### Add a new push event

1. Fire an `Event` from wherever the state changes.
2. Register a `ShouldQueue` listener in `AppServiceProvider::boot` (see
   `PushOnOrderStatus` for the pattern).
3. The listener calls `PushService::notify($user, [title, body, data])` —
   both Web Push and Expo are handled.

---

## 21. Gotchas (weakest assumptions)

These are the failure points worth knowing about before they bite you.

- **Telescope migrations are not inlined.** `bootstrap/providers.php`
  registers `TelescopeServiceProvider`, but the migration is missing on
  purpose. `TELESCOPE_ENABLED=false` by default. If you flip it on without
  running `php artisan telescope:install` first, `migrate:fresh` will fail.
  The `.env.example` comment calls this out.
- **FTS only works on Postgres.** Tests pass on SQLite because the migration
  is a no-op there, but `ProductController::index` falls through to the
  trigram branch silently. If you write a test that depends on FTS ranking,
  run it against Postgres explicitly.
- **`users.role` and Spatie roles can drift.** Always update both. There's no
  observer enforcing it — if you forget `syncRoles()`, the `role:Admin|...`
  middleware will 403 a user who *looks* like an Admin in `/me`.
- **The `manual` refund provider doesn't dispatch a job.** It's a no-op
  inside `RefundService`. If you call `ProcessRefundJob::dispatch` on a
  manual refund, it does nothing — the operator settles by clicking
  `mark-refunded`. The dispute approval handler already skips dispatch for
  `manual` (`if ($refund->provider !== 'manual')`).
- **Daraja's STK push callback doesn't echo `AccountReference`.** That's why
  `PaymentController::mpesaCallback` falls back to looking up the order by
  `CheckoutRequestID` stashed in `payment_reference`. Don't trust
  `AccountReference` to round-trip.
- **Webhook routes are public.** They have to be — providers can't carry
  cookies. Always verify the signature inline; never assume a webhook
  arrived from a trusted caller.
- **Disputes partial unique index only exists on Postgres.** If you write a
  test that creates two `Open` disputes on the same order, it'll pass on
  SQLite but fail in production. The controller guard catches it, but the
  test won't reflect production behaviour.
- **R2 endpoint format matters.** `AWS_ENDPOINT` must include the account
  ID: `https://<account-id>.r2.cloudflarestorage.com`. Get this from the
  Cloudflare dashboard. Without it, the SDK won't sign URLs correctly.
- **Sanctum `SANCTUM_STATEFUL_DOMAINS` must match the SPA host exactly.**
  Including port. `localhost:3000` and `127.0.0.1:3000` are different
  entries. Mismatches present as silent 401s — the request goes through, but
  the session cookie isn't read.
- **Notification `via` must return registered channels.** `whatsapp` is
  registered in `AppServiceProvider::boot` via `Notification::extend`. If you
  add a new channel (`telegram`, `sms`, etc.), register it the same way or
  Laravel will throw an "InvalidArgumentException: Driver [x] not supported".

---

## 22. Environment variables — summary

The full list with comments is in `.env.example`. The ones you must set for
each environment:

**Always required:** `APP_KEY`, `APP_URL`, `DB_*`, `REDIS_*`,
`SANCTUM_STATEFUL_DOMAINS`, `FRONTEND_URL`.

**For OTP:** `AFRICAS_TALKING_API_KEY` + `AFRICAS_TALKING_USERNAME`. Without
this, OTP codes go to the log file.

**For payments:** `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`,
`MPESA_SHORTCODE`, `MPESA_PASSKEY`, `MPESA_ENV` (sandbox|production).

**For payouts:** Plus `MPESA_INITIATOR_NAME` and
`MPESA_INITIATOR_SECURITY_CREDENTIAL` (initiator password encrypted with
Safaricom's public cert — use their portal tool to generate; the sandbox cert
is different from prod).

**For refunds:** Same M-Pesa creds as payouts. Plus `SELCOM_API_KEY`,
`SELCOM_API_SECRET`, `SELCOM_VENDOR_ID` for the Selcom path.

**For KYC + product images:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
`AWS_BUCKET=mkulima-private`, `AWS_ENDPOINT=https://<account>.r2.cloudflarestorage.com`,
`AWS_DEFAULT_REGION=auto`, `AWS_USE_PATH_STYLE_ENDPOINT=true`.

**For AI:** `GEMINI_API_KEY`. Optionally `GEMINI_DEFAULT_MODEL` and
`GEMINI_PRO_MODEL` to override (defaults are `gemini-2.5-flash` /
`gemini-2.5-pro`).

**For push:** `VAPID_SUBJECT`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`.
Generate the keypair with the helper command if you've added one, otherwise
use the `minishlink/web-push` CLI.

**For WhatsApp:** `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`.

**For Reverb:** `REVERB_APP_ID`, `REVERB_APP_KEY`, `REVERB_APP_SECRET`,
`REVERB_HOST`, `REVERB_PORT`, `REVERB_SCHEME`.

**For Sentry:** `SENTRY_LARAVEL_DSN` (and `SENTRY_RELEASE` set by CI to the
commit SHA).

---

## 23. Where to look first

| Question | File |
|---|---|
| What endpoints exist? | `routes/api.php` |
| What's the auth flow? | `app/Http/Controllers/Api/Auth/OtpController.php` + `OtpService.php` |
| What does the DB look like? | `database/migrations/` (read in date order) |
| Where does business logic live? | `app/Services/<group>/` |
| Where does state get logged? | Model `getActivitylogOptions()` methods + `activity_log` table |
| What's queued? | `app/Jobs/` + any `ShouldQueue` listener/notification |
| What's broadcast? | `app/Events/` + `routes/channels.php` |
| How do tests work? | `tests/Pest.php` + `phpunit.xml` + any `tests/Feature/*Test.php` |
| What's deployed where? | `../deploy/README.md` |
| What's the design spec? | `../DESIGN_SPEC.md` |

When something doesn't make sense, check `PROJECT_AUDIT.md` first — it
documents the original "why" for most architectural decisions
(written when the codebase was still a prototype; most "Critical Faults"
have since been addressed in this Laravel rewrite).
