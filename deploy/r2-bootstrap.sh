#!/usr/bin/env bash
# r2-bootstrap.sh — one-shot R2 setup for Mkulima.
# Requires the Cloudflare API token in CF_API_TOKEN and the account id in
# CF_ACCOUNT_ID. Run from your laptop, not the server.

set -euo pipefail

BUCKET="${BUCKET:-mkulima-private}"
ACCOUNT="${CF_ACCOUNT_ID:?set CF_ACCOUNT_ID}"
TOKEN="${CF_API_TOKEN:?set CF_API_TOKEN}"

# Create the bucket (idempotent — 409 on existing).
curl -sS -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT/r2/buckets" \
  --data "{\"name\":\"$BUCKET\"}" | jq .

# CORS: the SPA needs PUT for direct-to-R2 uploads (for product images).
# KYC docs are NOT directly uploadable — they go through the Laravel API.
curl -sS -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT/r2/buckets/$BUCKET/cors" \
  --data @- <<EOF | jq .
{
  "rules": [
    {
      "allowed": {
        "methods": ["GET", "PUT"],
        "origins": ["https://app.mkulima.app", "http://localhost:3000"],
        "headers": ["*"]
      },
      "exposeHeaders": ["ETag"],
      "maxAgeSeconds": 3600
    }
  ]
}
EOF

echo "R2 bucket $BUCKET ready. Provision an access key in the dashboard and"
echo "fill AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_ENDPOINT in .env."
