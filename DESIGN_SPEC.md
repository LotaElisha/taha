# Mkulima Super App — UX/UI Redesign Spec

**Version:** 1.0
**Date:** 2026-05-14
**Direction:** Mobile-first PWA polish
**Foundation:** Tailwind CSS + shadcn/ui (Radix primitives)
**Scope:** Full app — public marketplace, auth, farmer/agrodealer/agronomist/logistics/admin dashboards, all modals

This spec is the single source of truth for the redesign. Engineers should be able to build any screen from this doc alone. Designers can lift everything in here into Figma without rework.

---

## 1. Product Identity & Audience

**Mkulima** ("farmer" in Swahili) serves rural and peri-urban East African users — predominantly **smallholder farmers in Tanzania and Kenya**, using **entry-level Android phones** (4–6 inch displays, often on 3G/4G with patchy connectivity). Secondary audiences are **agrodealers, agrovets, agronomists, logistics providers, and administrators** who operate from the same device. The redesign therefore prioritizes:

- **Phone-as-primary.** Every screen is designed for a 360 dp viewport first; tablet and desktop are progressive enhancements.
- **Thumb-reach navigation.** Primary actions live in the bottom 40 % of the screen.
- **Low-bandwidth friendly.** Initial route under 150 KB gzipped; images lazy-loaded; offline-capable cart and saved listings.
- **Trust.** This is a financial product (commerce, KYC, credit). The UI must feel professional, not gimmicky.
- **Localized.** English + Swahili at parity; numbers, currency, and dates use `Intl`. Layout works in 32-character Swahili headings (≈20 % longer than English).

---

## 2. Design Principles

| Principle | What it means in practice |
|---|---|
| **One thumb, one task.** | Every screen has one obvious primary action reachable without re-gripping the phone. |
| **Latency is real.** | Skeleton loaders for every async block. No spinners over a full screen. Every button has an `isLoading` state. |
| **Show the seam.** | Offline / stale / pending states are surfaced honestly. A "Pending sync" chip is better than silent failure. |
| **Local first.** | The cart, draft KYC, saved farm details, and last marketplace fetch survive a refresh and a disconnection. |
| **Quiet by default.** | Pages start calm — one heading, one CTA, one image. Density is opt-in via filters and expanded views. |
| **Accessibility is a hard requirement.** | WCAG 2.1 AA contrast on every token; 44 dp tap targets; visible focus; respect `prefers-reduced-motion`. |

---

## 3. Brand & Visual Language

### 3.1 Color Tokens

We move from the current ad-hoc palette to a **semantic token system** with explicit light and dark values. All colors meet WCAG 2.1 AA against their paired surfaces.

```ts
// tailwind.config.ts (excerpt)
colors: {
  // Brand
  brand: {
    50:  '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#16a34a',  // Primary
    600: '#15803d',  // Hover
    700: '#166534',  // Pressed / Dark mode primary
    800: '#14532d',
    900: '#052e16',
  },
  harvest: {        // Accent — warm, used sparingly for promotion & alerts
    400: '#fbbf24',
    500: '#d97706',
    600: '#b45309',
  },
  // Semantic
  bg:        { DEFAULT: '#fafaf9', dark: '#0a0a0a' },
  surface:   { DEFAULT: '#ffffff', dark: '#171717' },
  surface2:  { DEFAULT: '#f5f5f4', dark: '#262626' },
  border:    { DEFAULT: '#e7e5e4', dark: '#404040' },
  fg:        { DEFAULT: '#1c1917', dark: '#fafaf9' },
  muted:     { DEFAULT: '#78716c', dark: '#a8a29e' },
  success:   '#16a34a',
  warning:   '#d97706',
  danger:    '#dc2626',
  info:      '#2563eb',
}
```

**Usage rules**
- Buttons, links, and selected states → `brand.500` (light) / `brand.400` (dark).
- KYC/payment success → `success`. Pending → `warning`. Failed → `danger`. Informational → `info`.
- `harvest` is the only warm accent. Use for promo banners and "best price" badges. Never as a default action color.
- Body text on white: `fg`. Body text on `surface2`: still `fg`. Muted captions: `muted`.

### 3.2 Typography

Stay on **Inter** for Latin, add **Noto Sans Swahili** for Swahili-specific glyphs. Both load self-hosted via `@fontsource` — drop the Google Fonts CDN.

```ts
// type scale (mobile-first; desktop bumps headings one step)
text-xs   12 / 16   captions, chips
text-sm   14 / 20   body sm, table cells, helper text
text-base 16 / 24   body, default form input
text-lg   18 / 28   subheads
text-xl   20 / 28   card titles
text-2xl  24 / 32   section titles (h2)
text-3xl  30 / 36   page titles (h1) — mobile
text-4xl  36 / 40   page titles (h1) — md and up
text-5xl  48 / 52   hero — md and up only
```

**Weights:** 400 body, 500 emphasis, 600 buttons & subheads, 700 page titles.
**Tracking:** `-0.01em` on `text-2xl` and up.
**Numerals:** `font-variant-numeric: tabular-nums` on prices, quantities, and table cells.

### 3.3 Spacing & Radius

| Token | Value | Use |
|---|---|---|
| `space-1` | 4 px | Icon-to-text gap |
| `space-2` | 8 px | Compact stack |
| `space-3` | 12 px | Default stack inside a card |
| `space-4` | 16 px | Default page padding (mobile) |
| `space-6` | 24 px | Section padding |
| `space-8` | 32 px | Hero padding |
| `space-12` | 48 px | Page top breathing room (desktop) |

Radii: `sm` 6 px (chips), `md` 10 px (inputs, buttons), `lg` 14 px (cards), `xl` 20 px (sheets), `full` 9999 px (avatars, FAB).

Elevation: keep it flat. Two shadow tokens — `shadow-sm` (cards) and `shadow-lg` (sheets, modals). No glow. No neumorphism.

### 3.4 Iconography

Adopt **lucide-react** uniformly (it's already in `package.json`). 24×24 default, 20×20 in dense tables, 16×16 inside chips. Stroke 1.75. Every icon either has an accessible label or `aria-hidden="true"` and adjacent text. Replace all inline SVG icon literals in `pages/*` and `components/*` with `<Icon name="..." />` from a single `components/ui/icon.tsx`.

### 3.5 Motion

- Durations: `120 ms` micro (hover), `200 ms` standard (sheet/dialog open), `320 ms` route transitions.
- Easing: `cubic-bezier(0.2, 0.8, 0.2, 1)` (Material standard).
- Respect `@media (prefers-reduced-motion: reduce)` — disable transforms, keep opacity.
- `framer-motion` for orchestrated transitions (cart sheet, plant-scan result). Delete the duplicate `motion` package.

---

## 4. Layout System

### 4.1 Breakpoints (mobile-first)

```
sm   640 px   small tablet portrait
md   768 px   tablet
lg   1024 px  small laptop
xl   1280 px  desktop
2xl  1536 px  large desktop
```

The default styles target ≤ 640 px. Anything wider gets enhancements behind `sm:` / `md:` prefixes.

### 4.2 App Shell

**Mobile (default)** — three zones:

```
┌──────────────────────────────┐
│ AppBar (sticky, 56 dp)        │   ← logo, search-icon, profile avatar
├──────────────────────────────┤
│                              │
│   Route content (scrolls)    │
│                              │
├──────────────────────────────┤
│ BottomNav (64 dp, safe-area)  │   ← 5 tabs max
└──────────────────────────────┘
```

- Top app bar collapses on scroll (translate-y, not unmount) to give 80–90 % of the viewport to content.
- Bottom nav uses `env(safe-area-inset-bottom)` so it clears iPhone home indicators.
- A floating action button (FAB, 56 dp, brand.500) appears on Marketplace and Farmer Dashboard for the primary action (Cart on Marketplace, Scan on Dashboard). Positioned 16 dp above bottom nav, right-aligned.

**Tablet & desktop (`md` and up)** — switch to a two-column shell with a persistent left sidebar (240 px) and no bottom nav. The same primary actions appear inside the sidebar.

### 4.3 Grid

- Mobile: single-column, full-width cards with 16 px gutters.
- `sm`: 2-column product grid.
- `md`: 3-column product grid, 12-column page grid for dashboards.
- `lg`: 4-column product grid.

---

## 5. Component Library Map (shadcn/ui → Mkulima)

Every custom component currently in `/components` maps to a shadcn primitive plus a thin Mkulima wrapper. We do **not** keep one-off styled buttons or inputs.

| Current file | shadcn primitive | Mkulima wrapper |
|---|---|---|
| Buttons across all forms | `button` | `<Button variant="primary|secondary|ghost|danger" size="sm|md|lg" />` |
| Inputs in `LoginPage`, `KYCModal`, etc. | `input`, `label`, `form` | `<Field label hint error>` |
| `CartSidebar.tsx` | `sheet` | `<CartSheet />` |
| `GuestCheckoutModal.tsx`, `KYCModal.tsx`, `ProductFormModal.tsx`, all `*Modal.tsx` | `dialog` (desktop) / `drawer` (mobile, vaul) | `<ResponsiveDialog />` |
| `BulkActionBar.tsx` | `toolbar` + `button` | `<BulkBar selectedCount actions />` |
| `LanguageSwitcher.tsx`, `ThemeToggle.tsx` | `dropdown-menu`, `switch` | `<LangMenu />`, `<ThemeSwitch />` |
| `StarRating.tsx` | custom (keep) | `<Rating value max readOnly />` |
| `ReviewSection.tsx` | `card` + `textarea` + `rating` | `<ReviewList />`, `<ReviewForm />` |
| `Header.tsx` | `navigation-menu`, `command` | `<AppBar />` |
| `FarmerSidebar.tsx` | `sidebar` (shadcn v2) | `<DashboardNav />` |
| `SimpleBarChart.tsx`, `SimpleLineChart.tsx` | `recharts` (replace) | `<MetricChart />` |
| `BarcodeScannerModal.tsx`, `PlantScannerModal.tsx` | `drawer` full-screen | `<ScannerSheet />` |
| `Toast / alert() usage` | `sonner` | `toast.success / error / promise` |
| `window.confirm()` calls | `alert-dialog` | `<ConfirmDialog />` |
| `PasswordStrengthIndicator.tsx` | `progress` + `text` | keep, restyled |
| `ProductCard.tsx`, `FeaturedProducts.tsx` | `card`, `aspect-ratio` | `<ProductCard variant="default|compact|featured" />` |

**New components to add:**

- `<EmptyState illustration title body action />` — used by every list (orders, products, tools, bookings).
- `<StatusChip status="pending|confirmed|in-transit|delivered|cancelled|verified|rejected" />` — single source of truth for badge colors.
- `<PriceTag value currency strikethrough />` — wraps `Intl.NumberFormat`, handles TZS/KES.
- `<OfflineBanner />` — appears at top when `navigator.onLine === false`.
- `<KycGate>{children}</KycGate>` — wraps screens that require verified KYC; replaces the current `alert()` flow.
- `<Skeleton />` — used everywhere a fetch is in flight.

---

## 6. Mobile-First Interaction Patterns

### 6.1 Navigation

**Bottom nav tabs by role:**

| Role | Tab 1 | Tab 2 | Tab 3 | Tab 4 | Tab 5 |
|---|---|---|---|---|---|
| Guest | Home | Shop | Scan | Services | Sign in |
| Farmer | Home | Shop | Scan (FAB) | Orders | Profile |
| Agrodealer | Today | Products | POS (FAB) | Orders | Profile |
| Agrovet | Today | Inventory | POS (FAB) | Bookings | Profile |
| Agronomist | Today | Requests | — | Schedule | Profile |
| Logistics | Today | Jobs | — | Earnings | Profile |
| Admin | Overview | Users | — | Catalog | More |

A "Scan" or "POS" mid-tab is a circular FAB that floats above the nav and triggers a full-screen drawer. The other four tabs are equal-width icons with labels.

### 6.2 Sheets vs. Dialogs

- On `< md`: every modal becomes a **bottom drawer** (vaul). Drag handle, swipe-to-dismiss, snap points where useful.
- On `≥ md`: the same component renders as a centered dialog.
- This is the single biggest UX win — current modals fight thumbs and tiny phone keyboards.

### 6.3 Forms

- One question per screen on multi-step flows (KYC, vendor onboarding, logistics booking, agronomist booking).
- Inline validation on blur; submit-time validation summarizes errors in a callout at the top of the form.
- All inputs: 48 dp height, 16 px font (prevents iOS zoom), labels above (not floating), helper text below in `muted`.
- Phone numbers use a country-code chooser defaulting to +255 (TZ) and +254 (KE). Auto-format as the user types.
- Currency inputs auto-prefix `TZS`/`KES`. Numeric inputs use `inputmode="decimal"`, never `type="number"` (kills the iOS keypad on integers).

### 6.4 Lists & cards

- Product card: square image (1:1) on top, title (1 line clamp), vendor (1 line, muted, small), price (semibold). On `sm:` two-up grid, on `md:` three-up. Tap the image → product detail drawer; tap the cart icon → add to cart with a `sonner` confirmation.
- Order card: status chip top-right, total bottom-right, items count + first item name top-left, date in `muted`.
- Booking card: vehicle/tool image left, date range + status right, "Call provider" + "Cancel" as outline buttons.

### 6.5 Empty states

Every list gets an illustrated empty state — single line title, one supporting sentence, one primary action. Use line illustrations in `brand.300` on `surface2`. No clip-art.

### 6.6 Onboarding

A short, skippable 3-screen carousel after first install:

1. **Scan a sick plant** — animated screenshot of the scanner.
2. **Buy inputs nearby** — map illustration with vendor pins.
3. **Get paid faster (vendors)** — POS preview.

Then a role picker → location permission → notifications permission.

---

## 7. PWA-Specific Patterns

- **Install prompt.** Listen for `beforeinstallprompt`. Surface a non-blocking "Install Mkulima" banner above the bottom nav after the user completes one successful purchase or one scan. Easy dismiss.
- **Offline.** Service worker uses Workbox: `network-first` for `/api/*`, `stale-while-revalidate` for product images, `cache-first` for static assets, never for HTML. Replace the current SW which caches everything indefinitely.
- **Offline cart.** Cart writes to IndexedDB (via `idb-keyval`). Checkout in offline mode queues an order and shows "Will sync when you're online."
- **Push notifications.** Order updates, vet/agronomist booking confirmations, low-stock alerts (for vendors), price-drop alerts (for farmers). Permission asked **after** the user has placed one order, not on first load.
- **App icons & manifest.** Replace SVG-only icon with 192/512 maskable PNGs. Align `theme_color` across `manifest.json` and `index.html` (use `brand.700` = `#166534`).
- **Splash screen.** Generate iOS-specific PNG splashes via `pwa-asset-generator`.

---

## 8. Accessibility (WCAG 2.1 AA, non-negotiable)

- Minimum tap target 44×44 dp. FAB and bottom nav icons are 56 dp.
- Color contrast: 4.5:1 for body, 3:1 for large text and UI components. Token pairs above are pre-checked.
- All interactive elements keyboard-reachable with a visible 2 px focus ring (`outline-offset-2 outline-2 outline-brand-500`).
- Every form input has a programmatic label. No placeholder-as-label.
- Modals/drawers trap focus, restore focus on close, accept ESC.
- Screen-reader-only text on icon-only buttons (`<span className="sr-only">Open cart</span>`).
- Live regions for order status changes, KYC status changes, and `sonner` toasts (`aria-live="polite"` for status, `assertive` for errors).
- Respect `prefers-reduced-motion` and `prefers-color-scheme`.

---

## 9. Screen-by-Screen Specs

Each section lists: **purpose**, **structure**, **states**, **components used**, **edge cases**. I'm covering the screens that exist today plus the new ones the redesign introduces.

### 9.1 Public Marketplace

#### 9.1.1 Home (`/`)

- **Purpose:** Convert guests; show product breadth; surface services.
- **Structure (mobile):**
  - AppBar with logo + search icon.
  - Hero: 280 dp tall, single product image, two-line headline, primary CTA "Shop now", secondary "Scan a plant". No carousel — carousels die on 3G.
  - Service tiles: 2-column grid of 6 cards (Scan, Soil Test, Agronomist, Vet, Warehouse, Logistics) with icon + 1-line description.
  - Marketplace teaser: horizontal scroll of 6 featured products.
  - Category chips row (sticky after scroll).
  - Product grid (paginated, 12 per page, infinite scroll).
  - Footer: language switch, theme switch, partners.
- **States:** loading (skeleton hero + skeleton grid), empty (no products → empty state with "Become a vendor" CTA), search-in-progress.
- **Components:** `<HeroBanner>`, `<ServiceTile>`, `<ProductCard variant="compact">` for the rail, `<ProductCard>` for the grid, `<CategoryChips>`, `<PartnersStrip>`.
- **Edge cases:** offline → show last cached grid + offline banner; AI search returns 0 → fall back to plain text search with a hint.

#### 9.1.2 Search overlay (`/`, search icon tapped)

- Full-screen sheet from the top, autofocus on input. Recent searches + suggested categories below. Debounced AI search at 350 ms. Clear "×" inside input.

#### 9.1.3 Product detail (`/p/:id` or drawer)

- Tappable image carousel (no auto-advance), title, price, vendor card (tap → vendor profile), stock chip, description (collapsible after 4 lines), reviews summary (avg rating + count + "See all reviews"), sticky bottom bar with quantity stepper and "Add to cart" primary button.
- Sticky bottom bar uses safe-area inset.

#### 9.1.4 Vendor profile (`/v/:id`)

- Cover image (160 dp), logo overlapping (-32 dp), name, verified badge, rating, operating hours, distance (if location granted), tabs: Products | Reviews | About. "Call on WhatsApp" CTA in the AppBar.

#### 9.1.5 Cart sheet

- Bottom drawer on mobile, right side-sheet on desktop. List rows with thumbnail, name, vendor, stepper, line total. Subtotal + delivery + tax breakdown. Delivery option as segmented control. Payment method as radio group with icons (M-Pesa, Tigo Pesa, Card, COD). "Checkout" 56 dp primary button at bottom (sticky, safe-area).

#### 9.1.6 Guest checkout (drawer)

- Three steps in a single drawer with progress bar at top: **Contact → Address → Confirm**. Back button on each step. Final step shows full summary, "Place order" primary, "Edit" links per step.

### 9.2 Auth — Phone + OTP primary

**Decision (locked):** the primary identity for every Mkulima user is their **phone number**. We send a one-time passcode by SMS and verify it. Password-based login is deprecated for end users. Email + password remains available only as a secondary path for admin / agronomist / KYC officer / catalog-manager / finance-auditor accounts (urban professionals who have laptops and care about password managers).

**Why:** East African farmers, agrodealers, and logistics providers already identify by phone — it's their M-Pesa account, their WhatsApp, their bank line. Many do not have an email address or check it weekly. Phone + OTP also collapses sign-up and sign-in into the same flow (no separate "register" screen for the common case), and it gives us a verified, deliverable contact channel from minute one for order updates and KYC notifications.

**SMS provider:** Africa's Talking primary (best TZ/KE coverage and pricing), Twilio fallback. Both abstracted behind a single `services/otp.ts` server endpoint.

**Fraud and cost controls:** rate-limited to 1 send per phone per 60 s, 5 sends per phone per day. IP-level cap of 30 sends per hour. Cooldown on consecutive wrong-OTP attempts (exponential: 0 s, 5 s, 30 s, 2 min, lock-out). All thresholds server-side.

**Resilience:** Voice-call OTP as fallback after one failed SMS delivery — critical in rural areas where MTN/Vodacom signal can drop SMS but pass voice. The same code is read aloud by the provider's TTS.

**Auto-fill:** Use the [Web OTP API](https://web.dev/articles/web-otp) on Android Chrome (`<input autocomplete="one-time-code">` + the `@<domain> #<otp>` SMS suffix). On iOS, the keyboard suggestion bar handles it automatically.

#### 9.2.1 Phone entry (`/login`, step 1)

- Full-screen sheet on mobile, centered dialog `420 × auto` on desktop.
- Logo + tagline at top.
- Country picker (defaults to **+255 Tanzania**, with **+254 Kenya** as the second option; full list opens a searchable bottom sheet). Phone field auto-formats as user types (`712 345 678`).
- Single primary button: **"Send code"**. Disabled until the local part is at least 9 digits.
- Secondary link below: "Use email instead" — opens the email/password form, only visible if the user has tapped *anything* (so it doesn't bias farmers away from the right path).
- Footer: terms + privacy as inline links. No "Sign up" link — there is no separate sign-up.

#### 9.2.2 OTP verification (`/login`, step 2)

- Same shell. Header shows the phone number with a small "Edit" icon that returns to step 1.
- **6 boxed digit inputs.** Auto-advance on entry, auto-back on delete, paste-the-whole-code support. Each box 44 × 56 dp, brand-green border on focus. `inputmode="numeric"`, `autocomplete="one-time-code"`.
- "Resend in 30 s" countdown directly under the inputs. When it expires it becomes a tappable "Resend code" link. After 2 failed sends, a second link appears: "Get the code by voice call".
- On submit, the boxes either flash green (next screen loads in 200 ms) or shake red with `Incorrect code. Try again.` + a focus reset.
- Trust copy at the bottom in `muted`: "Mkulima will never ask you to share this code." Same pattern Safaricom/M-Pesa uses; rural users recognize it as legitimate.

#### 9.2.3 Role picker (first-time only)

- Only appears the first time a phone number signs in successfully (i.e., the user did not exist before this OTP cycle — sign-up and sign-in are the same flow).
- Five large tappable cards: **Farmer** (default highlighted), Agrodealer, Agrovet, Agronomist, Logistics provider.
- Each card has an icon, a 1-line description (e.g., "I buy inputs and grow crops") and a small "What's this?" disclosure.
- Admin / KYC officer / catalog manager / support agent / financial auditor roles are **not selectable here** — those are created server-side and provisioned via invite link only.
- "Continue" primary at the bottom.

#### 9.2.4 Profile completion (post-role, optional)

- One screen. Optional name, optional location (with "Use current location" auto-fill via GPS), optional preferred language (default to device locale). Skip-able. Filled later in profile settings.

#### 9.2.5 Email + password (secondary path, admin/agronomist only)

- Reached from "Use email instead" on step 1, or directly at `/admin/login`.
- Standard email + password form with show/hide, "Forgot password?" → email-link reset, no social login (Google/Apple/Facebook removed — not the right audience).
- Server gates: only accounts with an `email` *and* a role in `{Admin, SuperAdmin, KYCOfficer, CatalogManager, SupportAgent, FinancialAuditor, Agronomist}` may log in here. Farmer / agrodealer / agrovet / logistics phone accounts cannot be granted email login retroactively without an admin action.

#### 9.2.3 KYC flow (`/kyc`)

- Single-screen-per-step flow inside the Farmer / Vendor dashboard (not a modal). Steps: **NIN → Front of ID (camera) → Back of ID (camera) → Selfie (camera) → Review → Submit**. Camera capture inline (no third-party redirect). Show progress chip "Step 3 of 5" at top. After submit, show pending state with ETA.

### 9.3 Farmer Dashboard

#### 9.3.1 Today (`/farmer`)

- Greeting + date (Swahili: "Habari, [name]"). Weather card (icon + temp + condition + 3-day forecast horizontal scroll). AI crop tip card. Quick actions row (Scan, Soil test, Tools, Vet) as round icon buttons. "Your orders" rail (last 3). "Bookings due this week" if any. Cart FAB if items.
- **Empty:** new farmer with no orders → CTA to shop or to scan.

#### 9.3.2 Shop tab

- Reuses the public marketplace grid, filtered to vendors who deliver to the farmer's region. "Saved vendors" pinned at top.

#### 9.3.3 Scan (FAB)

- Full-screen camera drawer. Single CTA "Capture". After capture, a bottom sheet slides up with diagnosis, recommended treatments (chips), and a "Find dealers near you" section with distance and "Call" / "Visit" actions. "Ask a follow-up question" opens the voice chat in the same sheet.

#### 9.3.4 Orders tab

- Three filter chips: All | Active | Past. Order cards as specified above. Tap → order detail with timeline (Placed → Confirmed → Shipped → Delivered), each step with timestamp.

#### 9.3.5 My Farm (deep page, surfaced from Today)

- Farm list (cards). "Add farm" primary on top-right. Each card → farm detail with crops planted, planting dates, AI crop advice, weather overlay, tasks for this week.

#### 9.3.6 Tool rental & Logistics (deep pages)

- Marketplace-style grids, but with date-range pickers as the primary filter. Booking is a 4-step drawer: **Pick dates → Pickup location → Review → Confirm & pay**.

#### 9.3.7 Profile (`/profile`)

- Avatar, name, role chip. Linear list of items: Personal info, Farms, KYC status, Saved vendors, Languages, Theme, Sign out. KYC row shows a pill: green "Verified", amber "Pending", red "Action needed".

### 9.4 Agrodealer / Agrovet Dashboard

#### 9.4.1 Today (`/dealer`)

- Revenue today (big number, brand color). Tabs: Today | Week | Month. Orders awaiting confirmation card. Low-stock products card. POS quick-start button (also FAB).

#### 9.4.2 Products tab

- Mobile: list of products with thumbnail, name, stock chip, price; long-press to multi-select; swipe-left to delete. Tablet+: data table. "+ Product" FAB / button.
- Product form: drawer on mobile, side-sheet on desktop. Image picker uses camera or library. Auto-suggest categories.

#### 9.4.3 Orders tab

- Three buckets: To confirm | To fulfill | Completed. Tap order → confirm, generate invoice, message buyer on WhatsApp.

#### 9.4.4 POS (FAB)

- Full-screen "register" UI. Scan-barcode bar on top (live camera), product grid, cart panel on the right (or bottom drawer on phone). Discount, tax, split-tender support. After charging → printable/sharable receipt sheet.

#### 9.4.5 Tools tab

- Same as Products tab but for `Tool` entities, with availability calendar and rental rates.

#### 9.4.6 Analytics

- 3 KPI cards (Revenue, Orders, AOV). One line chart (revenue over time). One bar chart (top 5 products). Export CSV button.

#### 9.4.7 Business Profile

- Cover, logo, name, description, operating hours, specialties (chip multi-select), WhatsApp config (number + access token, with "Send test message" button), Google Business config (Place ID + sync button).

### 9.5 Agronomist Dashboard

- Requests inbox (Pending | Accepted | Completed). Tap a request → farmer profile, problem description, attached photos, accept/decline/refer-out actions. Schedule view as a week calendar. Profile page with bio, specialties, hourly rate, languages spoken.

### 9.6 Logistics Provider Dashboard

- Jobs feed (new requests). Accept → job appears in "Active". Map view of pickup and dropoff (using `maplibre-gl` for free tiles). Earnings tab with weekly summary and payout history. Vehicle status (Approved / Pending / Banned) pill prominent in profile.

### 9.7 Admin Dashboard

- Sidebar (desktop) / bottom-sheet menu (mobile). Sections: Overview, Users, Catalog, Orders, KYC queue, Payments, Logistics, Audit log. Role-gated as today, but the gating is enforced server-side too.
- Overview is a true exec dashboard: GMV today/week/month, new sign-ups, KYC backlog, top vendors, refund rate.
- **KYC queue** is a new dedicated screen with thumbnails of ID + selfie side-by-side, fast Approve / Reject / Request-redo actions, and an audit trail.

### 9.8 Cross-cutting modals/drawers

| Modal | Mobile | Desktop |
|---|---|---|
| Plant scanner | Full-screen drawer | Centered dialog 720 × 880 |
| Barcode scanner | Full-screen drawer | Same drawer (camera flow) |
| Cart | Bottom drawer 90 % height | Right side-sheet 420 px |
| Login | Bottom drawer | Centered dialog 420 × auto |
| Guest checkout | Full-screen drawer | Centered dialog 520 × auto |
| Receipt | Bottom drawer | Centered dialog 420 × auto |
| Confirm delete | Bottom drawer | Centered dialog 360 × auto |

---

## 10. Loading, Empty, Error States (the "L.E.E. matrix")

Every async surface declares all four states explicitly. No screen ships without all four.

| State | Pattern |
|---|---|
| Idle | Default. |
| Loading | Skeleton matching the shape of the loaded content. Never a centered spinner unless it's < 200 ms before content arrives. |
| Empty | Illustration + 1-line title + 1-line body + primary action. Localized illustrations (e.g., a maize plant for "no orders yet"). |
| Error | Toast for transient (network blip), inline callout for persistent (validation), full-screen for fatal (auth lost). Each error has a "Try again" or "Contact support" CTA. |

---

## 11. Content & Voice

- **Tone:** Plainspoken, practical, warm. No jargon. No exclamation marks outside celebratory moments (order placed, KYC verified).
- **Person:** Address the user directly in Swahili second person ("Unaweza..." / "Tafadhali..."). In English, second person plain ("You can...").
- **Currency:** Always use `Intl.NumberFormat(locale, { style: 'currency', currency })`. Default `TZS`, switchable from profile.
- **Dates:** Relative for the last 7 days ("Yesterday, 4:32 PM"), absolute thereafter ("12 May").
- **Buttons:** verb + object. "Add to cart", "Place order", "Book agronomist". Never "Submit", "OK", "Click here".

---

## 12. Performance Budgets

| Metric | Budget |
|---|---|
| LCP (3G Fast, low-end Android) | ≤ 2.5 s |
| INP | ≤ 200 ms |
| Initial JS (route-level) | ≤ 150 KB gzipped |
| Initial JS (entire shell + first route) | ≤ 250 KB gzipped |
| Image weight per route | ≤ 300 KB cumulative |
| Lighthouse PWA | 100 |
| Lighthouse Accessibility | ≥ 95 |

These are non-negotiable for the marketplace route. Dashboards may exceed once the user is logged in.

---

## 13. Migration / Rollout Plan

This isn't a flag-day rewrite. Sequence:

**Sprint 1 — Foundations (1 week)**
1. Install Tailwind via PostCSS (kill the CDN), wire the token system from §3.1.
2. Install shadcn/ui CLI, generate the 12 core primitives (`button`, `input`, `label`, `card`, `dialog`, `drawer`, `sheet`, `dropdown-menu`, `select`, `tabs`, `toast` via `sonner`, `tooltip`).
3. Build the new `<AppBar />`, `<BottomNav />`, `<AppShell />`, `<EmptyState />`, `<StatusChip />`, `<PriceTag />`, `<KycGate />`.
4. Replace all `alert()` / `window.confirm()` with `sonner` and `<ConfirmDialog />`.

**Sprint 2 — Public surface (1 week)**
5. Re-skin Home, Product grid, Product detail, Vendor profile, Cart, Guest checkout to the new spec.
6. Add `react-router-dom v7` and move from conditional rendering to routes for the public side.

**Sprint 3 — Farmer (1 week)**
7. Re-skin Farmer dashboard tabs, Plant scanner, KYC flow.
8. Migrate scanner and barcode scanner modals to drawers.

**Sprint 4 — Vendor + Admin (1.5 weeks)**
9. Re-skin Agrodealer / Agrovet dashboard, POS, Analytics.
10. Re-skin Admin dashboard, KYC queue, Audit log.
11. Re-skin Agronomist + Logistics dashboards.

**Sprint 5 — Polish (3 days)**
12. PWA install banner, offline banner, push permission flow.
13. Accessibility audit (axe-core in CI).
14. Performance audit (Lighthouse in CI), bundle analysis, image lazy-load.

---

## 14. Resolved Decisions (locked 2026-05-14)

The six open questions are answered. These are now project constraints, not preferences.

1. **Navigation.** Bottom nav on mobile (5 tabs, role-specific per §6.1). Persistent sidebar on `md` and up. **Locked.**
2. **Currency.** TZS only at launch. All `<PriceTag>` instances hard-bind to `TZS` via `Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS' })`. The data model still carries `currency` so we can flip to multi-currency without a migration when KES/UGX come later. **Locked.**
3. **Maps.** MapLibre GL JS + free OSM/MapTiler tiles. Vendor profiles, logistics tracking, farm location, and KYC location all render through one shared `<Map>` component. No Google Maps SDK in the bundle. **Locked.**
4. **Notifications & cross-platform.** Web Push at launch (for the PWA) **and** Expo Notifications path kept warm. `services/api.ts` already has the `registerPushToken` endpoint — we treat it as the single contract for both clients. Token type (`web` vs `expo`) is a field on the same record. When the React Native shell ships, it reuses the same API client and the same types. **Locked.**
5. **Illustrations.** Hybrid. **Locked.**
   - **unDraw (MIT licence, recolored to brand)** for all non-hero empty states (no orders, no tools, no reviews, empty cart, no farms, etc.). One shared `<Illustration name="..." />` component reads SVG sources and overrides `fill` with `brand.500` (light) / `brand.300` (dark).
   - **5 custom illustrations** commissioned from a Tanzanian or Kenyan illustrator (target ~$1.5–2k total) for culturally specific moments: (a) Farmer Today greeting hero, (b) Plant scanner onboarding, (c) "Your first sale" agrodealer POS empty state, (d) Logistics map empty state with boda boda / pickup truck context, (e) KYC verified celebration. SVG-first with a 2× PNG fallback for older Android WebViews.
   - Until custom set lands, the same 5 slots use placeholder unDraw images so layout and copy can ship independently.
6. **Dark mode.** Ship at launch. Every token in §3.1 is paired light/dark, every screen spec covers both, and the `prefers-color-scheme` listener replaces the current "read once at mount" pattern in `ThemeContext`. **Locked.**

---

## 15. Appendix — File-level refactor checklist

A concrete list of source-file changes implied by this spec (engineer-ready):

- `index.html` — remove inline `tailwind.config`, remove Tailwind CDN, remove Google Fonts CDN, remove zxing CDN; replace with module imports.
- `tailwind.config.ts` — new file; tokens from §3.
- `components/ui/*` — new shadcn-generated primitives.
- `components/app-shell/{AppBar,BottomNav,AppShell,FAB}.tsx` — new.
- `components/feedback/{EmptyState,Skeleton,OfflineBanner,StatusChip,KycGate}.tsx` — new.
- `components/Header.tsx` — replaced by `AppBar`.
- `components/FarmerSidebar.tsx` — kept for desktop, paired with `BottomNav` on mobile.
- All `*Modal.tsx` files — wrap in `<ResponsiveDialog>` (drawer on mobile, dialog on desktop).
- `services/api.ts` — restructure auth: replace `login(email, password)` with `requestOtp(phone, region)` + `verifyOtp(phone, code)`. Email/password endpoint kept under `/auth/admin/login`. Add `services/otp.ts` server module that abstracts Africa's Talking + Twilio.
- `context/AuthContext.tsx` — drop `socialLogin`, drop `register` (collapsed into OTP), drop `password` from `User` type. Add `phone` as required, `phoneVerifiedAt` timestamp, `region` ('TZ' | 'KE'). Token is httpOnly cookie issued after OTP success, not a `localStorage` JSON blob.
- `services/mockAuth.ts` — deleted. Replaced by a small `mockOtp.ts` that returns code `000000` in development.
- `App.tsx` — replaced by `<RouterProvider>` setup; conditional rendering removed.
- `data/mockData.ts` — repopulated with realistic seed data (separate task, but blocking).
- `sw.js` — replaced with Workbox config.
- `manifest.json` — fix icon set, align theme color.
- Drop: `motion` package, empty `components/ResultDisplay.tsx`, inline icon SVGs scattered across pages.

This is the spec. Once we agree on §14, I can start producing the first concrete deliverables — the Tailwind token file, the new app shell, and a re-skinned Home + Product detail you can run on your Mac.
