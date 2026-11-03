# Financial Rules Verification — Wave 2

**Date:** 2026-11-03  
**Reporting currency:** USD (manual conversion)  
**Status:** Core rules **verified in automated tests**; some figures remain **provisional** per client gaps

---

## 1. Terminology (client-confirmed)

| Term | Meaning in ITDMS |
|---|---|
| Invoice total | `invoiceAmount` in invoice currency |
| Invoice posting | User action `POST /invoices/:id/post` → sets `postedAt`, writes `COMMITTED_INVOICE` budget transaction |
| Amount paid | Sum of `InvoicePayment.amount` (invoice currency) |
| Outstanding | Invoice total minus amount paid |
| Committed expenditure | Posted invoice commitment (invoice currency on ledger row; USD via optional post rate or USD invoice) |
| Actual expenditure (paid) | Sum of payment `amountUsd` (`ACTUAL_PAYMENT` budget rows) — **not** invoice total until fully paid |
| Budget utilization | Derived from committed USD + actual paid USD vs USD allocation where defined |
| Remaining budget | `allocatedUsdReporting - committedUsd - actualPaidUsd` when allocation is USD; else **null / provisional** |
| Transaction currency | PO/invoice/payment `currency` fields |
| USD reporting | Manual rates on payment; optional manual rate at post for non-USD commitment |

**Explicit non-goals:** treating unposted invoices as committed; treating posted unpaid invoices as fully paid actual; automatic FX feeds; revaluation.

---

## 2. Invariants enforced

1. Payment rejected if invoice not posted (`409`).
2. Payment amount cannot exceed outstanding balance.
3. Idempotency key on payments — duplicate payload returns same result without duplicate ledger rows.
4. One `ACTUAL_PAYMENT` budget transaction per payment (`invoicePaymentId` unique).
5. One commitment transaction per post (re-post blocked when already posted).
6. FX rate required and validated for non-USD payments; USD payments use rate `1`.

---

## 3. Scenario matrix

| Scenario | Expected behavior | Automated |
|---|---|---|
| Single USD invoice, post, partial pay | committedUsd = invoice; actualPaidUsd = paid; remainingUsd = alloc − committed − actual | `wave2-finance.test.ts` |
| Post before pay | Pay without post → 409 | `wave2-finance.test.ts` |
| EUR invoice + manual post rate + pay FX | `paidTotalUsd` = amount × payment rate | `wave2-finance.test.ts` |
| Multiple invoices on one PO | Each post adds separate commitment | Covered by service design; extend E2E if needed |
| Fully paid invoice | outstanding 0; status paid | Existing invoice tests + manual |
| Unpaid posted invoice | committed set; actualPaidUsd 0 | Logic in `budget.service.ts` |
| Repeated payment request | Idempotent | `finance-and-concurrency.test.ts` |
| Financial year boundary | Not redefined in Wave 2 | **Manual / client** |

---

## 4. Test commands

From repository root (API test DB via embedded Postgres helper):

```text
cd apps/api
npm run typecheck
npm run lint
npm run build
npm test -- tests/http/wave2-finance.test.ts
npm test -- tests/integration/finance-and-concurrency.test.ts
npm test -- tests/http/procurement-flow.test.ts
```

Web:

```text
cd apps/web
npm run typecheck
npm run lint
```

Record pass/fail timestamps in CI or local run logs when signing off.

---

## 5. Provisional / not verified

- Committed USD for non-USD invoices without post-time manual rate
- Remaining budget when allocation currency ≠ USD
- Invoice cancellation / reversal / credit notes
- Global search budget rollup (legacy fields)
- Official finance sign-off workflow before payment (D05 open)

Do **not** remove `BudgetProvisionalNotice` until client approves formulas for the above.

---

## 6. Audit trail

- Budget transactions store type, amount, currency, optional `amountUsdReporting`, links to invoice/payment
- Invoice `postedAt`, payment `paidAt`, stored FX fields support reconstruction
- RBAC: `invoices.manage` for post and pay; budget views under existing permissions
