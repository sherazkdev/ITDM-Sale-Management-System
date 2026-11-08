# Final Windows Standalone Readiness (Stage 4)

**Date:** 2026-11-08  
**Project:** `D:\ITDM-Sale-Management`  
**Scope:** Engineering preparation for client initial standalone install — **not** client-PC deployment, **not** production acceptance.

**Legend:** **VERIFIED** (engineering) | **PARTIAL** | **BLOCKED** | **NOT TESTED** | **CLIENT-DEPENDENT**

---

## Go / No-Go summary

| Gate | Result |
|------|--------|
| **Windows deployment — ENGINEERING READY** | **YES (conditional)** — package, scripts, backup, API production smoke, migrations documented; see caveats below |
| **Native Windows PostgreSQL install** | **NOT TESTED** — engineering DB via Docker Compose only |
| **Client PC install / Task Scheduler / NSSM** | **CLIENT-DEPENDENT** — examples only; not registered on dev machine |
| **Full air-gap / disabled NIC** | **NOT TESTED** |
| **D12 official issuance/return forms** | **BLOCKED** — client files required |
| **Production-ready** | **NO** |

---

## 1. Architecture (supported)

| Layer | Technology | Offline |
|-------|------------|---------|
| OS | Windows 10/11 x64 | **VERIFIED** engineering host |
| Database | PostgreSQL **15+** (16 in docs) local service | Client install **NOT TESTED** |
| API | `node apps/api/dist/index.js`, `NODE_ENV=production` | **VERIFIED** build |
| Web | `next start` from packaged `apps/web` + repo-root `node_modules` | **VERIFIED** build |
| Browser | Loopback (`127.0.0.1`) or LAN (optional `CORS_ORIGIN`) | No mandatory internet |
| Files | `STORAGE_ROOT` + `BACKUP_DIR` under `C:\ITDMS\data\` pattern | Persistent outside binaries |
| Services | PostgreSQL Windows service + optional NSSM for API/Web | **CLIENT-DEPENDENT** registration |

**Explicitly out of scope:** Electron/Tauri, Docker on client standalone, Next **standalone** output (ships `.next` + hoisted `node_modules`).

---

## 2. Prerequisites (client PC)

| Requirement | Notes |
|-------------|--------|
| Node.js **≥ 20** LTS | `preflight-check.ps1` |
| PostgreSQL **15+** | Native install; create DB user + `itdms_prod` (or agreed name) |
| `pg_dump` / `psql` on PATH **or** document Docker-only dump path | Preflight warns if `pg_dump` missing |
| Disk for app + `data/storage` + `data/backups` | Backup script optional disk guard |
| Offline media | Node + PostgreSQL installers bundled by client IT |
| Secrets | `deploy/windows/env.api.production.example` → `api.env`; rotate all placeholders |
| AV exclusions | **CLIENT-DEPENDENT** |

---

## 3. Offline package (Stage 4 refresh)

| Item | Evidence (2026-11-08 PM) |
|------|---------------------------|
| Command | `.\scripts\windows\assemble-offline-package.ps1 -SkipBuild` (after `npm run build`) |
| Output path | `rehearsal/offline-pack/` (gitignored) |
| Integrity manifest | **1084** files — `rehearsal/offline-pack/app/deploy/windows/PACKAGE-MANIFEST.json` |
| Layout | `app/`, `config/`, `data/storage`, `data/backups`, `logs/`, `install/scripts/` |
| Exclusions | No `.env`, no dev cookies, no `storage-test` |
| Includes | All **10** Prisma migrations (through D09 + D10), production `dist/` + `.next` |

**Operator action after every engineering release:** rebuild (`build-production.ps1`), re-assemble, copy package to client media, run `prisma migrate deploy` on target DB before first start.

---

## 4. PostgreSQL & migrations

| Check | Status |
|-------|--------|
| Migration count | **10** (`init` → `d10_asset_custody_department`) |
| D09 `20261108120000_d09_non_asset_movements` | **VERIFIED** applied on `itdms_deploy_rehearsal` (Stage 4) |
| D10 `20261108180000_d10_asset_custody_department` | **VERIFIED** applied on `itdms_deploy_rehearsal` (Stage 4) |
| Pre-upgrade DB missing D09/D10 | **Observed** — caused `/non-asset-stock` **500** until `migrate deploy` |
| `prisma migrate reset` | **Forbidden** on dev/staging/prod |
| Native Windows PG service | **NOT TESTED** |
| Docker Compose PG (engineering) | **VERIFIED** when daemon running (`127.0.0.1:5433`) |

**Upgrade procedure (client):** stop API → `npx prisma migrate deploy` from packaged `apps/api` with production `DATABASE_URL` → start API → smoke `health/ready`.

---

## 5. Startup, stop, and services

| Script | Purpose |
|--------|---------|
| `preflight-check.ps1` | Read-only Node/npm/templates |
| `build-production.ps1` | Production API + web build |
| `assemble-offline-package.ps1` | Package + manifest |
| `start-itdms-production.ps1` | API :3010 + Web :3012 (configurable), PID files |
| `stop-itdms-production.ps1` | Graceful stop |
| `run-offline-rehearsal.ps1` | Isolated `itdms_deploy_rehearsal` orchestration |
| `deploy/windows/nssm-services.example.ps1` | **Example only** — **not installed** |
| `register-weekly-backup.example.ps1` | **Example only** — **not scheduled** |

**Stage 4 fix (engineering):** `start-itdms-production.ps1` now launches Next via packaged `node_modules/next/dist/bin/next` instead of `npx next` (which could bind a **wrong** application on the same port).

**Windows service registration on client PC:** **BLOCKED** without client IT authorization (Stage 4 did not register services).

**Boot order (documented):** PostgreSQL → `wait-postgres.ps1` → API → Web.

---

## 6. Client backup policy (D17)

| Policy item | Implementation | Stage 4 status |
|-------------|----------------|----------------|
| Weekly backups | `run-scheduled-backup.ps1` + Task Scheduler (client) | Script **VERIFIED**; schedule **CLIENT-DEPENDENT** |
| Latest + one previous local generation | `ITDMS_BACKUP_RETAIN_LOCAL=2` (default) | **VERIFIED** — rotation logs `stage4-backup-run*.log` |
| External-drive copy | Operator copies manifest folder to USB | **DOCUMENTED**; drive **BLOCKED** if absent |
| SQL + manifest + optional storage | `backup-itdms.mjs` | **VERIFIED** (`docker_exec` pg_dump) |
| Lock file | `.itdms-backup.lock` | **VERIFIED** (Wave 6) |
| Isolated restore | `restore-rehearsal.mjs` → `itdms_restore_test` only | **VERIFIED** — `stage4-restore-rehearsal.log`; `itdms_dev` untouched |
| RPO/RTO numbers | — | **Not invented** — client sign-off pending |

---

## 7. Offline operation & security

| Check | Status |
|-------|--------|
| No CDN in `apps/web/src` | **VERIFIED** (scan) |
| `@fontsource/inter` bundled | **VERIFIED** |
| Session + CSRF + RBAC | **VERIFIED** — Prompt 2 API/Playwright |
| `financial.corrections` permission | **VERIFIED** |
| Production rate limit 600/15m | **Unchanged** |
| `ITDMS_STAGING_STRICT` / 32-char `SESSION_SECRET` | Documented in production template |
| Rehearsal secrets | Ephemeral / isolated DB only — not for production |

---

## 8. Engineering rehearsal (Stage 4)

| Step | Result | Log |
|------|--------|-----|
| Preflight | **PASS** (warnings: no host `pg_dump`, dev credentials in local `.env`) | `docs/release/rehearsal/stage4-preflight.log` |
| Package assemble | **PASS** — 1084 files | `stage4-assemble.log` |
| Migrations on `itdms_deploy_rehearsal` | **PASS** (D09/D10 applied) | `stage4-migrate-deploy.log` |
| Backup ×2 + rotation | **PASS** | `stage4-backup-run1.log` |
| Restore drill | **PASS** → `itdms_restore_test` | `stage4-restore-rehearsal.log` |
| API `production-smoke.ps1` | **PASS** | `stage4-production-smoke.log` |
| API module smoke | **PASS** (incl. non-asset after migrate) | `stage4-workflows-rerun.log` |
| Report XLSX exports | **PASS** | `stage4-report-exports.log` |
| Web `/login` on :3012 | **PASS (web-only, 2026-11-08 PM)** — packaged `next` binary serves ITDMS login **200**; full API+DB rehearsal **BLOCKED** without PostgreSQL `:5433` |
| Full UI finance walkthrough on rehearsal DB | **NOT TESTED** (minimal data); covered by Prompt 2 Playwright on `itdms_e2e` |
| Restart persistence | **PARTIAL** — prior Wave 6B; not re-run after Docker stop |

**Concurrent dev stacks:** E2E may use **:3020/:3021**; rehearsal package uses **:3010/:3012** — avoid port collisions.

---

## 9. D12 — official forms

| Item | Status |
|------|--------|
| Client Asset Issuance / Return artwork | **BLOCKED** — not in repo |
| Integration hooks | **READY** — `docs/release/ASSET_MOVEMENT_TEMPLATE_INTEGRATION.md` |
| Operational exports | **VERIFIED** — `NON-OFFICIAL-D12` disclaimer on reports |
| Production acceptance with official PDFs | **NO** until D12 files integrated |

---

## 10. Installation procedure (summary)

1. Install **Node 20+** and **PostgreSQL** from approved offline installers (client IT).
2. Create database + role; set `DATABASE_URL` in `config/api.env` from `deploy/windows/env.api.production.example`.
3. Set `STORAGE_ROOT`, `BACKUP_DIR`, `SESSION_SECRET` (32+ chars), production ports.
4. Set `config/web.env.local` — `ITDMS_API_URL` pointing to API loopback port.
5. From packaged `app/apps/api`: `npx prisma migrate deploy` then **one** admin seed or restore from backup (client policy).
6. `install/scripts/start-itdms-production.ps1` (or NSSM after client approval).
7. Browser: web port `/login`; verify `health/ready`.
8. Schedule weekly `run-scheduled-backup.ps1` with `-EnvFile`; train operator on external USB copy.

Full detail: [`WINDOWS_STANDALONE_INSTALLATION.md`](./WINDOWS_STANDALONE_INSTALLATION.md), [`WINDOWS_BACKUP_RESTORE_RUNBOOK.md`](./WINDOWS_BACKUP_RESTORE_RUNBOOK.md), [`CLIENT_PC_INSTALLATION_CHECKLIST.md`](./CLIENT_PC_INSTALLATION_CHECKLIST.md).

---

## 11. Remaining blockers

Unchanged release gates — see `PRE_DEPLOYMENT_GAP_LIST.md` **B1–B3, B6–B7, B11–B15**.

**Stage 4 additions (engineering):**

| Item | Owner |
|------|--------|
| Native PostgreSQL Windows service + `pg_dump` on PATH without Docker | Client IT |
| Re-verify packaged web `/login` after `start-itdms-production.ps1` fix | Engineering (when Postgres available) |
| Task Scheduler weekly backup + external drive procedure on client PC | Client IT |
| UAT + staging credentials | Client |

---

## 12. Files changed (Stage 4)

| File | Change |
|------|--------|
| `scripts/windows/start-itdms-production.ps1` | Launch Next from packaged `node_modules` (avoid wrong `npx` app) |
| `docs/deployment/FINAL_WINDOWS_STANDALONE_READINESS.md` | This report |
| `requirements/IMPLEMENTATION_STATUS.md` | Stage 4 row |
| `docs/release/PRE_DEPLOYMENT_GAP_LIST.md` | Stage 4 addendum |
| Evidence logs | `docs/release/rehearsal/stage4-*.log` |

---

**STOP** — Stage 4 engineering verification complete. Client PC install and production acceptance remain **CLIENT-DEPENDENT**.
