# Windows Deployment Readiness Report

**Project:** ITDMS — `D:\ITDM-Sale-Management`  
**Date:** 2026-11-03  
**Client target:** Windows desktop, Core i5 10th Gen, 16 GB RAM, 1 TB SSD, standalone then LAN  
**Claim:** **Not production-ready** · **Not client UAT** · **Not deployed to client hardware**

---

## 1. Executive summary

Wave 5 closed business-requirement gaps in documentation and operational report exports. This checkpoint adds **Windows standalone installation planning**, **operator runbooks**, and **non-destructive helper scripts**. Deployment to the client PC remains **operator-driven** after prerequisite installs and **D17/D01/D02** decisions.

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
| API Vitest full suite (`itdms_test`) | **66/66 PASS** (Wave 5) |
| Web Vitest | **43/43 PASS** |
| `extended-modules.test.ts` (reports incl. movements/employees) | **4/4 PASS** |
| `verify-wave5-report-exports.mjs` against local API | **404 on new routes** until API process restarted/rebuilt; **Vitest + extended-modules** confirm implementation |
| `preflight-check.ps1` | **PASS** (Node 24.x; warnings: no `pg_dump` in PATH, dev credentials in local `.env`) |
| `build-production.ps1` | Validated by structure review; full run optional on dev machine (long) |

**Requires client machine:** NSSM service recovery, Task Scheduler identity, firewall rules, PostgreSQL as Windows service under AV, restore drill on production paths.

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

*(Updated after commit — hash in IMPLEMENTATION_STATUS and operator handoff.)*
