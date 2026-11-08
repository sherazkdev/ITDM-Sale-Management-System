# Final Source Code Gap Audit — Confirmed Defects Remediation

**Project:** ITDMS / ORLEN  
**Repository:** `D:\ITDM-Sale-Management` (verified working directory; alternate path `D:\Web Development\ITDM-Sale-Management-System` not present)  
**Audit reference date:** 2026-11-05  
**Remediation date:** 2026-11-06  
**Scope:** Confirmed implementation defects only — no business-rule, schema, branding, or design changes beyond display/mapping fixes

---

## 1. Confirmed defects fixed

| ID | Defect | Resolution |
|----|--------|------------|
| GAP-SEARCH-01 | PO search UI used `employee.employeeCode`; API/Prisma expose `employeeNumber` | Frontend types + `/search` movement column use `employeeNumber` |
| GAP-SEARCH-02 | PO search UI used `softwareLicenses.productName`; API/Prisma expose `softwareName` | Frontend types + licenses column use `softwareName` |
| GAP-SEARCH-03 | PO search line total used `lineTotal`; API/Prisma expose `lineSubtotal` | Types + line table bind to `lineSubtotal` |
| GAP-SEARCH-04 | PO search omitted linked `nonAssetStockItems` | API includes enriched non-asset rows; UI tab displays name, UoM, registered/available qty, linked PO |
| GAP-REPORT-01 | Reports catalog claimed “PO header and line summary” while export is header-only | Description corrected; line-level export **not** implemented (R15 matrix: report lines N/A) |

**Non-asset quantities (D09):** `quantityOnHand` (received total) and `quantityAvailable` (movement-backed). Issue/return/replenish/write-off via `non_asset_stock_movements` — see `NON_ASSET_INVENTORY_IMPLEMENTATION_REPORT.md`.

---

## 2. Files changed

| Path | Change |
|------|--------|
| `apps/api/src/modules/search/search.service.ts` | Include `nonAssetStockItems`; return enriched section + truncation cap |
| `apps/web/src/lib/api/search.ts` | Align types with serialized API (`employeeNumber`, `softwareName`, `lineSubtotal`, `nonAssetStockItems`) |
| `apps/web/src/app/(app)/search/page.tsx` | Field fixes + Non-asset stock tab |
| `apps/web/src/lib/api/reports.ts` | Accurate PO report description (header-only) |
| `apps/api/tests/http/po-search-hub.test.ts` | **New** API regression |
| `apps/web/tests/po-search-fields.test.ts` | **New** frontend mapping + report copy regression |
| `docs/release/FINAL_SOURCE_CODE_GAP_AUDIT.md` | This evidence file |
| `requirements/IMPLEMENTATION_STATUS.md` | Status update |

**Not changed:** budget formulas, invoice commitment/payment logic, Prisma migrations, branding, D09 consumption, client deploy, git push/commits.

---

## 3. Requirements decision — PO line-level Excel

| Source | Finding |
|--------|---------|
| `FINAL_CLIENT_REQUIREMENTS_MATRIX.md` R15 | “PO **report** lines N/A in export” |
| Wave 5 catalog | Purchase orders export = header fields; lines not in export |
| `report.service.ts` | Headers: `poNumber`, `vendor`, `status`, `totalAmount`, `currency`, `validUntil` |

**Decision:** Correct misleading UI copy. Do **not** silently add line-level export without an explicit approved requirement.

---

## 4. Fresh verification results (2026-11-06)

| Check | Result |
|-------|--------|
| `npm run typecheck` (api + web) | **PASS** |
| `npm run lint` (api + web) | **PASS** |
| Web Vitest (full) | **48/48 PASS** |
| API Vitest (`itdms_test` @ `127.0.0.1:5433`) | **67/67 PASS** (log: `rehearsal/defect-remediation-api-vitest.log`) |
| Focused `po-search-hub.test.ts` | **PASS** |
| `itdms_dev` / `itdms_staging` | **Not reset / not cleaned** (policy). Vitest uses `itdms_test`. Playwright now uses **`itdms_e2e`**. |

### 4.1 Database safety — why E2E hit `itdms_dev`

| Finding | Detail |
|---------|--------|
| Root cause | Playwright has **no own Prisma connection**. It drives the **running API**. Earlier sessions started API with `DATABASE_URL=…/itdms_dev` (default `apps/api/.env`). |
| Evidence of prior writes (read-only) | On `itdms_dev`: ~65 employees / ~94 POs / ~124 vendors / ~45 non-asset rows matching E2E/LC/W3 prefixes. **Left in place — not deleted.** |
| Isolation now | Database **`itdms_e2e`** created via `scripts/windows/prepare-e2e-database.ps1` + `ensure-e2e-database.mjs`. Guard `verify-api-database-target.mjs` refuses `itdms_dev` / `itdms_staging`. |
| Verified connection (this run) | API **:3020** → `itdms_e2e` (0 vendors before suite; writes afterward only on e2e). Web **:3021** with `ITDMS_API_URL=http://127.0.0.1:3020`. |
| Staging / rehearsal | Unchanged; not used for local write E2E. |

### 4.2 Classification of prior 13 full-suite failures (`rehearsal/playwright-regression.log`)

| # | Test | Classification | Root cause |
|---|------|----------------|------------|
| 1 | `lifecycle-connected` › vendor create, edit, archive | **Test harness** | Strict-mode duplicate heading (fixed `.first()`) |
| 2 | `orlen-branding-capture` › after branding — dark | **Rate-limit / session** | `main` missing after auth degraded under API rate limit |
| 3 | `po-search-hub` › seed PO… | **Rate-limit** | Non-JSON `Too many requests` on API seed |
| 4–5 | `staging-verification` › admin / reader | **Missing staging credentials** | Default `uat.admin` against local admin DB — **BLOCKED** |
| 6 | `wave3-finance` › setup budget… | **Rate-limit** | Same `Too many requests` |
| 7 | `wave3-inventory` › prepare category… | **Rate-limit** | Same |
| 8–10 | `wave4-premium-ui-capture` (3) | **Rate-limit / session** | `main` not found (login/session after limit) |
| 11–12 | `wave4b-fidelity-capture` (2) | **Rate-limit / session** | Same |
| 13 | `workflows` › create employee | **Rate-limit / session** + harness | Session expired → login page; later also duplicate heading |

**Application defects among the 13:** **none confirmed.** No financial/inventory rule bugs identified.

### 4.3 Playwright results after isolation (2026-11-06)

**Local suite** (`playwright.config.ts` — **excludes** `staging-verification.spec.ts`):

| Run | Result | Log |
|-----|--------|-----|
| Full local vs `itdms_e2e` (:3020/:3021) | **266 passed / 3 failed / 216 skipped** | `rehearsal/playwright-e2e-isolated.log` |
| Re-run of the 3 failures after harness fixes | **8/8 PASS** (auth + CRM layout capture file) | `rehearsal/playwright-e2e-fix3.log` |
| Business suite (prior) | **34/34 PASS** | `rehearsal/playwright-business-final7.log` |
| Staging (`npm run staging:e2e`) | **BLOCKED** | Needs authorized UAT accounts + staging stack |

**Remaining 3 failures (isolated run) — all harness; fixed:**

| Test | Cause | Fix |
|------|-------|-----|
| `auth` › login persists session | Asserted `/good morning/i` only; afternoon greeting is `Good afternoon` | Match morning\|afternoon\|evening |
| `crm-layout` › detail pages when records exist | Clicked non-navigating `tr`; `waitForURL` hung 10m on empty/partial lists | Click `a[href]` only; 30s timeout; skip if no link |
| `crm-layout` › gap closure detail modules | Same | Same |

**Effective local Playwright status after fixes:** prior isolated suite green except those three harness cases, which now **PASS**. Staging remains separately **BLOCKED**.

### 4.4 Rate limit / production safety

| Env | Max / 15m | Notes |
|-----|-----------|-------|
| `NODE_ENV=production` | **600 fixed** | Ignores `ITDMS_API_RATE_LIMIT_MAX` |
| Non-production | Default **20000** (override via env) | Local Playwright only |

RBAC/CSRF/auth unchanged.

### 4.5 D09 non-asset inventory — final verification (2026-11-08)

| Item | Evidence |
|------|----------|
| E2E DB only | `prepare-e2e-database.ps1` → `itdms_e2e`; migration `20261108120000_d09_non_asset_movements` applied this session |
| API Vitest | **76/76 PASS** on `itdms_test` (movement **4/4**, concurrency **2/2**, stock **3/3**) |
| Web Vitest | **50/50 PASS** |
| D09 Playwright | `e2e/d09-inventory-workflow.spec.ts` **11/11** @ API **:3020** / web **:3021** |
| Full Playwright (local) | **296 passed / 2 failed / 216 skipped** — `rehearsal/playwright-e2e-d09-closure.log`; failures: vendor `selectOption` harness (Phase D searchable vendor), **not D09** |
| Screenshots | `docs/release/audit-screenshots/d09/*.png` |
| Dept module | **Not implemented** — employee `department` is free text; D09 movements accept employee and/or department string |

**D09 demo on client PC:** **READY** when stack uses `itdms_e2e` + ports 3020/3021 (see implementation report). **Business Phase 2** may proceed for approved non-D09 work; production release gates unchanged.

### 4.9 Business Phase 5 closure (2026-11-08)

| Item | Evidence |
|------|----------|
| Requirements reconciliation | `FINAL_CLIENT_REQUIREMENTS_CLOSURE_REPORT.md` |
| Correction auth | `financial.corrections` permission; delegate `users.manage` → **403** |
| API Vitest | **91/91** on `itdms_test` |
| Production-ready | **NO** (UAT, D12, D01, reversals, native Windows) |

### 4.10 Prompt 2 — full regression (2026-11-08 PM)

| Check | Result | Log |
|-------|--------|-----|
| API Vitest | **91/91** | `docs/release/rehearsal/phase2-api-vitest.log` |
| Web Vitest | **50/50** | `docs/release/rehearsal/phase2-web-vitest.log` |
| Playwright (local, excl. staging) | **315 passed / 0 failed / 216 skipped** | `docs/release/rehearsal/playwright-full-regression.log` |
| E2E stack | API **:3020** / Web **:3021** → `itdms_e2e` | `prepare-e2e-database.ps1` |
| Application defects fixed this prompt | **0** | — |
| Report | `FINAL_FULL_REGRESSION_CLOSURE_REPORT.md` | — |

### 4.8 Business Phase 4 financial corrections (2026-11-08)

| Item | Evidence |
|------|----------|
| Admin gate | `financial.corrections` (+ `requireFinancialCorrections`) on correction + admin ledger routes |
| API Vitest | **90/90** (`financial-corrections-phase4` **5/5**) |
| Web Vitest | **50/50** |
| Audit | `financial.correction` with before/after metadata |
| Report | `docs/release/BUSINESS_PHASE4_FINANCIAL_CORRECTIONS_REPORT.md` |

Posted invoice / payment reversal: **BLOCKED — client policy** (no invented accounting).

### 4.7 Business Phase 3 asset custody D10 (2026-11-08)

| Item | Evidence |
|------|----------|
| Migration | `20261108180000_d10_asset_custody_department` on `itdms_test` / `itdms_e2e` |
| API Vitest | **85/85** (`asset-custody-d10` **4/4**) |
| Web Vitest | **50/50** |
| Playwright | `asset-custody-d10` **3/3**; `lifecycle-connected` **13/13** (document upload fixed); `wave3-finance` **6/6**; D09 **11/11** (same session, isolated stack) |
| Screenshots | `docs/release/audit-screenshots/d10/` |
| Report | `docs/release/BUSINESS_PHASE3_ASSET_CUSTODY_REPORT.md` |

**Note:** Full Playwright inventory not re-executed in the Phase 3 closure pass; targeted regression above + prior isolated full-suite baseline.

### 4.6 Business Phase 2 finance (2026-11-08)

| Item | Evidence |
|------|----------|
| Remaining formula | `allocatedUsd − utilizedUsd` via `budget-metrics.ts` |
| API Vitest | **81/81** (`budget-phase2-acceptance` 5/5) |
| Playwright | `wave3-finance-verification` **6/6**; lifecycle vendor/PO/invoice/payment fixes |
| Report | `docs/release/BUSINESS_PHASE2_FINANCE_CLOSURE_REPORT.md` |

### 4.5 Files added/changed (E2E safety closure)

| Path | Purpose |
|------|---------|
| `scripts/windows/ensure-e2e-database.mjs` | Create `itdms_e2e` |
| `scripts/windows/prepare-e2e-database.ps1` | Migrate + seed isolated DB |
| `scripts/windows/verify-api-database-target.mjs` | Refuse protected DB names |
| `apps/web/playwright.config.ts` | Exclude staging-only specs |
| `apps/web/e2e/auth.spec.ts` | Time-of-day greeting |
| `apps/web/e2e/crm-layout-correction-capture.spec.ts` | Safe detail capture |
| `apps/web/e2e/staging-verification.spec.ts` | Document BLOCKED / staging-only |
| `apps/api/src/shared/middleware/api-rate-limit.ts` | Production ceiling immutable |

---

## 5. Remaining blockers / next deployment gate

- **Staging Playwright** — provide authorized UAT accounts + staging API/web; run `npm run staging:e2e` only  
- **Client PC / native PostgreSQL / air-gap** — Wave 6 client install still **NOT VERIFIED**  
- **D09 / D12 / D01–D08 / UAT** — unchanged client-dependent gaps  
- **Historical `itdms_dev` E2E rows** — remain until an approved cleanup policy (not performed here)  
- **Next gate:** client installation rehearsal on dedicated hardware using offline package + native PG  
- Production-ready: **NO**

---

## 6. Regressions / unresolved defects

- Search/report confirmed defects: **resolved**.  
- Prior 13 full-suite failures: **classified**; no confirmed application defects; local isolation suite closed except staging **BLOCKED**.  
- Do not treat staging failures as local regression regressions.
