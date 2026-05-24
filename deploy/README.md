# Deployment

Mkulima is two artifacts: a static React SPA and a Laravel API. Recommended layout:

| Piece | Host | Domain |
|---|---|---|
| React SPA | Cloudflare Pages | `app.mkulima.app` |
| Laravel API + Horizon + Reverb | DigitalOcean Frankfurt (provisioned via Laravel Forge or Ploi) | `api.mkulima.app` |
| Private object storage (KYC docs, product images) | Cloudflare R2 | `mkulima-private` bucket |
| Postgres | Neon (serverless) or Forge-managed on the API droplet | private |
| Redis | Forge-managed on the API droplet | private |
| SMS | Africa's Talking | — |
| Payments | M-Pesa Daraja (sandbox → prod), Selcom Aggregator | — |
| Email (reset etc.) | Postmark | — |

The four files in this directory are the configuration recipes:

- `forge.recipe.sh` — Forge "site recipe" that bootstraps the API server with PHP 8.3, Redis, queue worker, Horizon, Reverb supervisor, and Sentry release tagging on every deploy.
- `pages.config.toml` — Cloudflare Pages build settings for the React SPA, including the `_redirects` SPA fallback.
- `r2-bootstrap.sh` — one-shot script that creates the private bucket, sets the CORS policy, and provisions the access key.
- `nginx-spa.conf` — drop-in nginx site config when self-hosting the SPA instead of Cloudflare Pages.

## First deploy

```bash
# 1. Provision droplet via Forge (or run forge.recipe.sh on a fresh Ubuntu 24.04)
# 2. Push web first, then API:
git push cf-pages main          # Cloudflare Pages auto-builds
git push forge main              # Forge auto-deploys via its built-in webhook
# 3. Set secrets in the Forge dashboard:
#    APP_KEY, GEMINI_API_KEY, AFRICAS_TALKING_API_KEY, MPESA_*, SELCOM_*,
#    SENTRY_LARAVEL_DSN, REVERB_APP_ID/KEY/SECRET, VAPID_PUBLIC_KEY/PRIVATE_KEY,
#    AWS_* (R2), WHATSAPP_*
# 4. SSH to the droplet once and run:
php artisan migrate --force
php artisan storage:link
php artisan key:rotate-encryption-keys   # only if rotating
```

## Sentry release tagging

The CI workflow (`.github/workflows/ci.yml`) tags every merge to `main` with
the commit SHA as the Sentry release on both Laravel and React. Add a
`SENTRY_AUTH_TOKEN` secret in GitHub for the upload to work.
