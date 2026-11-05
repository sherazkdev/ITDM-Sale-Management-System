# Wave 6 — Offline Installation Rehearsal Report

**Date:** 2026-11-05 (execution) · engineering started 2026-11-03  
**Project:** `D:\ITDM-Sale-Management`  
**Scope:** Isolated production-mode rehearsal on engineering workstation — **not** client PC  
**Classification:** VERIFIED | PARTIAL | NOT TESTED | CLIENT-DEPENDENT

---

## 1. Objective

Validate ITDMS as **Next.js production + Express production + local PostgreSQL + filesystem storage** without dev tooling (`tsx watch`, IDE), without modifying `itdms_dev` / staging, and without registering production Windows services on the dev machine.

---

## 2. Production runtime architecture

| Layer | Runtime | Offline |
|-------|---------|---------|
| Browser | `http://127.0.0.1:3011` (prod template) / **3012** (rehearsal) | Local only |
| Web | `npx next start -p <port>` from packaged `apps/web` | **VERIFIED** build |
| API | `node dist/index.js` in `apps/api` | **VERIFIED** build |
| DB | PostgreSQL **127.0.0.1** (client port e.g. 5432/5433) | Isolated DB `itdms_deploy_rehearsal` for rehearsal |
| Documents | `STORAGE_ROOT` under `C:\ITDMS\data\` or rehearsal `data/storage` | Mutable, outside app binaries |

**Not used:** Electron/Tauri, Docker (client standalone), Next **standalone** output (proxy + monorepo — package ships `.next` + `node_modules`).

**Offline dependencies:** **VERIFIED** — `@fontsource/inter` bundled; no CDN/fonts/API in `apps/web` scan.

---

## 3. Package assembly — **VERIFIED** (2026-11-05)

| Artifact | Evidence |
|----------|----------|
| `assemble-offline-package.ps1` | Completed; output `rehearsal/offline-pack/` (gitignored) |
| `write-package-manifest.mjs` | **1014** hashed paths → `app/deploy/windows/PACKAGE-MANIFEST.json` |
| Layout | `offline-pack/app`, `config/`, `data/`, `logs/`, `install/scripts/` |
| Dev DB | Not targeted by rehearsal scripts |

**Prerequisites documented:** Node.js **20+** LTS, PostgreSQL **15+** (16 used in dev `docker-compose` reference), `pg_dump` on PATH for backups.

---

## 4. Rehearsal checklist (2026-11-05 session)

| Step | Status | Notes |
|------|--------|-------|
| Production build (`npm run build`) | **VERIFIED** | API + Web |
| Package assemble (`-SkipBuild`) | **VERIFIED** | ~2 min robocopy + manifest |
| Config from template | **VERIFIED** | `run-offline-rehearsal.ps1` writes `config/api.env` |
| PostgreSQL reachable | **FAILED** | `ECONNREFUSED 127.0.0.1:5433` — Docker Desktop not running |
| `itdms_deploy_rehearsal` create | **NOT TESTED** | Blocked by PG down |
| `migrate deploy` / seed | **NOT TESTED** | Blocked |
| Production API/Web start | **NOT TESTED** | Blocked |
| Health / login / modules | **NOT TESTED** | Blocked |
| Report exports (rehearsal ports) | **NOT TESTED** | Blocked |
| Backup to rehearsal dir | **NOT TESTED** | PG + `pg_dump` required |
| Isolated restore | **NOT TESTED** | By policy — no restore over dev DB |
| Air-gapped network | **PARTIAL** | App has no hard online deps; host not fully isolated |

**Prior evidence (2026-11-03, PG up):** Wave 5 `verify-wave5-report-exports.mjs` **PASS** on dev API — still valid for report **code**; not re-run as rehearsal on 2026-11-05.

---

## 5. Windows services — **CLIENT-DEPENDENT** / docs **VERIFIED**

- `deploy/windows/nssm-services.example.ps1` — example only; **not registered** on dev machine  
- `wait-postgres.ps1`, PID files in `start-itdms-production.ps1` / `stop-itdms-production.ps1`  
- Boot order: PostgreSQL service → wait → API → Web  

---

## 6. Backup automation prep — **VERIFIED** (engineering)

| Item | Status |
|------|--------|
| `.itdms-backup.lock` concurrent guard | **VERIFIED** |
| `ITDMS_BACKUP_MIN_FREE_BYTES` (default 500MB) | **VERIFIED** (Wave 6) |
| `run-scheduled-backup.ps1` | **VERIFIED** |
| `register-weekly-backup.example.ps1` | **VERIFIED** — no `-Register` during prep |
| Live backup on rehearsal | **NOT TESTED** (PG down) |

---

## 7. Resources — **NOT TESTED**

No production API/Web processes sustained on 2026-11-05 (PG blocked). **No claim** of Core i5 / 16 GB client sizing.

---

## 8. Regression — newly executed (2026-11-05)

| Suite | Result |
|-------|--------|
| API + Web `npm run typecheck` | **PASS** |
| API + Web `npm run lint` | **PASS** |
| `npm run build` (production) | **PASS** |
| Web Vitest | **43/43 PASS** |
| API Vitest (`itdms_test`) | **NOT EXECUTED (valid)** — PG unavailable; Wave 5 baseline **66/66** unchanged |
| Playwright Wave 3 (13) | **NOT EXECUTED** — requires API + PG |
| `production-smoke.ps1` | **NOT EXECUTED** — blocked |
| `run-offline-rehearsal.ps1` | **PARTIAL** — failed at DB connect |

**To complete rehearsal:** Start PostgreSQL (`docker compose up -d postgres` on dev **or** client Windows service), then:

```powershell
cd D:\ITDM-Sale-Management
.\scripts\windows\run-offline-rehearsal.ps1 -SkipAssemble -SkipBuildPackage
```

---

## 9. Files created/changed (Wave 6)

| Path | Purpose |
|------|---------|
| `scripts/windows/assemble-offline-package.ps1` | Offline package |
| `scripts/windows/run-offline-rehearsal.ps1` | Isolated DB + prod start + verify |
| `scripts/windows/start/stop-itdms-production.ps1` | Manual prod processes |
| `scripts/windows/wait-postgres.ps1` | DB readiness |
| `scripts/windows/write-package-manifest.mjs` | SHA-256 manifest |
| `scripts/windows/ensure-rehearsal-database.mjs` | Create rehearsal DB |
| `scripts/windows/production-smoke.ps1` | Health smoke |
| `scripts/windows/register-weekly-backup.example.ps1` | Task Scheduler template |
| `deploy/windows/env.rehearsal.example`, `nssm-services.example.ps1` | Templates |
| `scripts/backup-itdms.mjs` | Lock + disk space check |
| `docs/deployment/*` | Installation, runbook, handover, this report |
| `.gitignore` | `rehearsal/` |

---

## 10. Client-dependent blockers (unchanged)

D12 templates, `remainingUsd`, D09 consumption, D10 issuance, UAT, D17 signed schedule, official ORLEN asset file — see `PRE_DEPLOYMENT_GAP_LIST.md`.

---

## 11. Client PC steps still required

Install PostgreSQL + Node from offline media, extract package, production env secrets, NSSM/services, Task Scheduler backup, restore drill, full workflow UAT.

**Production-ready:** **NO** · **Client acceptance:** **NO**
