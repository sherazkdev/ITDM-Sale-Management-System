# ITDMS Prompt #28 — Final Release Verification

**Date:** 2026-11-17  
**Repository:** `D:\ITDM-Sale-Management`  
**Baseline HEAD:** `9cd7598` (pre–Prompt #28 changes)  
**Final local commit:** `b697beb` — `fix(qa): Prompt #28 E2E/API readiness and full regression green`  
**Recovery tag:** `itdms-pre-prompt27-2026-11-17`  
**E2E stack:** API `http://127.0.0.1:3020` → `itdms_e2e`; Web `http://127.0.0.1:3021`; PostgreSQL `127.0.0.1:5433`

---

## 1. Automated test verification (engineering gate)

| Gate | Result | Evidence |
|------|--------|----------|
| Prisma validate | **PASS** | `_tmp_prompt28_prisma_validate.txt` |
| API TypeScript | **PASS** | `_tmp_prompt28_api_tsc.txt` |
| API ESLint | **PASS** | `_tmp_prompt28_api_eslint.txt` |
| **API Vitest** | **109 PASS / 0 FAIL / 0 SKIP** (43 files) | `_tmp_prompt28_api_full_log_v2.txt` (~540s) |
| Web TypeScript | **PASS** | `_tmp_prompt28_web_tsc.txt` |
| Web ESLint | **PASS** | `_tmp_prompt28_web_eslint.txt` |
| **Web Vitest** | **73 PASS / 0 FAIL / 0 SKIP** (18 files) | `_tmp_prompt28_web_vitest.txt` |
| Next.js production build | **PASS** (40 static app routes in build output) | `ensure-e2e-stack.ps1` session |
| **Playwright functional** | **309 PASS / 0 FAIL / 0 SKIP** (8.1m) | `_tmp_prompt28_playwright_functional_log_v3.txt` |
| Playwright visual capture (565 tests) | **Out of UAT gate** | `npm run test:e2e:visual-capture` |
| Stability (high-risk ×2) | **51/51 PASS** | `_tmp_prompt28_stability_highrisk.txt` |

**Functional Playwright catalog:** 309 tests in 18 files (`npx playwright test --list` with capture specs excluded via config).

---

## 2. Prompt #27 failure root causes (closed)

| Area | Prompt #27 symptom | Root cause | Prompt #28 fix |
|------|-------------------|------------|----------------|
| Full Playwright (243 fail) | `ERR_CONNECTION_REFUSED` @ :3011 | Playwright-managed `next start` died mid long run | External stack `ITDMS_E2E_EXTERNAL_STACK=1` + `ensure-e2e-stack.ps1` |
| lifecycle-connected skips | Serial cascade after first fail | Same connection outage | Full suite green on stable stack |
| dashboard-phase-b / list-server-tables / phase-d-forms | Connection refused | Environment | Passed in v3 + stability reruns |
| API Vitest 6 file fail | `P1001` cold Postgres | TCP up before DB accept connections | `wait-database-ready.mjs`, `prepare-*-database.ps1`, API `global-setup` |
| API po-auto-approve skip | `beforeAll` 120s timeout | Concurrent `prisma migrate` (Vitest + E2E prep) | One-shot DB prep in Vitest `global-setup`; sequential regression script |

---

## 3. Route coverage

| Metric | Value |
|--------|------|
| `page.tsx` routes | **46** under `apps/web/src/app` |
| Login + root | **+2** → **48** navigable pages |
| Static smoke (`routes.spec.ts` / `STATIC_APP_ROUTES`) | **36** list routes |
| Dynamic detail routes | Exercised in lifecycle, wave3, D09/D10, official XLSX E2E |
| Responsive matrix | **217** cases inside `responsive.spec.ts` (included in 309) |
| a11y sample | Login + 4 authenticated axe runs (included in 309) |

---

## 4. Business-rule verification (automated)

| Rule | Evidence |
|------|----------|
| PO auto-approval | `prompt25-po-auto-approve.test.ts`, `lifecycle-connected` PO step |
| D09 inventory 100→80→85→75 | `d09-inventory-workflow.spec.ts` + API `non-asset-stock-movements.test.ts` |
| D10 department custody | `asset-custody-d10` API + UI (stability ×2) |
| Finance partial pay / outstanding | `wave3-finance-verification.spec.ts` (locator fix P28-004) |
| Budget semantics | `budget-phase2-acceptance.test.ts`, wave3 finance |
| Finance RBAC | `prompt25-finance-rbac.test.ts` |
| Notifications 60…0 Super Admin | `prompt26-expiry-all-milestones.test.ts` |
| Global Search / PO hub | `po-search-hub.spec.ts`, `gap-remediation.test.ts` |
| Official Issuance/Return XLSX | `prompt25-asset-official-export.test.ts`, `prompt26-official-movement-download.spec.ts` |

---

## 5. UI / grammar

- Prompt #27 PO “draft” copy corrections retained; no `draft` string under `purchase-orders` app routes.
- No approved business-rule or layout redesign in this pass.

---

## 6. Defect ledger (summary)

See `ITDMS_PROMPT28_FINAL_RELEASE_VERIFICATION.md` § defects in audit update; all P1/P2 items from this pass **resolved**. Open **P0/P1: 0**.

---

## 7. Client UAT recommendation

| Layer | Status |
|-------|--------|
| **Automated regression** | **GREEN** — API 109, Web 73, Playwright 309, static gates pass |
| **Manual UI / client acceptance** | **Pending** — client scenarios on staging data |
| **Production deployment** | **RED** — hosting, backups, migration sign-off, templates on target host |

**CLIENT UAT READY (engineering gate): GREEN**

---

## 8. Production deployment blockers (unchanged)

- Client-hosted PostgreSQL and secrets rotation  
- `Issuance.xlsx` / `Return.xlsx` on API host  
- Migration `20261113153000_prompt25_notification_recipient` on client DB  
- Ops runbooks, backup schedule, penetration review (out of Prompt #28 scope)

---

## 9. Local commit

Recorded after staging source + `docs/release` (excludes `_tmp_*` logs and screenshot artifacts).