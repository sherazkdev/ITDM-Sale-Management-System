# Client Requirements — Remediation Report

**Date:** 2026-10-31  
**Baseline:** 30/30 tests PASS before remediation  
**Post-remediation:** `npm run typecheck`, `npm run lint`, **34/34 tests PASS** (15 files), migration `20261031144500_document_links_po_valid_until` applied  

## Step 1 — Gap categorization (GAP-001 … GAP-015)

| Gap | Category | Action taken |
|---|---|---|
| GAP-001 Official PDF/XLSX | Unresolved policy **D12** + safe infrastructure | **PARTIAL** — non-official placeholder PDF/XLSX with `X-ITDMS-Export-Disclaimer: NON-OFFICIAL-D12` |
| GAP-002 PO workflow | Unresolved policy **D03** | **BLOCKED** — no change |
| GAP-003 PO expiry | Policy **D04** + infrastructure | **PARTIAL** — `purchase_orders.valid_until` + job notifications when set |
| GAP-004 Budget semantics | Policy **D06–D08** | **PARTIAL** — `by-po` / `by-vendor` ledger APIs; summary unchanged semantics |
| GAP-005 Quantity inventory | Policy **D09** | **BLOCKED** — no stock ledger |
| GAP-006 Department issuance | Policy **D10** | **BLOCKED** — no schema change |
| GAP-007 Document links | Missing functionality | **FIXED** — `document_links` + owner validation |
| GAP-008 Global search | Missing functionality | **PARTIAL/FIXED** — documents, invoice financials, budget rollup, expiry dates, higher caps |
| GAP-009 License renew | Policy | **BLOCKED** — still 403 |
| GAP-010 User admin | Missing functionality | **PARTIAL** — `/users` CRUD + roles (seed matrix still **D01**) |
| GAP-011 Report endpoints | Missing functionality | **PARTIAL** — PO/contract/invoice reports + export formats |
| GAP-012 Budget tests | Verification gap | **FIXED** — `gap-remediation.test.ts` |
| GAP-013 Restore drill | Operational **D17** | **PARTIAL** — `scripts/restore-verify.mjs` runbook helper |
| GAP-014 Payment list | Missing API | **FIXED** — `GET /invoices/:id/payments` |
| GAP-015 Contract renewal | Policy / optional | **BLOCKED** — no new endpoint |

## Per-gap detail

### GAP-007 — FIXED

| | |
|---|---|
| **Requirement** | BO p1 attachments; DB p4 document references |
| **Root cause** | Upload stored file only in audit metadata |
| **Code** | `document.service.ts`, `shared/documents/document-owner.ts`, `schema.prisma` `DocumentLink` |
| **DB** | Migration `20261031144500_document_links_po_valid_until` |
| **API** | Upload creates link; download requires link |
| **Tests** | `gap-remediation.test.ts` (search shows documents) |
| **Limitation** | Credit notes / template generations still absent |

### GAP-008 — PARTIAL (material improvement)

| | |
|---|---|
| **Requirement** | BO p2 PO global search bundle |
| **Changes** | `search.service.ts` — `supportingDocuments`, `invoiceFinancials`, `budget`, `expiryDates`, caps 500/200 |
| **Tests** | `gap-remediation.test.ts` |
| **Limitation** | Budget “utilized/committed/actual” not defined until **D06/D07** |

### GAP-003 — PARTIAL

| | |
|---|---|
| **Changes** | `validUntil` on PO create/update; `notification.service.ts` `PO_VALID_UNTIL` events |
| **Limitation** | Semantics **PROPOSED D04**; POs without `valid_until` still no alert |

### GAP-001 / GAP-011 — PARTIAL

| | |
|---|---|
| **Changes** | `shared/export/tabular-export.ts`, `report.service.ts` routes: `/reports/purchase-orders`, `/contracts`, `/invoices`; PDF/XLSX placeholder exports |
| **Tests** | PDF header assertion in `gap-remediation.test.ts`, updated `extended-modules.test.ts` |
| **Limitation** | **Not organizational template compliance (D12)** |

### GAP-004 — PARTIAL

| | |
|---|---|
| **Changes** | `GET /budgets/by-po/:id`, `GET /budgets/by-vendor/:id`; budget workflow test |
| **Limitation** | No auto-commit; `remainingProvisional` only |

### GAP-010 — PARTIAL

| | |
|---|---|
| **Changes** | `modules/users/*`, routes `/api/v1/users`, `/users/roles`; permission `assets.financials.read` + broader financial view on assets |
| **Limitation** | **D01** role matrix not client-approved |

### GAP-014 — FIXED

| | |
|---|---|
| **Changes** | `InvoiceService.listPayments`, `GET /invoices/:id/payments` |
| **Tests** | `gap-remediation.test.ts` |

### GAP-012 — FIXED

| | |
|---|---|
| **Tests** | Full budget HTTP path in `gap-remediation.test.ts` |

### GAP-013 — PARTIAL

| | |
|---|---|
| **Changes** | `scripts/restore-verify.mjs` |
| **Limitation** | No automated restore in CI; **D17** sign-off pending |

### Remaining BLOCKED (unchanged)

GAP-002, GAP-005, GAP-006, GAP-009, GAP-015 — require client decisions before final behavior.

## Verification commands (evidence)

```text
npm run typecheck  → PASS
npm run lint       → PASS
npm run test       → 34/34 PASS (15 files)
npx prisma migrate deploy → 4 migrations applied (dev/test DB)
```

## Readiness statement

The backend is **more aligned** with PDF operational needs (search, attachments, exports infrastructure, budget/search tests, user admin scaffolding) but **does not achieve full PDF compliance** for official templates, PO workflow, finance semantics, consumable inventory, or production DR sign-off.

Frontend may integrate expanded APIs with explicit UX disclaimers on exports and budget figures.

See **`docs/BACKEND_FINAL_ACCEPTANCE_MATRIX.md`** for GAP status summary and API inventory.
