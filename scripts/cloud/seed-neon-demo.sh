#!/usr/bin/env bash
# Seed synthetic demo data ONLY when ITDMS_DEMO_DB_CONFIRM=1 and URL is not dev/test/e2e.
set -euo pipefail
if [ "${ITDMS_DEMO_DB_CONFIRM:-}" != "1" ]; then
  echo "Set ITDMS_DEMO_DB_CONFIRM=1 to run demo seed" >&2
  exit 1
fi
if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL required" >&2
  exit 1
fi
if echo "$DATABASE_URL" | grep -qiE 'itdms_dev|itdms_test|itdms_e2e|itdms_staging'; then
  echo "ERROR: refused protected/local DB name" >&2
  exit 1
fi
if [ -z "${SEED_ADMIN_PASSWORD:-}" ]; then
  echo "ERROR: set SEED_ADMIN_PASSWORD (demo admin — not committed)" >&2
  exit 1
fi
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT/apps/api"
npx prisma db seed
echo "Optional walkthrough extension (API must be up): npm run db:seed-walkthrough"
echo "DEMO_SEED_OK"