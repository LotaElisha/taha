# Mkulima Super App (TAHA) — Project Audit & Recommendations

**Date:** 2026-05-14
**Scope:** 78 TS/TSX files, ~10,837 LOC. React 19 + Vite + TypeScript + Gemini SDK. PWA shell. No backend, no tests, no router.

---

## 1. Executive Summary

The codebase is a feature-rich **prototype/demo** of a multi-vendor agricultural marketplace (farmers, agrodealers, agrovets, agronomists, logistics, admin/POS, AI plant scanner, KYC, WhatsApp ordering). The product vision is strong and the UI surface is broad, but the application is **not production-grade** in its current form. Every "backend" call is a `setTimeout` returning mock data, the data store is React `useState` in `App.tsx`, the Gemini API key is shipped to the browser, and core building blocks (routing, auth, tests, CI, real DB, real payments) are absent.

The right way forward is a **two-track rewrite**: keep the UI components, replace the data/auth/AI layer with a real backend, and adopt a router-based architecture.

---

## 2. Critical Faults (must fix before going live)

### 2.1 Security

| # | Issue | Where | Risk |
|---|---|---|---|
| C1 | **Gemini API key bundled into the browser** via `vite define`. Anyone viewing the JS bundle can extract and abuse it. | `vite.config.ts:14-15`, `services/geminiService.ts:12`, `components/PlantScannerModal.tsx:281` | Quota theft, billing fraud, API abuse |
| C2 | **Plaintext passwords** stored in `mockUsers` and compared as strings. | `data/mockData.ts:12`, `services/api.ts:30`, `services/mockAuth.ts:16` | Credential exposure |
| C3 | **No real auth tokens** — session is just a JSON user object in `localStorage` (`loggedInMkulimaUser`). Any JS on the page can read or replace it. | `context/AuthContext.tsx:33-47` | Account takeover, privilege escalation (a user can edit `role: 'SuperAdmin'` in DevTools and reload) |
| C4 | **Payment gateway secrets in React state** (`apiKey`, `apiSecret`, M-Pesa shortcodes). Anything persisted to `localStorage` will leak. | `App.tsx:82-88` | PCI/finance compliance failure |
| C5 | **KYC files (national ID + selfie) only logged to console** — never uploaded, never encrypted at rest, no audit trail. | `components/KYCModal.tsx:68` | Regulatory violation; identity data mishandling |
| C6 | **No XSS sanitization** on user-generated content (reviews, business descriptions, comments). React escapes by default, but as soon as `dangerouslySetInnerHTML` or a richer editor is added you have a gap; reviews are also embedded in WhatsApp message strings unescaped. | `App.tsx:204` (WhatsApp message), reviews flow | Stored XSS, injection into outbound messages |
| C7 | **Service worker uses stale-while-revalidate for every GET, including HTML and JSON**. If you later add real API endpoints, users will see stale data and old bundles indefinitely. | `sw.js:37-60` | Data integrity, hard-to-debug "ghost bugs" |

### 2.2 Functional / Correctness Bugs

| # | Issue | Where |
|---|---|---|
| F1 | **Invalid Gemini model names.** `gemini-3-flash-preview`, `gemini-3-pro-preview`, `gemini-2.5-flash-native-audio-preview-12-2025` — these aren't valid Google models. Every AI call will 404 on real keys. Use `gemini-2.5-flash`, `gemini-2.5-pro`, etc. | `services/geminiService.ts:37,77,123,146`, `components/PlantScannerModal.tsx:284` |
| F2 | **Empty mock arrays.** `mockProducts`, `mockReviews`, `mockOrders`, `mockTools`, `mockToolBookings`, `mockLogisticsBookings` are all `[]`. The marketplace renders empty and there is nothing for vendors/admins to manage on a fresh load. | `data/mockData.ts:19-32` |
| F3 | **`body.overflow` effect is inverted.** `if (user) return;` exits before the overflow logic runs for logged-in users — modals inside dashboards can't lock background scroll. | `App.tsx:100-106` |
| F4 | **Order channel hard-coded to `'online'`** even when the comment claims it would be `'mobile'` from the app. | `services/api.ts:78`, `App.tsx:188` |
| F5 | **Category filter is locale-broken.** Categories filter against literal English (`'Seeds'`, etc.) while labels are translated via `t(...)`. Switching to Swahili still works (filter is on the raw value), but as soon as someone translates the filter list it will silently break. | `App.tsx:342-350` |
| F6 | **`ResultDisplay.tsx` is empty (0 bytes)** — dead file imported nowhere; deletes-or-implements decision needed. | `components/ResultDisplay.tsx` |
| F7 | **Duplicate Gemini client.** `PlantScannerModal` instantiates `new GoogleGenAI(...)` directly instead of using `geminiService.getAI()`. Two singletons; harder to swap auth later. | `components/PlantScannerModal.tsx:281` |
| F8 | **Both `framer-motion` and `motion` listed as dependencies.** They are the same library (the package was renamed). Pick one — delete the other to shrink the bundle. | `package.json:14,16` |
| F9 | **PWA manifest icon is SVG only**, no 192/512 PNGs. Chrome/Android will refuse to mark the app as installable in many cases. Also `theme_color` is `#556B2F` in the manifest but `#166534` in `index.html` — pick one. | `manifest.json`, `index.html:11` |
| F10 | **No `react-router`.** Every "page" is a conditional render in `App.tsx`. No deep links, no back-button, no shareable URLs, no SEO. | `App.tsx:235-300` |
| F11 | **Race condition in camera init.** `useEffect` depends on `isCameraLoading`, which is set inside the effect → re-runs and can trigger duplicate `getUserMedia` calls under React 19 StrictMode. | `components/PlantScannerModal.tsx:169-203` |
| F12 | **`window.matchMedia('(prefers-color-scheme: dark)')` is read once but not subscribed.** System theme changes don't update the app. | `context/ThemeContext.tsx:19` |
| F13 | **No error boundaries.** A single render-time throw anywhere (e.g., Gemini returning malformed JSON) crashes the whole app to a blank screen. | App tree |
| F14 | **`alert()` and `window.confirm()` used 14+ times** for UX flows (KYC reminders, delete confirms, copy-to-clipboard feedback, etc.). Blocks the main thread, looks unprofessional, untestable. | App.tsx, AdminDashboard, AgrodealerDashboard, ReceiptModal, etc. |

### 2.3 Architecture / Maintainability

| # | Issue | Where |
|---|---|---|
| A1 | **All domain state lives in `App.tsx` `useState`** (`products`, `orders`, `tools`, `toolBookings`, `logisticsBookings`, `reviews`, `paymentGateways`). It is drilled down through ~15-prop interfaces (see `FarmerDashboardProps`, `AgrodealerDashboardProps`, `AdminDashboardProps`). Refresh = total data loss. | `App.tsx:55-90`, page prop interfaces |
| A2 | **No data layer.** `services/api.ts` returns mock objects with `setTimeout` to imitate a network. None of it is wired to a real server. Calling code uses both `services/api.ts` and the in-memory state inconsistently. | `services/api.ts`, App.tsx |
| A3 | **Tailwind via `cdn.tailwindcss.com`.** Tailwind explicitly says this build is **not for production** — no purging, slower paint, no theming pipeline. Also: `<link rel="stylesheet" href="/index.css">` is referenced but the file doesn't exist. | `index.html:14,45` |
| A4 | **No code splitting.** Every dashboard (Admin, Agrodealer, Farmer, Logistics) and every modal is imported at the top of `App.tsx`. Initial bundle includes the entire app for every visitor, including guests. | `App.tsx:1-38` |
| A5 | **No tests.** Zero `.test.*` or `.spec.*` files. No Vitest, Playwright, or RTL config. | repo-wide |
| A6 | **No linter / formatter config.** `package.json` `lint` is `tsc --noEmit` only. No ESLint, no Prettier, no Husky. | `package.json:10` |
| A7 | **No environment typings.** `process.env.API_KEY` is used but there is no `env.d.ts` declaration; TS errors are suppressed by `@types/node`. | `vite.config.ts`, `services/geminiService.ts` |
| A8 | **`react: ^19.1.1` + StrictMode** doubles every effect in dev; several effects (camera init, voice session, AI search) aren't fully idempotent. | `index.tsx`, scanner/voice flow |
| A9 | **Massive components.** `PlantScannerModal.tsx` ~28 KB; `AdminDashboard.tsx` 350 lines; `AgrodealerDashboard.tsx` 568 lines. Each mixes presentation, state, and side effects. Hard to test, hard to refactor. | `components/`, `pages/` |
| A10 | **No accessibility pass.** Decorative SVGs without `aria-hidden`; some modals lack focus-trap and ESC-to-close. | repo-wide |
| A11 | **No observability.** No Sentry, no PostHog, no console error capture, no audit log. | repo-wide |
| A12 | **No CI / Dockerfile / deploy config.** `README.md` only documents `npm run dev`. | repo-wide |

---

## 3. Prioritized Fix List

### Sprint 0 — Stop the bleeding (1–3 days)
1. **Move Gemini calls behind a server proxy.** Add a tiny Node/Hono/Cloudflare-Workers endpoint that holds the key. Delete `process.env.API_KEY` from client code. Replace `vite define` with `import.meta.env.VITE_API_URL` only.
2. **Fix the Gemini model names.** Replace `gemini-3-*` with `gemini-2.5-flash` / `gemini-2.5-pro` and verify the `live` audio model name in the current SDK docs. Audit all 5 call sites.
3. **Delete the `framer-motion`/`motion` duplicate, the empty `ResultDisplay.tsx`, and the broken `/index.css` reference.**
4. **Repopulate `data/mockData.ts`** with seed data, or scaffold an API; right now the app demos as empty.
5. **Replace Tailwind CDN with the PostCSS pipeline.** `npm i -D tailwindcss postcss autoprefixer` and create a real `tailwind.config.js`. Remove the inline `tailwind.config = {}` in `index.html`.
6. **Fix the inverted `body.overflow` effect** in `App.tsx` (drop the `if (user) return;`).
7. **Fix the manifest:** add 192×192 + 512×512 PNG icons, align `theme_color` between `index.html` and `manifest.json`.

### Sprint 1 — Production foundations (1–2 weeks)
8. **Add a real auth provider.** Recommend Supabase Auth, Clerk, or Auth.js. Issue JWTs, store them in httpOnly cookies, never `localStorage`. Add a server-side role check for `Admin`/`SuperAdmin`/`KYCOfficer` routes — the current client-side ACL in `AdminDashboard.tsx:30-44` is trivially bypassable.
8b. **Hash passwords** with Argon2id server-side. Remove `password` from `User`.
9. **Pick a routing solution.** `react-router-dom v7` if you stay on Vite, or migrate to Next.js for App Router + SSR + image optimization. Replace conditional rendering in `App.tsx` with routes (`/`, `/login`, `/dashboard/farmer`, `/dashboard/admin`, `/scanner`, `/vendor/:id`, etc.).
10. **Introduce TanStack Query** for all server state. Delete the App-level mega-state. Each page fetches what it needs and caches it.
11. **Wire a real database.** Postgres (Supabase or Neon) + Drizzle or Prisma. Move every entity in `types.ts` to schemas. Add migrations.
12. **Replace `alert`/`window.confirm`** with a toast library (`sonner` or `react-hot-toast`) and a confirmation dialog component.
13. **Add Sentry** (or PostHog Error Tracking) and an `ErrorBoundary` at the route level.
14. **Add ESLint + Prettier + Husky + lint-staged.** Wire `tsc --noEmit`, `eslint`, `prettier --check` into a `pre-commit` hook and a GitHub Actions workflow.
15. **Add Vitest + React Testing Library** with smoke tests for auth, cart, checkout, and the search reducer. Add at least one Playwright e2e on the guest checkout flow.

### Sprint 2 — Hardening & domain features (2–4 weeks)
16. **Real payments.** Integrate Selcom / M-Pesa / Stripe — server-side only. Webhooks signed and verified. Idempotency keys.
17. **Real KYC storage.** Upload `idFrontUrl` / `selfieUrl` to S3/R2 with private buckets and signed URLs. Audit log every state transition.
18. **Real WhatsApp.** Move `whatsappService.sendWhatsAppMessage` to a server route that calls Meta Graph API. Never ship the access token to the browser.
19. **Pre-cache strategy for the service worker.** Use Workbox: stale-while-revalidate for assets, network-first for `/api/*`, never cache HTML at the SW layer. Add cache versioning tied to the build hash.
20. **Code-split per route** (`React.lazy` + `Suspense`) so guests don't download admin/dealer/agronomist bundles.
21. **Internationalization upgrade.** Move from raw fetched JSON to `i18next` + `react-i18next` (ICU plurals, namespaces, lazy locale chunks). Today the entire en/sw files load up front and key misses log warnings.
22. **Currency / i18n number formatting.** Replace hard-coded `Tsh` strings with `Intl.NumberFormat`.
23. **Accessibility pass.** Focus-trap in modals, `aria-modal`, `role="dialog"`, ESC to close, skip-to-content link, contrast audit.
24. **Performance.** Move large SVG icon literals out of JSX into a sprite or icon component; tree-shake `lucide-react` usage.

---

## 4. Recommended Tech Stack Going Forward

The right shape depends on whether you want one web app or a multi-platform play. Given the existing `services/api.ts` already includes Expo push-token endpoints, you appear to want **web + mobile**. I'd target this stack:

### Web client
- **Next.js 15 (App Router)** on React 19 — gives you routing, SSR/RSC for the public marketplace (SEO matters here), API route handlers for the AI proxy, image optimization, and a serverless deploy story. If you really want to stay SPA-only, keep Vite + add **react-router-dom v7**.
- **TypeScript strict mode** (turn on `strict: true`, `noUncheckedIndexedAccess`).
- **Tailwind CSS** (PostCSS pipeline, not CDN) + **shadcn/ui** for accessible primitives. Keep the existing green/brown brand tokens.
- **TanStack Query** for server state, **Zustand** for cart/UI state, **react-hook-form + zod** for forms and validation.
- **next-intl** or **i18next** for i18n.
- **framer-motion** only (drop the `motion` duplicate).

### Mobile client
- **Expo (React Native)** — re-use TypeScript types, share the API client. The `expo` block in `services/api.ts` is already gesturing toward this.

### Backend
- **Next.js Route Handlers** for thin endpoints, OR **Hono/Fastify on Node** if you want a separate service. For Tanzanian latency, deploy in `af-south-1` or Cloudflare's Nairobi PoP.
- **PostgreSQL** (Supabase or Neon) with **Drizzle ORM** (lighter than Prisma, better edge support).
- **Supabase Auth or Clerk** — both handle phone-OTP, social login, and MFA without you reinventing it.
- **Supabase Storage / Cloudflare R2** for KYC documents, product images, plant-scan uploads. Signed URLs, no public reads.
- **Resend or Postmark** for transactional email.
- **Meta Cloud API** for WhatsApp (server-side).
- **Stripe + Selcom + M-Pesa Daraja** for payments. Webhook verification + idempotency keys mandatory.

### AI
- **Server-side only** Gemini calls. Use the @google/genai SDK in an API route. Stream responses to the client over SSE.
- Add a small **prompt + response cache** keyed by image hash for plant-scan (saves a lot of money).

### Infra & ops
- **Vercel** (Next.js) or **Cloudflare Pages + Workers** for web.
- **Fly.io / Railway** if you keep a long-running Node service.
- **GitHub Actions** for CI: lint, typecheck, test, build.
- **Sentry** for errors, **PostHog** for product analytics + feature flags.
- **Doppler / Vercel env vars** for secrets — never `.env.local` checked in.

### Quality gates
- **Vitest + React Testing Library** for unit/component.
- **Playwright** for e2e (checkout, KYC, dashboard ACL).
- **MSW** for mocking the API in tests.
- **ESLint (with @typescript-eslint, eslint-plugin-react, jsx-a11y) + Prettier + Husky + lint-staged.**
- **Storybook** for the component library if you keep growing the modal-heavy UI.

---

## 5. Concrete Next Action

If I were starting Monday, the first PR I'd open is this scoped one:

1. Add an `apps/web` + `apps/api` Turborepo split (or commit to Next.js and skip the monorepo).
2. Stand up a Hono/Next route called `POST /api/ai/plant-scan` and move `analyzePlantImage` into it.
3. Delete the client-side `process.env.API_KEY` references.
4. Replace `gemini-3-flash-preview` / `gemini-3-pro-preview` with the correct current model names and test against a real key.
5. Repopulate `mockData.ts` (or replace it with a Drizzle-seeded Postgres) so the marketplace isn't empty.
6. Add ESLint + Prettier + a GitHub Actions workflow that runs `tsc`, `eslint`, `vitest`.

Everything else can be sequenced after that — but those six items are blocking any real customer use of the current build.
