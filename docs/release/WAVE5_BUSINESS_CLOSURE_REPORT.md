# Wave 5 — Final Business Requirements Closure

**Date:** 2026-11-03  
**Project:** `D:\ITDM-Sale-Management`  
**Role:** Requirements closure, gap identification, minimal safe implementation — **no UAT, no production deploy, no UI redesign**

---

## Executive summary

Wave 5 audited all client-facing requirements against BO/DB PDFs, the Nov 3 2026 financial answers, and Wave 1–4 delivery. **Core ITDMS operations (employees, serialized assets, procurement records, invoice post/pay, issuance/returns, search, audit, operational exports) are implemented** with strong API and Wave 3 Playwright evidence.

**Production readiness remains NO.** Blockers are primarily **client-dependent**: official templates (D12), RBAC/auth policy (D01/D02), budget “remaining” formula and credits (D06–D08/D05), non-asset consumption (D09), department issuance (D10), backup/RPO policy (D17), and **UAT not started**.

**Wave 5 code changes (reports only):** enriched invoice export with Wave 2 financial columns; added operational **asset-movements** and **employees** report endpoints and UI catalog entries. No changes to `remainingUsd`, movement business rules, branding, or security.

**Local run:** API `http://127.0.0.1:3000` (health: `/api/v1/health/ready`); Web `http://localhost:3011` (login with seed admin per `WAVE1_INITIAL_ADMIN_SETUP.md`).

---

## 1. Sources read

| Source | In repo | Use |
|--------|---------|-----|
| `requirements/Background and Objective.pdf` | Yes | R01–R13 via `SOURCE_TRACEABILITY.md` |
| `requirements/Database structure.pdf` | Yes | Tables R14–R19 |
| Client clarification Document1.pdf | **No** | Referenced in Wave 1 brief / decision register |
| Nov 3 2026 financial answers | Yes (engineering brief) | Wave 2 report + `CLIENT_DECISION_REGISTER.md` |
| `CLIENT_REQUIREMENTS_TRACEABILITY.md` | Yes | Baseline matrix (superseded for detail by `FINAL_CLIENT_REQUIREMENTS_MATRIX.md`) |
| `IMPLEMENTATION_STATUS.md` | Yes | Updated below |
| Wave 2 / 3 / 4 reports | Yes | Verification baseline |

---

## 2. Traceability audit outcome

Full matrix: [`FINAL_CLIENT_REQUIREMENTS_MATRIX.md`](./FINAL_CLIENT_REQUIREMENTS_MATRIX.md).

**Counts (R01–R19 + cross-cutting):**

| Classification | Approx. count |
|----------------|---------------|
| VERIFIED IMPLEMENTED | 12 domains / sub-capabilities |
| IMPLEMENTED BUT NOT VERIFIED | 3 (R01 deploy, Wave 5 reports, staging) |
| PARTIAL | 10 (finance, inventory, reports, auth, backup, documents) |
| CLIENT-DEPENDENT | 8+ decision IDs (D01–D04, D06–D12, D17, templates) |
| NOT IMPLEMENTED | Consumption qty, SAP approval, credits/reversals, official PDFs |

---

## 3. Budget & financial rules (review only)

**Preserved (verified):**

- Invoice **post** creates `COMMITTED_INVOICE` (`apps/api/src/modules/invoices/invoice.service.ts`).
- **Actual paid** only from `InvoicePayment` → `ACTUAL_PAYMENT` (`financial-rules.ts`).
- Manual `exchangeRateToUsd`; optional commitment rate at post (`commitmentAmountUsd`).
- Partial payments and payment idempotency (`apps/api/tests/http/wave2-finance.test.ts`, `apps/web/e2e/wave3-finance-verification.spec.ts`).

**Documented unresolved (provisional UI/notices unchanged):**

1. **`remainingUsd`** — implemented as `allocatedUsd − actualPaidUsd` (does **not** subtract committed or manual ledger); client formula still required (`budget-ui.ts`, `BudgetProvisionalNotice`).
2. **Non-USD commitment without post-time FX** — `commitmentAmountUsd` null → export shows `PROVISIONAL_COMMITMENT_USD`; budget summary flags provisional committed USD.
3. **Non-USD allocations** — `remainingUsd` null / provisional at allocation level.
4. **Reversals and credits** — **NOT IMPLEMENTED**; do not invent.

**Wave 5 export alignment:** `GET /api/v1/reports/invoices` now exposes `postedAt`, `commitmentAmountUsd`, `actualPaidUsd`, and invoice-currency outstanding without altering ledger math.

---

## 4. Asset & non-asset inventory

| Area | Result |
|------|--------|
| Serialized assets, categories, PO link | **VERIFIED** — API + UI + tests |
| Non-asset stock entry, units, qty on hand, PO/type/received | **VERIFIED** — Wave 3 |
| Measurement units | **VERIFIED** — `inventory-units.ts`, schema |
| Purchase-order relationships | **VERIFIED** — optional PO on assets/non-asset |
| Asset history / transactions | **VERIFIED** — append-only `asset_transactions` |
| Employee issue/return | **VERIFIED** — movement service + E2E |
| Consumption, withdrawal, replenishment | **NOT IMPLEMENTED** — D09 |
| Non-asset department issuance | **NOT IMPLEMENTED** — D09/D10 |

No new movement policies or valuation formulas were added.

---

## 5. Official Excel reports

**Operational exports (non-official):** See matrix § Wave 5 report catalog. Generation uses Spreadsheet XML (`tabular-export.ts`); disclaimer `NON-OFFICIAL-D12`.

**Wave 5 additions:**

- `GET /api/v1/reports/asset-movements?format=xlsx|csv|json|pdf`
- `GET /api/v1/reports/employees?format=...`
- Invoice columns aligned to Wave 2 semantics (read-only)

**Gaps:** PO line-level export; P18 filter parameters; client golden templates — **CLIENT-DEPENDENT (D12)**.

**Permissions:** `reports.read` on all report routes (`report.routes.ts`).

---

## 6. Issuance & return forms

- **Infrastructure:** `AssetMovementDocument`, lines, transactions, document upload pattern — **VERIFIED**.
- **Integration plan:** [`ASSET_MOVEMENT_TEMPLATE_INTEGRATION.md`](./ASSET_MOVEMENT_TEMPLATE_INTEGRATION.md) — hooks only.
- **Official company layouts:** **CLIENT-DEPENDENT** until samples supplied.

---

## 7. User access & approval workflows

| Check | Result |
|-------|--------|
| Initial full-access user path | Documented; RBAC seed |
| RBAC middleware | **Intact** — no Wave 5 changes |
| SAP PO approval in ITDMS | **Not built** — D03 |
| ITDMS draft PO handling | **Correct** — external approval messaging |
| Audit history | **Preserved** — export audit events |
| Renewal automation | **Not built** — external process |

---

## 8. Windows standalone readiness

Checklist maintained in [`WINDOWS_STANDALONE_DEPLOYMENT_CHECKLIST.md`](./WINDOWS_STANDALONE_DEPLOYMENT_CHECKLIST.md).

**Prerequisites identified:** Node 20+, PostgreSQL 15+, env secrets, `apps/api/storage/private`, weekly `backup-itdms.mjs` via Task Scheduler (**after D17 approval**), NSSM/service order PostgreSQL → API → `next start`.

**Not done in Wave 5:** Client-machine install, scheduled tasks, TLS, AD integration.

Gap list: [`PRE_DEPLOYMENT_GAP_LIST.md`](./PRE_DEPLOYMENT_GAP_LIST.md).

---

## 9. Regression (Wave 5)

| Suite | Scope | Result (2026-11-03) |
|-------|--------|------------------------|
| API Vitest (full) | 24 files, includes `extended-modules.test.ts` report assertions | **66/66 PASS** (`itdms_test@5433`, ~286s) |
| Web Vitest | Report slug list only | **43/43 PASS** |
| Playwright Wave 3 | Finance + inventory | **Not re-run** (no finance/movement/UI layout changes) |
| Branding / a11y | Wave 4B | **Untouched** |

---

## 10. Verification commands (Wave 5)

```powershell
cd D:\ITDM-Sale-Management\apps\api
$env:DATABASE_URL="postgresql://itdms:itdms_dev_password@127.0.0.1:5433/itdms_test?schema=public"
npx vitest run

cd D:\ITDM-Sale-Management\apps\web
npm run test
```

**Report smoke (authenticated):** `GET /api/v1/reports/invoices?format=json`, `/asset-movements?format=xlsx`, `/employees?format=csv` with session cookie.

---

## 11. Deliverables index

| Document | Purpose |
|----------|---------|
| This report | Closure narrative + evidence pointers |
| `FINAL_CLIENT_REQUIREMENTS_MATRIX.md` | Authoritative requirement classification |
| `PRE_DEPLOYMENT_GAP_LIST.md` | Blockers before deploy/UAT |
| `requirements/IMPLEMENTATION_STATUS.md` | Phase table update |

---

## 12. Production readiness statement

ITDMS is **not production-ready**. Verified functionality covers a **standalone operational baseline** with **provisional finance** and **non-official exports**. Exact blockers are listed in `PRE_DEPLOYMENT_GAP_LIST.md`. **Stop:** Wave 5 complete pending client decisions and UAT.

---

## 13. Wave 5 code diff summary

| File | Change |
|------|--------|
| `apps/api/src/modules/reports/report.service.ts` | Invoice columns; `assetMovements`, `employees` |
| `apps/api/src/modules/reports/report.controller.ts` | New handlers |
| `apps/api/src/modules/reports/report.routes.ts` | Routes |
| `apps/api/tests/http/extended-modules.test.ts` | Assertions |
| `apps/web/src/lib/api/reports.ts` | Report definitions |

**No** changes to: `remainingUsd` calculation, ORLEN theme, PO approval, consumption logic.
