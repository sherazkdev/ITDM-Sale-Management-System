# Staging Deployment Runbook (local rehearsal — not client production)

**Version:** Phase 04 (2026-11-03)  
**Audience:** IT / release engineering  
**Scope:** On-prem LAN **staging** preparation only

---

## 1. Architecture overview

```
[Browser on LAN] → [Reverse proxy TLS] → [Next.js :3012] → [API proxy /api/v1]
                                              ↓
                                        [Express API :3002]
                                              ↓
                        [PostgreSQL itdms_staging :5434] + [STORAGE_ROOT volume]
```

| Component | Local staging | Client production (TBD D17) |
|---|---|---|
| Postgres | `docker-compose.staging.yml` → `127.0.0.1:5434` | IT-provided host |
| API | Node `apps/api` with `.env.staging` | systemd / Windows service |
| Web | Next.js `apps/web` port 3012 | Same behind proxy |
| Documents | `apps/api/storage-staging/` | Dedicated disk path |
| Dev DB | `5433` / `itdms_dev` | **Never shared** |
| Test DB | `itdms_test` + `storage-test` | **Never shared** |

**Unresolved (document only):** final hostname, AD/LDAP (D02), TLS cert issuer, backup destination, RPO/RTO (D17).

---

## 2. Prerequisites

- Docker Desktop (staging Postgres)
- Node.js ≥ 20
- `npm ci` at repo root
- Copy env templates:
  - `apps/api/.env.staging.example` → `apps/api/.env.staging`
  - `apps/web/.env.staging.example` → `apps/web/.env.local` (or merge `ITDMS_API_URL`)

Rotate `SESSION_SECRET` to a unique 32+ character value before any shared staging host.

---

## 3. First-time staging setup

```powershell
cd D:\ITDM-Sale-Management
npm run staging:init
```

This will:

1. Start `itdms-postgres-staging` (port **5434**)
2. Attempt pre-migrate backup under `backups/staging/`
3. Run `prisma migrate deploy` against `itdms_staging`
4. Optionally seed UAT fixtures (`ITDMS_STAGING_SEED_UAT=1`)

**Do not** run default `prisma db seed` (dev admin) on staging.

---

## 4. Build and run (local)

```powershell
npm run build:api
npm run build:web

# Terminal A — API (loads .env.staging manually)
cd apps\api
# PowerShell: Get-Content .env.staging | foreach { ... } OR use dotenv-cli if installed
$env:NODE_ENV="production"; Get-Content .env.staging | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)$') { Set-Item -Path "Env:$($matches[1])" -Value $matches[2] }
}; node dist/index.js

# Terminal B — Web
cd apps\web
$env:ITDMS_API_URL="http://127.0.0.1:3002"
npm run start
```

Open `http://127.0.0.1:3012/login` — UAT accounts in UAT checklist (PROPOSED).

---

## 5. Reverse proxy (company LAN)

See `deploy/nginx.staging.example.conf`. When enabled:

- Set `ITDMS_TRUST_PROXY=1` on API
- Terminate TLS at proxy
- Set `CORS_ORIGIN` only if browser calls API directly (prefer Next.js same-origin proxy)

---

## 6. Migrations (ongoing)

Before each schema upgrade on staging:

1. `npm run backup:itdms` with `DATABASE_URL` + `BACKUP_DIR=backups/staging` + `ITDMS_PG_CONTAINER=itdms-postgres-staging`
2. `npx prisma migrate deploy` with staging `DATABASE_URL`
3. Smoke: `npm run staging:smoke`
4. On failure: restore SQL to **new** isolated DB; do not drop production

---

## 7. Coordinated backup (DB + files)

```powershell
$env:DATABASE_URL="postgresql://itdms_staging:...@127.0.0.1:5434/itdms_staging"
$env:STORAGE_ROOT="D:\ITDM-Sale-Management\apps\api\storage-staging"
$env:BACKUP_DIR="D:\ITDM-Sale-Management\backups\staging"
$env:ITDMS_PG_CONTAINER="itdms-postgres-staging"
$env:ITDMS_BACKUP_INCLUDE_STORAGE="1"
npm run backup:itdms
npm run verify:documents
```

Restore rehearsal:

```powershell
npm run restore:rehearsal -- backups/staging/itdms-db-*.sql
```

Set `STORAGE_ROOT` to staging path when running `verify:documents`.

**Retention / schedule:** client approval required (D17) — not configured here.

---

## 8. Security checklist (staging-strict)

| Control | Setting |
|---|---|
| `ITDMS_STAGING_STRICT=1` | Required local staging profile |
| `ITDMS_DISABLE_CSRF=1` | **Forbidden** (startup fails) |
| `SESSION_SECRET` | ≥ 32 chars |
| CSRF header | Required on cookie mutations |
| Rate limits | Active (Phase 01) |
| Dev/test storage | Must not point at `storage-staging` |

---

## 9. Rollback

| Scenario | Action |
|---|---|
| Bad migration | Restore latest `backups/staging/*.sql` to new DB; fix forward |
| Bad release binary | Redeploy previous build artifact; DB unchanged |
| Missing document files | Restore storage archive from same maintenance window as DB backup |

---

## 11. Phase 04B verification (local)

After API + web are running with staging env:

```powershell
npm run staging:smoke
npm run staging:persistence
cd apps/web
$env:STAGING_E2E_SKIP_WEBSERVER="1"
$env:ITDMS_API_URL="http://127.0.0.1:3002"
$env:WEB_ORIGIN="http://127.0.0.1:3011"
npm run staging:e2e
```

Evidence: `docs/release/STAGING_FINAL_VERIFICATION.md`

---

## 12. What this runbook does **not** do

- Deploy to client server
- Configure unattended production backups
- Approve client business policies (D01–D12)
- Execute UAT sign-off
