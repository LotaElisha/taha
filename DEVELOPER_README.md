# Mkulima Super App (TAHA)

> A multivendor marketplace for agricultural inputs — connects Tanzanian farmers with agrodealers, agronomists, logistics providers and admins, with an AI crop advisor on top.

This document is for a developer joining the project. It explains what TAHA is, how the code is laid out, how to run it locally, and the conventions you should follow.

---

## 1. What you're building

TAHA is a Progressive Web App + REST API that brings together five user roles:

- **Farmer** — browses the marketplace, places orders, books logistics and tools, talks to agronomists, uses the AI plant scanner.
- **Agrodealer** — vendor surface. Lists products, fulfils orders, manages payouts.
- **Agronomist** — provides consultations and advice.
- **Logistics provider** — fulfils delivery bookings.
- **Admin / SuperAdmin / Support / Financial / KYC officer** — internal back-office for KYC, disputes, refunds, payouts.

Core capabilities the codebase already implements:

- Phone-OTP authentication (primary) + admin email/password login
- Multi-vendor marketplace with Postgres full-text search
- Cart, guest checkout, orders
- Payments via **M-Pesa** and **Selcom**, plus card and Cash on Delivery
- Refunds (M-Pesa Reversal + Selcom refund drivers) and disputes
- Vendor payouts (M-Pesa B2C) with retry, mark-paid, cancel
- KYC submission + admin review queue
- Logistics bookings with server-side fare calculation
- Tool / equipment bookings
- AI: plant disease scanning (Gemini), weather, search assist
- WhatsApp + SMS (Africastalking) + web-push notifications
- Real-time updates via Laravel Reverb (websockets)
- Offline-first PWA shell

---

## 2. Tech stack

### Frontend (`/`)
- **React 19** + **TypeScript** + **Vite 6**
- **React Router v7** (route-based code splitting via `React.lazy`)
- **TanStack Query** for server state
- **Tailwind CSS** + Radix UI primitives + shadcn-style components
- **framer-motion** for animation
- **laravel-echo** + **pusher-js** for real-time
- **Sentry** for error tracking
- **vite-plugin-pwa** + Workbox for the service worker
- **@google/genai** for client-aided AI flows (key never leaves the server — the Laravel API proxies it)

### Backend (`/api`)
- **PHP 8.3** + **Laravel 11**
- **Laravel Sanctum** for SPA session auth
- **Spatie laravel-permission** for roles (`Admin`, `SuperAdmin`, `SupportAgent`, `FinancialAuditor`, `KYCOfficer`, `Farmer`, `Agrodealer`, `Agronomist`, `LogisticsProvider`)
- **Laravel Horizon** for queues, **Laravel Reverb** for websockets
- **Spatie activitylog** for audit trail
- **Pest** for tests
- **Africastalking** SDK for SMS
- **AWS S3** (Flysystem) for KYC document storage
- **PostgreSQL** with full-text search + trigram for products
- **Redis** (Predis) for cache, queues, sessions

---

## 3. Repository layout

```
taha/
├── App.tsx                       # Root component — composes the router
├── package.json                  # name: "mkulima-super-app"
├── vite.config.ts
├── components/                   # Shared UI (header, footer, cart, modals)
│   ├── app-shell/                # AppShell, AppBar, nav
│   ├── marketplace/              # Product grid, drawers, category chips
│   ├── disputes/                 # Customer-side dispute UI
│   ├── feedback/                 # OfflineBanner, RouteFallback
│   └── ui/                       # Primitives (sonner, etc.)
├── pages/
│   ├── public/                   # HomeView, VendorPage
│   ├── auth/                     # AuthFlow (OTP), AdminLoginPage
│   ├── farmer/                   # FarmerSurface
│   ├── dealer/                   # DealerSurface
│   ├── admin/                    # AdminSurface, AdminPayouts, AdminDisputes, AdminRefunds
│   ├── agronomist/               # AgronomistSurface
│   └── logistics/                # LogisticsSurface
├── context/                      # AuthContext, UserContext, LanguageContext, ThemeContext
├── services/                     # api.ts, whatsappService.ts, geminiService.ts
├── data/                         # mockData.ts (fallback / dev seeding)
├── types.ts                      # Shared TS types
└── api/                          # Laravel backend (separate Composer project)
    ├── app/
    │   ├── Http/Controllers/Api/ # Versioned controllers grouped by domain
    │   ├── Services/
    │   │   └── Refunds/          # RefundService + Selcom/Mpesa drivers
    │   ├── Jobs/                 # ProcessRefundJob, etc.
    │   ├── Models/               # Order, Refund, Dispute, ...
    │   ├── Notifications/
    │   │   └── Channels/WhatsappChannel.php
    │   └── Providers/
    ├── database/migrations/
    ├── routes/api.php            # All routes mounted at /api/v1
    └── tests/                    # Pest tests (Feature + Unit)
```

---

## 4. Running it locally

### Prerequisites
- Node 20+ and npm
- PHP 8.3, Composer
- PostgreSQL 15+
- Redis
- (Optional) M-Pesa Daraja sandbox credentials, Selcom sandbox credentials, Africastalking sandbox, a Gemini API key

### Backend

```bash
cd api
composer install
cp .env.example .env
php artisan key:generate
# Edit .env — DB_CONNECTION=pgsql, REDIS_HOST, MPESA_*, SELCOM_*, AFRICASTALKING_*, AWS_*, GEMINI_API_KEY
php artisan migrate --seed
php artisan serve         # http://127.0.0.1:8000

# In separate terminals:
php artisan queue:work    # or `php artisan horizon` in dev
php artisan reverb:start  # websockets
```

### Frontend

```bash
# from repo root
npm install
# create .env.local with VITE_API_URL=http://127.0.0.1:8000/api/v1
npm run dev               # http://localhost:5173
```

### Tests

```bash
# Backend
cd api && ./vendor/bin/pest

# Frontend type-check
npm run lint              # currently `tsc --noEmit`
```

---

## 5. API surface (high level)

All routes are mounted under **`/api/v1`**. Auth uses Sanctum stateful sessions.

### Public
- `GET /products`, `GET /products/{id}` — marketplace catalogue (Postgres FTS + trigram fallback)
- `POST /search` — AI-assisted search (rate-limited)
- `POST /ai/weather` — weather summary
- `POST /auth/otp/request`, `POST /auth/otp/verify` — phone OTP
- `POST /auth/admin/login` — admin email/password
- `GET /me` — current session

### Authenticated (any role)
- `POST /auth/logout`, `PATCH /me/role`
- `GET /orders/mine`, `POST /orders`
- `POST /orders/{order}/charge` — initiate M-Pesa STK push or Selcom checkout
- `POST /orders/{order}/disputes`, `GET /disputes/mine`
- `POST /kyc/submit`
- `POST /push-tokens`, `DELETE /push-tokens/{token}`
- `POST /logistics/quote`, `POST /logistics/bookings`, `POST /logistics/bookings/{id}/transition`
- `POST /tool-bookings`, `POST /tool-bookings/{id}/transition`
- `POST /ai/plant-scan` — Gemini-backed, throttled (costs real money)

### Webhooks (public, signature-verified inline)
- `POST /payments/mpesa/callback`
- `POST /payments/selcom/ipn`
- `POST /payments/mpesa/b2c/result`, `/timeout` — payouts
- `POST /payments/mpesa/reversal/result`, `/timeout` — refunds

### Admin (`role:Admin|SuperAdmin|...`)
- `/admin/kyc/queue`, `/admin/kyc/{id}`, `POST /admin/kyc/{id}/decide`
- `/admin/payouts`, `POST /admin/payouts/{id}/retry|mark-paid|cancel`
- `/admin/disputes`, `POST /admin/disputes/{id}/approve|reject`
- `/admin/refunds`, `POST /admin/refunds/{id}/retry|mark-refunded|cancel`

The role split is intentional: financial roles can view + retry, but only Admin / SuperAdmin can manually settle (mark-paid, mark-refunded, approve/reject disputes) because those actions bypass the provider rails.

---

## 6. Conventions to follow

**Frontend**
- Every page is lazy-imported in `App.tsx` (`React.lazy`). Guests must not download admin/dealer bundles.
- Server state goes through TanStack Query. Do not put product/order data in `useState` at the app root.
- Currency: use `Intl.NumberFormat` with `TZS`. Don't hard-code `"Tsh "` prefixes.
- All user-facing strings go through `useLanguage()` (`t('key')`) — English + Swahili.
- Forms: react-hook-form + zod. No raw uncontrolled form state.
- Modals must be focus-trapped (Radix Dialog handles this).
- Always import the API client from `services/api.ts` — never call `fetch` directly.

**Backend**
- Controllers stay thin; business logic lives in `app/Services/*`.
- Money goes through the appropriate driver (`SelcomRefundDriver`, `MpesaReversalDriver`, etc.), never directly via Guzzle.
- Every state change on Orders / Refunds / Payouts / Disputes is written to the activity log (Spatie).
- Webhooks verify the provider signature **before** doing anything with the payload, and treat the body as untrusted.
- Use Laravel queues (Horizon) for anything that talks to a third-party — never block a request on M-Pesa, Selcom, or Africastalking.
- Tests: Pest, with Feature tests under `api/tests/Feature/` (one per domain area — see `PayoutsTest.php`, `DisputeAndRefundTest.php` as the model).

**Naming**
- "Agrodealer" = supplier/vendor account. UI sometimes still says "vendor" (legacy) — prefer "agrodealer" in new code.
- "Tsh" / "TZS" — use the ISO code `TZS` for currency.

---

## 7. Things still to be done

There is a project audit at `PROJECT_AUDIT.md` (dated 2026-05-14) listing critical fixes. The biggest open items at the time of writing:

- Replace remaining `alert()` / `window.confirm()` calls with sonner toasts and a confirm-dialog component.
- Tighten the service-worker caching policy — never cache HTML or `/api/*` at the SW layer.
- Add 192×192 and 512×512 PNGs to the PWA manifest (currently SVG only).
- Accessibility pass on modals (focus trap, ESC-to-close, `aria-modal`).
- Add Playwright e2e tests for guest checkout, OTP login, and the dispute flow.

Read the audit first — most "why is this like that?" questions are answered there.

---

## 8. Where to ask

- Code questions → check `PROJECT_AUDIT.md` first, then `api/routes/api.php` for the API contract.
- Domain questions (KYC, payouts, dispute rules) → ask the product owner.
- Provider questions (M-Pesa Daraja, Selcom, Africastalking) → each driver in `api/app/Services/` has the integration docs linked at the top.
