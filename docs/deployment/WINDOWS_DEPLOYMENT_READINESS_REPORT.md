# Windows Deployment Readiness Report

**Project:** ITDMS — `D:\ITDM-Sale-Management`  
**Date:** 2026-11-05 (Wave 6B verification) · client target unchanged  
**Claim:** **Not production-ready** · **Not client UAT** · **Not deployed to client hardware**

---

## 1. Executive summary

Wave 6 adds **offline package assembly**, **isolated rehearsal automation** (`rehearsal/offline-pack`, database `itdms_deploy_rehearsal`), **production start/stop scripts**, **backup lock + disk guard**, and operator handover docs.

**Wave 6B (2026-11-05):** PostgreSQL restored via **Docker** on `127.0.0.1:5433`. Packaged production stack **API :3010 / Web :3012** started; smoke, workflow API checks, and Wave 5 report export verify **PASS**. Backup lock, disk-space guard, and **2-generation** local rotation **PASS**. API Vitest **66/66** and web Vitest **43/43** re-run on engineering workstation. **Native Windows PostgreSQL service** and **full air-gap** host test **NOT EXECUTED**. Playwright Wave 3 **not re-run** this session (prior **13/13** baseline unchanged).

**Wave 6 engineering commits (local):** `122e8a3`, `4e2d866` (not pushed).

---

## 2. Git checkpoint (Wave 5)

See §8 for commit hash after local commit in this session.

**Wave 5 application changes:**

- Report service: invoice Wave 2 columns; `asset-movements` and `employees` exports
- Web report catalog entries
- API tests in `extended-modules.test.ts`

**Wave 5 checkpoint additions:**

- `docs/deployment/*` (this report, installation guide, backup runbook)
- `deploy/windows/*.example` env templates
- `scripts/windows/*` preflight, build, backup wrapper, report verify

---

## 3. Deployment prerequisites

| Prerequisite | Engineering status | Client / IT action |
|--------------|-------------------|---------------------|
| Windows 10/11 64-bit | Documented | Confirm edition (Pro/Enterprise) |
| Node.js ≥ 20 | `preflight-check.ps1` | Install from offline media |
| PostgreSQL 15+ | Migrations in repo | Install, create DB/user |
| `pg_dump` for backups | Script or Docker fallback | Add PG bin to PATH |
| Production `.env` | Templates in `deploy/windows/` | Generate secrets locally |
| Document storage path | `STORAGE_ROOT` on SSD | ACL + AV exclusions |
| Initial admin | Seed or admin UI | **D01**, **D22** |
| Backup policy | Scripts + rotation | **D17** schedule/RPO |
| Official reports | Operational XLSX only | **D12** templates |

**Offline operation:** After Node/PostgreSQL/ITDMS bits are on disk, normal use does not require internet. Initial `npm ci` needs npm registry unless IT provides a pre-built `node_modules` artifact.

**Docker:** Not assumed.

---

## 4. Prepared installation artifacts

| Artifact | Safe properties |
|----------|-----------------|
| `deploy/windows/env.api.production.example` | Placeholders only |
| `deploy/windows/env.web.production.example` | Placeholders only |
| `scripts/windows/preflight-check.ps1` | Read-only checks |
| `scripts/windows/build-production.ps1` | No DB reset; migrate only with `-RunMigrations` |
| `scripts/windows/run-scheduled-backup.ps1` | Delegates to existing `backup-itdms.mjs` |
| `scripts/windows/verify-wave5-report-exports.mjs` | Env-based credentials |
| `scripts/windows/assemble-offline-package.ps1` | Robocopy package + manifest |
| `scripts/windows/run-offline-rehearsal.ps1` | Isolated DB rehearsal orchestration |
| `scripts/windows/start-itdms-production.ps1` / `stop-itdms-production.ps1` | PID-tracked prod processes |
| `scripts/windows/wait-postgres.ps1` | TCP readiness |
| `scripts/windows/write-package-manifest.mjs` | SHA-256 integrity file |
| `scripts/windows/ensure-rehearsal-database.mjs` | Creates `itdms_deploy_rehearsal` only |
| `scripts/windows/production-smoke.ps1` | Health smoke |
| `scripts/windows/register-weekly-backup.example.ps1` | Task template; `-Register` optional |
| `deploy/windows/nssm-services.example.ps1` | Service registration example |
| `scripts/backup-itdms.mjs` | `.itdms-backup.lock`, `ITDMS_BACKUP_MIN_FREE_BYTES` |

Scripts do **not** install global software, start production services automatically during prep, or delete client data.

---

## 5. Architecture on standalone Windows

```
[Browser 127.0.0.1:3011] → [Next.js next start] → proxy → [API :3000] → [PostgreSQL 127.0.0.1]
                                                      ↓
                                            STORAGE_ROOT (files)
```

Recommended boot order: PostgreSQL → API → Web. Health gate: `/api/v1/health/ready`.

---

## 6. Verification results (development / isolated)

| Check | Result |
|-------|--------|
| API Vitest full suite (`itdms_test`) | **66/66 PASS** (2026-11-05 Wave 6B; `rehearsal/wave6b-api-vitest.log`) |
| Web Vitest | **43/43 PASS** (2026-11-05) |
| `npm run typecheck` / `lint` / `build` | **PASS** (Wave 6 checkpoint) |
| Offline package manifest | **1014 files** SHA-256 |
| `run-offline-rehearsal.ps1` (SkipAssemble/SkipBuildPackage) | **VERIFIED** — isolated DB + prod processes; see `WAVE6_OFFLINE_INSTALLATION_REHEARSAL.md` |
| `production-smoke.ps1` / `verify-rehearsal-workflows.mjs` | **PASS** on `:3010` / `:3012` |
| Backup lock / min free space / rotation (2) | **PASS** on rehearsal `BACKUP_DIR` |
| Restore to `itdms_restore_test` | **VERIFIED** (6B); `itdms_dev` not overwritten |
| Playwright Wave 3 | **NOT RE-RUN** (2026-11-05); baseline **13/13** in Wave 3 report |
| PostgreSQL | **Docker compose** on engineering PC — **not** native Windows service test |

### 6.1 Local runtime verification (2026-11-03)

| Step | Evidence |
|------|----------|
| Stale API removed | Stopped PID **26404** (`node dist/index.js` on `:3000`; prior `health/ready` → `service: itdms-api`) |
| Dev database | **`itdms_dev@127.0.0.1:5433`** — not staging `:5434`; `prisma migrate status` → **8 migrations, schema up to date** |
| Updated API | `npm run dev:api` (`tsx watch src/index.ts`), `NODE_ENV=development`, explicit `DATABASE_URL` → dev DB |
| Health | `GET /api/v1/health/ready` → `success: true`, `checks.database: up` |
| `verify-wave5-report-exports.mjs` | **PASS** — anonymous **401**; authenticated: asset-movements **XLSX** + `NON-OFFICIAL-D12`; employees **XLSX**; invoices **XLSX** + **JSON** (9 columns incl. `commitmentAmountUsd`, `actualPaidUsd`, `postedAt`; **134** invoice rows on dev DB) |

**Requires client machine:** NSSM service recovery, Task Scheduler identity, firewall rules, PostgreSQL as Windows service under AV, restore drill on production paths; install **PostgreSQL client tools (`pg_dump`)** on PATH for scheduled backups (documented in installation guide).

---

## 6.2 Deployment safety (confirmed)

| Item | Status |
|------|--------|
| Secrets in Git | **None** — `.env` gitignored; templates use placeholders only |
| Production credentials | **Not** committed; dev seed passwords documented for rotation only |
| `pg_dump` / backup tools | **Client prerequisite** — preflight warns if missing |
| Windows helper scripts | **Non-destructive** — no auto DB reset, no silent prod service start |
| Application scope | Report routes + verify script only; Wave 3/4 behavior preserved |

---

## 7. Remaining blockers (unchanged)

Full list: [`PRE_DEPLOYMENT_GAP_LIST.md`](../release/PRE_DEPLOYMENT_GAP_LIST.md).

Highlights: UAT not started, D12 official forms, budget `remainingUsd` formula, D09 consumption, D01/D02 auth/RBAC, D17 signed backup/RPO, production-ready **NO**.

---

## 8. Client-machine steps still required

1. Install PostgreSQL + Node from approved offline installers.
2. Copy ITDMS release to `D:\ITDMS\app`.
3. Create production env files from templates; set `DATABASE_URL`, `SESSION_SECRET`, `STORAGE_ROOT`.
4. Run `build-production.ps1 -RunMigrations` once database exists.
5. Provision initial admin; rotate passwords.
6. Manual smoke: login, health, sample report export.
7. Register Windows services / Task Scheduler after IT sign-off.
8. Execute restore rehearsal on a **copy** of production backup before relying on backups.

---

## 9. Related documents

- [`WINDOWS_STANDALONE_INSTALLATION.md`](./WINDOWS_STANDALONE_INSTALLATION.md)
- [`WINDOWS_BACKUP_RESTORE_RUNBOOK.md`](./WINDOWS_BACKUP_RESTORE_RUNBOOK.md)
- [`../release/WAVE5_BUSINESS_CLOSURE_REPORT.md`](../release/WAVE5_BUSINESS_CLOSURE_REPORT.md)
- [`../release/WINDOWS_STANDALONE_DEPLOYMENT_CHECKLIST.md`](../release/WINDOWS_STANDALONE_DEPLOYMENT_CHECKLIST.md)

---

## 10. Git commit reference

**Wave 5 checkpoint (local, not pushed):** `edbe9ebe7f474863b85ee126517c7087c2e99267` — *Wave 5: business closure, report exports, Windows deployment prep*
