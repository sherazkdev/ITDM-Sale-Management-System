#!/usr/bin/env bash
# One-time Neon demo DB: migrate deploy only (no reset, no drop).
set -euo pipefail
if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: set DATABASE_URL to isolated Neon demo database" >&2
  exit 1
fi
if echo "$DATABASE_URL" | grep -qiE 'itdms_dev|itdms_test|itdms_e2e|itdms_staging'; then
  echo "ERROR: refused protected/local DB name in DATABASE_URL" >&2
  exit 1
fi
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT/apps/api"
npx prisma validate
npx prisma migrate deploy
echo "NEON_MIGRATE_DEPLOY_OK"