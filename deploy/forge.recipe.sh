#!/usr/bin/env bash
# Laravel Forge "site recipe" — run once when provisioning a fresh droplet.
# Sets up the API server end-to-end. Idempotent — safe to re-run.

set -euo pipefail

SITE_DIR="${SITE_DIR:-/home/forge/api.mkulima.app}"

cd "$SITE_DIR"

# ---- Install ----
git pull origin main
cd api
composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

# ---- Migrate + cache ----
php artisan migrate --force --no-interaction
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# ---- Storage link ----
[ -L public/storage ] || php artisan storage:link

# ---- Workers (Forge supervises Horizon + Reverb; restart on each deploy) ----
php artisan horizon:terminate || true
sudo service supervisor restart || true

# ---- Sentry release tagging ----
if [ -n "${SENTRY_AUTH_TOKEN:-}" ] && [ -n "${SENTRY_ORG:-}" ] && [ -n "${SENTRY_PROJECT:-}" ]; then
    RELEASE="$(git rev-parse --short HEAD)"
    sentry-cli releases new "$RELEASE"
    sentry-cli releases set-commits "$RELEASE" --auto
    sentry-cli releases finalize "$RELEASE"
fi

echo "Deploy complete."
