# Client-Approved Wave 2 — Financial Rules & Weekly Backup

**Date:** 2026-11-03  
**Authority:** Client clarification answers (Nov 3, 2026) + original financial clarifications in engineering brief  
**Scope:** D05–D08 (financial semantics), D17 (backup retention — partial)  
**UAT / production deploy:** **NOT STARTED**

---

## 1. Client answers applied

| Topic | Client answer | Engineering interpretation |
|---|---|---|
| Actual expenditure | After posting invoice | **Committed** budget line on **post**; **actual paid** only from payment rows |
| Partial payments | Only amount paid on invoice | Payment sum capped at invoice total; status partial/paid from paid vs invoice |
| Reporting currency | USD, manual conversion | `REPORTING_CURRENCY = USD`; manual `exchangeRateToUsd` on payments; optional rate at post for non-USD commitment USD |
| Committed vs PO | Multiple invoices per PO | Each posted invoice creates its own `COMMITTED_INVOICE` line |
| Backup | Weekly; keep ≥1 prior on system; older to external manually | `ITDMS_BACKUP_RETAIN_LOCAL` default **2** manifest sets; no auto external purge |

**Not invented:** invoice reversals, credit notes, FX revaluation, automatic FX APIs, non-USD allocation remaining without USD allocation, RPO/RTO.

---

## 2. Wave 1 verification

Wave 1 deliverables remain in place (60-day expiry, non-asset stock, SAP PO messaging, inventory XLSX, ORLEN theme). Wave 2 did not remove `BudgetProvisionalNotice` where USD commitment or remaining is still provisional.

---

## 3. Database changes

**Migration:** `apps/api/prisma/migrations/20261103160000_wave2_financial_rules/migration.sql`

| Model | Fields / constraints |
|---|---|
| `Invoice` | `currency`, `postedAt`, `budgetId`, `commitmentExchangeRateToUsd`, `commitmentAmountUsd` |
| `InvoicePayment` | `currency`, `exchangeRateToUsd`, `amountUsd`, `budgetId` |
| `BudgetTransaction` | `currency`, `amountUsdReporting`, `exchangeRateToUsd`, unique `invoicePaymentId` |

Existing rows preserved; new columns nullable where needed for compatibility.

---

## 4. API / domain changes

- `apps/api/src/shared/domain/financial-rules.ts` — USD reporting, transaction types `COMMITTED_INVOICE`, `ACTUAL_PAYMENT`, `MANUAL`
- `apps/api/src/shared/money/fx-conversion.ts` — manual rate validation (no zero/negative)
- `invoice.service.ts` — `postInvoice`, `recordPayment` (post required, idempotent payments, budget ledger links)
- `POST /api/v1/invoices/:id/post` — commit to budget
- `budget.service.ts` — summary: `committedUsd`, `actualPaidUsd`, `remainingUsd`, provisional flags
- `report.service.ts` — budget utilization export columns aligned to Wave 2 semantics

---

## 5. Frontend changes (financial only)

- Invoice detail: post-to-budget form, balance USD paid, manual FX on non-USD payments
- Budget summary view: committed / actual paid / remaining (USD reporting)
- `budget-ui.ts` — updated provisional notice text (D06–D08 partial)

CRM layout and ORLEN theme unchanged.

---

## 6. Backup policy (Wave 2)

- `scripts/backup-itdms.mjs` — post-success rotation keeps latest **N** manifest sets (`ITDMS_BACKUP_RETAIN_LOCAL`, default 2)
- Prunes older SQL/manifest/storage siblings **after** successful backup only
- Documented in `docs/production/WEEKLY_BACKUP_POLICY.md`
- **No** Windows scheduled task created on client machine; **no** deletion of external-drive copies

---

## 7. Tests executed (Wave 2 session)

| `apps/api/tests/http/wave2-finance.test.ts` | **PASS** (2026-11-03) |
| `finance-and-concurrency.test.ts`, `procurement-flow.test.ts`, `gap-remediation.test.ts` (updated) | **PASS** after Wave 2 summary assertion fix |
| API `typecheck`, `build` | **PASS** |
| API `lint` | **PASS** (after `financial-rules.ts` fix) |
| Web `typecheck`, `lint`, Vitest (43 tests) | **PASS** |
| Playwright financial E2E | **Wave 3** | `e2e/wave3-finance-verification.spec.ts` |

---

## 8. Remaining ambiguities (client-dependent)

1. **Non-USD committed USD at post** — optional manual rate; if omitted, `commitmentAmountUsd` null → provisional committed USD in summaries.
2. **Non-USD budget allocations** — `remainingUsd` null unless allocation currency is USD (no invented cross-rate at allocation level).
3. **`remainingUsd` formula** — currently `allocatedUsd − actualPaidUsd` only (does not subtract `committedUsd` or manual ledger); utilization uses actual/allocated. **Client formula for “remaining budget” still required** before removing provisional notices.
4. **Search budget snippets** — still use legacy ledger rollup fields; full Wave 2 summary not wired in global search.
5. **D05 credits / finance sign-off** — partial payments only; no credit-note workflow.
6. **D17** — weekly schedule and RPO/RTO still require named approver; rotation policy implemented in script only.

- [`CLIENT_DECISION_REGISTER.md`](./CLIENT_DECISION_REGISTER.md) — Wave 2 updates for D05–D08, D17
- [`../production/FINANCIAL_RULES_VERIFICATION.md`](../production/FINANCIAL_RULES_VERIFICATION.md)
- [`../production/WEEKLY_BACKUP_POLICY.md`](../production/WEEKLY_BACKUP_POLICY.md)
- [`../production/BACKUP_RESTORE_VERIFICATION.md`](../production/BACKUP_RESTORE_VERIFICATION.md) — Phase 02 restore drill (unchanged evidence)

---

## 10. Release stance

Financial policy is **partially verified** — core post/pay/FX/idempotency paths are tested; provisional notices remain where client has not fixed valuation formulas. **Production-ready: NO.**
