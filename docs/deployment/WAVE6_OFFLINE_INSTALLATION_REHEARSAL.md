# Wave 6 — Offline Installation Rehearsal Report

**Date:** 2026-11-05 (Wave 6B verification session) · package engineering 2026-11-03  
**Project:** `D:\ITDM-Sale-Management`  
**Scope:** Isolated production-mode rehearsal on engineering workstation — **not** client PC  
**Classification:** VERIFIED | PARTIAL | NOT TESTED | CLIENT-DEPENDENT

---

## 1. Objective

Validate ITDMS as **Next.js production + Express production + local PostgreSQL + filesystem storage** without dev tooling (`tsx watch`, IDE), without modifying `itdms_dev` / `itdms_staging`, and without registering production Windows services on the dev machine.

---

## 2. Production runtime architecture

| Layer | Runtime | Offline |
|-------|---------|---------|
| Browser | `http://127.0.0.1:3011` (prod template) / **3012** (rehearsal) | Local only |
| Web | `npx next start -p <port>` from packaged `apps/web` | **VERIFIED** build |
| API | `node dist/index.js` in `apps/api` | **VERIFIED** build |
| DB | PostgreSQL **127.0.0.1** (client port e.g. 5432/5433) | Isolated DB `itdms_deploy_rehearsal` for rehearsal |
| Documents | `STORAGE_ROOT` under `C:\ITDMS\data\` or rehearsal `data/storage` | Mutable, outside app binaries |

**Not used:** Electron/Tauri, Docker on client standalone, Next **standalone** output (proxy + monorepo — package ships `.next` + `node_modules`).

**Offline dependencies (application code):** **VERIFIED** — `@fontsource/inter` bundled; no Google CDN / unpkg / jsDelivr matches under `apps/web`.

**PostgreSQL on this workstation:** **Docker Compose** (`itdms-postgres`, `127.0.0.1:5433`). **Native Windows PostgreSQL service:** **NOT TESTED** (client install remains **CLIENT-DEPENDENT**).

---

## 3. Package assembly — **VERIFIED**

| Artifact | Evidence |
|----------|----------|
| `assemble-offline-package.ps1` | Completed; output `rehearsal/offline-pack/` (gitignored) |
| `write-package-manifest.mjs` | **1014** hashed paths → `app/deploy/windows/PACKAGE-MANIFEST.json` |
| Layout | `offline-pack/app`, `config/`, `data/`, `logs/`, `install/scripts/` |
| Dev DB | Not targeted by rehearsal scripts |

**Prerequisites documented:** Node.js **20+** LTS, PostgreSQL **15+** (16 in dev `docker-compose` reference), `pg_dump` on PATH **or** `ITDMS_PG_CONTAINER` for Docker-backed dumps.

---

## 4. PostgreSQL readiness (Wave 6B) — **VERIFIED** (Docker dev)

| Check | Result |
|-------|--------|
| Root cause of initial block | Docker Desktop / `itdms-postgres` not running → `ECONNREFUSED 127.0.0.1:5433` |
| Compose service | `docker compose` postgres on **127.0.0.1:5433**, user `itdms` |
| `itdms_dev` / staging | **Not reset** — confirmed present alongside `itdms_deploy_rehearsal` |
| Rehearsal DB | `itdms_deploy_rehearsal` via `ensure-rehearsal-database.mjs` |
| Migrations / seed | `migrate deploy` + seed user **`rehearsal.admin`** (rehearsal-only password in script output) |
| Tools | Backup used **`ITDMS_PG_CONTAINER=itdms-postgres`** when host `pg_dump` not required |

---

## 5. Production rehearsal checklist (Wave 6B)

Command (existing package, no re-assemble):

```powershell
cd D:\ITDM-Sale-Management
.\scripts\windows\run-offline-rehearsal.ps1 -SkipAssemble -SkipBuildPackage
```

| Step | Status | Notes |
|------|--------|-------|
| Config `config/api.env` | **VERIFIED** | `DATABASE_URL` → `itdms_deploy_rehearsal`; `STORAGE_ROOT` / `BACKUP_DIR` under package |
| Production API **3010** | **VERIFIED** | `GET /api/v1/health/ready` → success |
| Production Web **3012** | **VERIFIED** | After fix: `start-itdms-production.ps1` launches web via `cmd.exe /c npx next start` |
| Authentication | **VERIFIED** | `production-smoke.ps1` + `verify-rehearsal-workflows.mjs` (rehearsal admin) |
| Dashboard / modules (API) | **VERIFIED** | Workflows script: employees, assets, non-asset, PO, contracts, invoices, reports |
| Excel exports | **VERIFIED** | `verify-wave5-report-exports.mjs` **PASS** on `:3010` |
| Web `/login` | **VERIFIED** | HTTP 200 from workflows script |
| Manual USD FX / full UI finance | **NOT TESTED** on rehearsal DB (empty/minimal data); Wave 3 E2E covers finance on **`itdms_dev`** |
| Shutdown / restart | **VERIFIED** | `stop-itdms-production.ps1` (fixed `$pid` → `$procId`); restart API+Web **PASS** smoke |
| Data persistence | **PARTIAL** | Rehearsal DB persists across stop/start; no destructive restore into rehearsal during this session |

**Runtime fixes applied during 6B (engineering only):**

- `run-offline-rehearsal.ps1` — `ADMIN_DATABASE_URL` ordering; clear `SEED_ADMIN_*` after rehearsal seed so API Vitest is not polluted  
- `stop-itdms-production.ps1` — avoid reserved `$pid` variable  
- `start-itdms-production.ps1` — health poll loop; Windows `npx` via `cmd.exe /c`  
- `prepare-test-database.ts` — pin `admin.dev` seed for **`itdms_test`** only  

Log: `rehearsal/wave6b-rehearsal.log` (if present) + `rehearsal/wave6b-api-vitest.log`

---

## 6. Offline / air-gapped behavior

| Check | Status |
|-------|--------|
| Application static assets & fonts | **VERIFIED** — bundled; no CDN URLs in web source scan |
| Runtime without internet | **PARTIAL** — rehearsal used normal Windows networking; **loopback not disabled**; no full air-gap adapter test |
| Rehearsal vs client install | Rehearsal = **packaged Node processes + Docker PG** on engineering PC; **not** the same as native PG Windows service on client hardware |

---

## 7. Backup and restore (isolated data) — **VERIFIED**

| Item | Evidence |
|------|----------|
| Weekly backup execution | `node scripts/backup-itdms.mjs` against rehearsal `BACKUP_DIR` |
| `.itdms-backup.lock` | **VERIFIED** — second run returns `backup_failed` / `backup already in progress` |
| `ITDMS_BACKUP_MIN_FREE_BYTES` | **VERIFIED** — inflated threshold → `insufficient_disk_space` |
| Local rotation `ITDMS_BACKUP_RETAIN_LOCAL=2` | **VERIFIED** — `backup_rotation_pruned`; **2** manifest files retained |
| Restore drill | `scripts/restore-rehearsal.mjs` → database **`itdms_restore_test`**; **`itdms_dev` untouched** (prior 6B run) |
| Real production Task Scheduler | **NOT REGISTERED** on dev machine |

---

## 8. Regression — newly executed (Wave 6B)

| Suite | Result |
|-------|--------|
| Web Vitest | **43/43 PASS** (2026-11-05) |
| API Vitest (`itdms_test`, Docker `:5433`) | **66/66 PASS** — log `rehearsal/wave6b-api-vitest.log` (fresh DB + isolated test seed) |
| Playwright Wave 3 (13 scenarios) | **NOT RE-RUN** — 2026-11-05 attempt failed at `auth.setup` (dev stack / `:3011` webServer); baseline **13/13** remains in `CLIENT_APPROVED_WAVE3_REPORT.md` |
| `production-smoke.ps1` (rehearsal `:3010`) | **PASS** |
| `verify-rehearsal-workflows.mjs` | **PASS** |
| `npm run build` (production) | **PASS** (Wave 6 checkpoint) |

---

## 9. Security and startup (engineering)

| Item | Status |
|------|--------|
| Production env validation | Rehearsal uses `env.rehearsal.example` → generated secrets |
| Bindings | **127.0.0.1** rehearsal URLs; no LAN exposure tested |
| Hardcoded production secrets in repo | **None** in templates; rehearsal password is script-default for isolated DB only |
| RBAC / CSRF | Unchanged; API tests include security gates |
| Start/stop scripts | **VERIFIED** after `$pid` / `npx` fixes; PID files prevent duplicate API start |

---

## 10. Windows services — **CLIENT-DEPENDENT**

- `deploy/windows/nssm-services.example.ps1` — example only; **not registered** on dev machine  
- Boot order documented: PostgreSQL service → wait → API → Web  

---

## 11. Tests requiring client hardware — **NOT TESTED**

- Native PostgreSQL Windows service install and `pg_dump` on PATH without Docker  
- NSSM / Task Scheduler under client AV policy  
- Full air-gapped OS (disabled external NIC)  
- ORLEN asset import file (**D09**) on client paths  
- UAT sign-off  

---

## 12. Git checkpoint (local)

Wave 6 engineering: **`122e8a3`**, **`4e2d866`**. Wave 6B script/test fixes may exist **uncommitted**; **no push** per Wave 6B instructions.

---

## 13. Client-dependent blockers (unchanged)

D12 templates, `remainingUsd`, D09 consumption, D10 issuance, UAT, D17 signed schedule — see `PRE_DEPLOYMENT_GAP_LIST.md`.

**Production-ready:** **NO** · **Client acceptance:** **NO** · **Wave 6 live rehearsal (engineering):** **VERIFIED** for items marked VERIFIED above only.
