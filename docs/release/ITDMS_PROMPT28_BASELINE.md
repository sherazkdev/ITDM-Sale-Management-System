# ITDMS Prompt #28 — execution baseline

**Captured:** 2026-11-17 (session continuation)  
**Git HEAD (start):** `9cd7598` — *docs(qa): record prompt27 API 109/109 and core Playwright 96/96*  
**Recovery tag:** `itdms-pre-prompt27-2026-11-17` @ `410a7fb`  
**Prior audit HEAD referenced in prompt:** `1502ea9` (superseded locally by `9cd7598`)

## Prompt #27 consolidated results (historical)

| Layer | Result | Evidence |
|-------|--------|----------|
| Static gates (Prisma, API/Web TSC+ESLint, Web Vitest 73/73, Next build) | PASS | Prompt #27 session |
| API Vitest (single `vitest run`) | **37 files pass / 6 files fail** (83 pass, 26 skip) — `P1001` cold Postgres | `docs/release/_tmp_prompt27_api_full_log.txt` |
| API Vitest (6 failed files rerun) | **26/26 PASS** → effective **109/109** | `docs/release/_tmp_prompt27_api_rerun6_log.txt` |
| Playwright full | **309** tests — **43 pass / 243 fail / 22 did not run / 1 skip** (~17.7m) | `docs/release/_tmp_prompt27_playwright_full_log.txt` |
| Playwright core (excl. responsive/dark/capture matrix) | **96/96 PASS** (~3.9m) | `docs/release/_tmp_prompt27_playwright_core_log.txt` |

## Root-cause summary (Prompt #27 Playwright mass failure)

- Tests **1–43** passed (a11y, D09, dark-mode matrix, etc.).
- **Test 44+** failed with `net::ERR_CONNECTION_REFUSED` on `http://localhost:3011/*` (Next.js listener died mid-suite).
- **Not** isolated application assertion failures at scale; **lifecycle-connected** / **list-server-tables** / **phase-d-forms** passed on core rerun when web stack stayed up.
- **lifecycle-connected** serial skips (**13**) were cascade from first vendor test failure during connection outage.

## Environment (verified this session)

| Resource | Target |
|----------|--------|
| PostgreSQL Docker | `itdms-postgres` @ `127.0.0.1:5433` (healthy) |
| API Vitest DB | `itdms_test` |
| Playwright DB | `itdms_e2e` |
| Dev DB (protected) | `itdms_dev` |
| E2E API | `http://127.0.0.1:3020` — `/api/v1/health/ready` **200**, `verify-api-database-target` → **itdms_e2e** |
| E2E Web | `http://127.0.0.1:3021` — down at baseline; will be started via `ensure-e2e-stack.ps1` |

## Active / duplicate run policy

- No duplicate full Playwright or API Vitest against the same mutable DB while a run is active.
- Prompt #28 adds readiness gates: `wait-database-ready.mjs`, `wait-http-ready.mjs`, API `tests/global-setup.ts`, Playwright `e2e/global-setup.ts`, optional `ITDMS_E2E_EXTERNAL_STACK=1` (long-run stability).

## Prompt #28 completion (2026-11-17)

| Item | Status |
|------|--------|
| DB/API/web readiness scripts + harness | **DONE** |
| API Vitest single run | **109/0/0** (`_tmp_prompt28_api_full_log_v2.txt`) |
| Playwright functional | **309/0/0** (`_tmp_prompt28_playwright_functional_log_v3.txt`) |
| Stability high-risk ×2 | **51/51** (`_tmp_prompt28_stability_highrisk.txt`) |
| Final reports + local commit | See `ITDMS_PROMPT28_FINAL_RELEASE_VERIFICATION.md` |