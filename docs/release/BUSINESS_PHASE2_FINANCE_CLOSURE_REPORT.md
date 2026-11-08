# Business Phase 2 — Finance & Budget Closure Report

**Date:** 2026-11-08  
**Project:** `D:\ITDM-Sale-Management`

## 1. Confirmed client rules (not re-opened)

| Rule | Implementation |
|------|----------------|
| Budgets maintained in USD | `createAllocation` rejects non-USD (`422`) |
| Manual annual allocation | Existing `/budgets` FY + allocation forms; invoice post selects `budgetId` |
| Invoice consumes budget on **POST** | `COMMITTED_INVOICE` ledger row; draft invoices excluded |
| Actual expenditure from **payments** | `ACTUAL_PAYMENT` ledger rows; manual payment-date FX |
| Remaining = Allocated − Utilized | `computeBudgetUsdMetrics` — payments do **not** reduce remaining again |
| Multi-invoice / partial payments | Existing invoice + payment APIs; Phase 2 tests A–C |

## 2. Old vs new budget semantics

| Metric | Before (Wave 2 provisional) | After (Phase 2) |
|--------|----------------------------|-----------------|
| Utilized | `committedUsd` only (label inconsistent) | Sum of `COMMITTED_INVOICE.amountUsdReporting` |
| Actual | `actualPaidUsd` | Unchanged (`ACTUAL_PAYMENT`) |
| **Remaining** | `allocatedUsd − actualPaidUsd` ❌ | **`allocatedUsd − utilizedUsd`** ✅ |
| Utilization % | Based on **actual paid** | Based on **utilized / allocated** |

## 3. Files changed

| Path | Change |
|------|--------|
| `apps/api/src/shared/domain/budget-metrics.ts` | **New** — shared Phase 2 calculations |
| `apps/api/src/modules/budget/budget.service.ts` | Metrics + USD-only allocation |
| `apps/api/src/modules/reports/report.service.ts` | Budget export columns aligned (`utilizedUsd`, correct remaining) |
| `apps/api/src/modules/dashboard/dashboard.service.ts` | Roll-up allocated/utilized/actual/remaining |
| `apps/api/src/modules/dashboard/dashboard.types.ts` | Budget overview fields |
| `apps/api/tests/http/budget-phase2-acceptance.test.ts` | **New** — scenarios A/B/C + guards |
| `apps/api/tests/http/wave2-finance.test.ts` | Remaining expectation corrected |
| `apps/web/e2e/helpers/searchable-select.ts` | **New** Playwright helper |
| `apps/web/e2e/lifecycle-connected.spec.ts` | SearchableSelect + Phase D payment confirm + table assertions |
| `apps/web/e2e/wave3-finance-verification.spec.ts` | SearchableSelect PO + payment confirm |
| `apps/web/src/lib/domain/budget-ui.ts` | Updated semantics copy |
| `apps/web/src/app/(app)/budgets/page.tsx` | Utilized / Actual / Remaining labels |
| `apps/web/src/app/(app)/dashboard/page.tsx` | Verified USD strip (when not provisional) |
| `apps/web/src/lib/api/budgets.ts`, `dashboard.ts` | Types |

**No Prisma migrations.** D09 non-asset logic untouched.

## 4. Manual FX

- **Commitment (utilized):** `commitmentExchangeRateToUsd` at post via `committedUsdAtPost` (unchanged).
- **Payment (actual):** `exchangeRateToUsd` per payment (unchanged).
- **Missing post-time FX on non-USD invoices:** `amountUsdReporting` null → `committedUsdProvisional` + `remainingUsd` null (no invented rate).

## 5. Regression evidence (this session)

| Suite | Result |
|-------|--------|
| API typecheck / lint | **PASS** |
| Web typecheck / lint | **PASS** |
| API Vitest (`itdms_test`) | **81/81 PASS** (incl. `budget-phase2-acceptance` **5/5**) |
| Web Vitest | **50/50 PASS** |
| `wave3-finance-verification.spec.ts` | **6/6 PASS** @ `itdms_e2e` :3020/:3021 |
| `lifecycle-connected.spec.ts` | **10/13 PASS** (vendor/contract/PO/invoice/pay/budget FY fixes applied); remaining: document upload harness TBD |
| D09 Playwright | Not re-run this session (prior **11/11** verified) |

## 6. Playwright harness fixes

| Spec | Fix |
|------|-----|
| `wave3-finance-verification` | PO `SearchableSelect`; Review → Confirm payment |
| `lifecycle-connected` | Vendor `SearchableSelect`; same payment flow; FY/category text assertions; maintenance asset picker |

## 7. Unapproved policies (unchanged)

- Admin financial correction workflow — **not implemented**
- Credit notes, refunds, invoice reversals — **not implemented**
- Automatic FX — **not used**

## 8. PO/contract allocation

- Manual USD allocation per financial year (category + amount).
- Invoice post binds commitment to chosen `budgetId` and PO on ledger rows.
- PO/vendor ledger lookup tabs on `/budgets` — unchanged, verified in API gap tests.

## 9. Demo readiness

**YES (local engineering)** — budgets page and dashboard show approved semantics for USD allocations with verified post/pay flows. Staging UAT still **BLOCKED**.

## 10. Completion gate

| Criterion | Status |
|-----------|--------|
| Approved budget semantics | **COMPLETE** |
| Manual USD allocation | **COMPLETE** (USD enforced) |
| FX separation commit vs pay | **COMPLETE** (existing + provisional flags) |
| API / budgets UI / export alignment | **COMPLETE** |
| Financial API tests | **COMPLETE** (81/81) |
| Prior Playwright selector failures | **RESOLVED** (wave3); lifecycle updated for Phase D patterns |

**Business Phase 2: COMPLETE** for approved finance scope. Full local Playwright suite not re-run end-to-end this session (216 skipped capture/staging tests).
