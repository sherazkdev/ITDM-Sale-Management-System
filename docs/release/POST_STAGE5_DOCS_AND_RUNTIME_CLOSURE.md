# Post–Stage 5 Closure (docs push & packaged runtime)

**Date:** 2026-11-08 (final session)  
**Recovery tag (unchanged):** `itdms-pre-client-uat-2026-11-08` → `5b9cf2b`  
**Production-ready:** **NO**

---

## Part A — Documentation commit & cloud push (earlier session)

| Item | Result |
|------|--------|
| Branch | `main` tracks `origin/main` |
| Remote | `https://github.com/sherazkdev/ITDM-Sale-Management-System.git` |
| CI/CD | No `.github/workflows` — **no auto-deploy** |
| Commit | **`7a5cea329b80ff4bdd0111fc2feeb08a0beb3ba3`** |
| Message | `docs(release): finalize Stage 5 UAT and handover readiness` |
| Push | **SUCCESS** — `git ls-remote origin main` = `7a5cea3` |
| Force push / tag rewrite | **Not performed** |

---

## Part B — Docker Desktop diagnostics (safe — no reset/prune/unregister)

### Symptoms (prior session)

| Check | Finding |
|-------|---------|
| Active context | `desktop-linux` → `npipe:////./pipe/dockerDesktopLinuxEngine` |
| `docker info` | **FAIL** — Linux engine pipe not found |
| `wsl -l -v` | `docker-desktop` distribution **Stopped** |
| Port **5433** | **Not listening** — `itdms-postgres` down |

### Root cause

The **Docker Desktop WSL2 backend** distro `docker-desktop` was **Stopped**, so the Linux engine never exposed `dockerDesktopLinuxEngine`. The CLI and context were fine; the **VM/engine was not running**.

### Safe recovery (this session — no data loss)

```powershell
docker desktop start          # Docker CLI plugin — starts engine + WSL distro
wsl -l -v                     # docker-desktop → Running
docker info                   # succeeds (Client 29.9.2, context desktop-linux)
docker compose up -d          # itdms-postgres only
```

| Post-recovery check | Result |
|---------------------|--------|
| `docker-desktop` WSL | **Running** (WSL 2) |
| `itdms-postgres` | **Up (healthy)** on `127.0.0.1:5433` |
| Volume `itdm-sale-management_itdms_pg_data` | **Present** (unchanged) |

**Not performed:** `docker compose down -v`, prune, `wsl --unregister`, Docker reset, database resets.

### Port 3012 collision (engineering host — not ITDMS)

Unrelated container `babit-tracker-reminder-api-1` published **`127.0.0.1:3012`**, so `http://127.0.0.1:3012/login` returned **404** while ITDMS Next.js also listened on 3012 (`localhost` worked via different bind). **Safe action:** `docker stop babit-tracker-reminder-api-1` (stopped container only; no volume removal). After stop, **127.0.0.1:3012/login → 200 ITDMS**.

E2E stack on **:3020/:3021** was **not** stopped.

---

## Part C — Full packaged runtime verification

**Package root:** `D:\ITDM-Sale-Management\rehearsal\offline-pack`  
**Database:** `itdms_deploy_rehearsal` on `127.0.0.1:5433` (isolated; not `itdms_dev` / staging / prod)

| Step | Command / artifact | Result |
|------|-------------------|--------|
| Compose PG + volume | `docker compose up -d` | **PASS** — healthy |
| `itdms_deploy_rehearsal` migrations | `npx prisma migrate status` (D09/D10 in chain) | **PASS** — up to date (**10** migrations) |
| `itdms_test` migrations | `migrate deploy` (earlier in session) | **PASS** — no pending |
| Prisma Client generate | `npx prisma generate` | **PARTIAL** — **EPERM** renaming `query_engine` DLL (likely file lock); Vitest still passed |
| Fresh API Vitest | `npm run test --workspace=@itdms/api` on `itdms_test` | **PASS 91/91** — `docs/release/rehearsal-stage5-runtime-api-vitest.log` |
| Start packaged stack | `.\scripts\windows\start-itdms-production.ps1` | **PASS** — API :3010, Web :3012 |
| `health/ready` | `GET http://127.0.0.1:3010/api/v1/health/ready` | **PASS** — `database: up` |
| Web login | `GET http://127.0.0.1:3012/login` | **PASS** — **200**, ITDMS markup (after port collision cleared) |
| `production-smoke.ps1` | health live + ready | **PASS** |
| Login + API workflows | `verify-rehearsal-workflows.mjs` | **PASS** — login, dashboard, employees, assets, non-asset, POs, contracts, invoices, employees XLSX, web login |
| Report exports | `verify-wave5-report-exports.mjs` | **PASS** — anonymous **401**; asset-movements / employees / invoices **XLSX** + `NON-OFFICIAL-D12`; invoices **JSON** |
| Restart + DB persistence | `stop-itdms-production.ps1` → `start-itdms-production.ps1`; `User` count in DB | **PASS** — count **1** before and after restart |
| Credentials (rehearsal seed) | `rehearsal.admin` / `Rehearsal-W6B-Local-Verify-Only!` | Isolated rehearsal only |

### Commands reference (exact rerun)

```powershell
cd D:\ITDM-Sale-Management
docker desktop start
docker compose up -d
$env:DATABASE_URL='postgresql://itdms:itdms_dev_password@127.0.0.1:5433/itdms_test?schema=public'
npm run test --workspace=@itdms/api

# If 127.0.0.1:3012 conflicts: docker ps and stop non-ITDMS publishers on 3012
.\scripts\windows\start-itdms-production.ps1 -PackageRoot .\rehearsal\offline-pack
.\scripts\windows\production-smoke.ps1
$env:ITDMS_SMOKE_USER='rehearsal.admin'
$env:ITDMS_SMOKE_PASSWORD='Rehearsal-W6B-Local-Verify-Only!'
node .\scripts\windows\verify-rehearsal-workflows.mjs
node .\scripts\windows\verify-wave5-report-exports.mjs
.\scripts\windows\stop-itdms-production.ps1 -PackageRoot .\rehearsal\offline-pack
.\scripts\windows\start-itdms-production.ps1 -PackageRoot .\rehearsal\offline-pack
```

### Blocked / not re-run this session

| Check | Status |
|-------|--------|
| Full browser UI walkthrough on rehearsal DB | **NOT TESTED** — API smokes cover finance/inventory lists + exports; rich UI paths covered by Playwright on `itdms_e2e` (315 pass, prior evidence) |
| Native Windows PostgreSQL (no Docker) | **NOT TESTED** |
| Air-gap / disabled NIC | **NOT TESTED** |
| Client UAT execution + sign-off | **NOT EXECUTED** |
| Playwright staging | **BLOCKED** — credentials / stack |
| Git push for these doc updates | **Not performed** unless requested |

---

## Part D — Summary

| Gate | Status |
|------|--------|
| Stage 5 docs on cloud | **COMPLETE** (`7a5cea3`) |
| Docker engine + Compose PG | **VERIFIED** (WSL start; volume intact) |
| Packaged API + DB + web rehearsal | **VERIFIED** (2026-11-08 PM final session) |
| Fresh API Vitest (`itdms_test`) | **VERIFIED 91/91** |
| **Production-ready** | **NO** |
| **Engineering ready — client acceptance pending** | **YES** |

Client dependencies unchanged: `REMAINING_CLIENT_ACTIONS.md` (D12, D01/D02, reversal policy, native PG on client PC, backup schedule + external drive, UAT).

**STOP** — verification and reporting complete; no production deployment.
