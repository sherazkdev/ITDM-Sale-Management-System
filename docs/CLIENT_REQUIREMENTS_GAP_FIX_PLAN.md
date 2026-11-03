# Client Requirements — Gap Fix Plan (Post-Audit)

**Date:** 2026-10-31  
**Companion:** `docs/CLIENT_REQUIREMENTS_VS_ACTUAL_BACKEND_AUDIT.md`  
**Scope:** Remediation planning only — **no code changes applied in the audit run.**

Priority: **P0** = blocks client acceptance / data integrity | **P1** = major PDF capability gap | **P2** = polish, ops, or depends on decision

---

## GAP-001 — Official PDF/XLSX outputs (R10)

| Field | Detail |
|---|---|
| Issue | Client requires organization-specific PO, contract, issue/return, invoice, expenditure, budget, and asset reports as **PDF/Excel**. Backend exposes JSON/CSV only; PDF/XLSX return `403 POLICY_NOT_APPROVED`. |
| PDF | BO pp2–3 (document/report requirements); DB p4 (controlled templates) |
| Files | `apps/api/src/modules/reports/report.service.ts` (`assertFormatAllowed`); `apps/api/src/modules/documents/document.service.ts` (`generateMovementDocument`) |
| Root cause | **D12** — templates not supplied/approved |
| Proposed fix | After client delivers templates: implement renderers (e.g. PDFKit/ExcelJS), wire report routes, version templates in `document_templates` table |
| Tests | Golden-file comparison per template; permission tests |
| Client approval | **Yes (D12)** |
| Depends on | Template assets, numbering rules **D15** |
| Priority | **P0** (compliance) |

---

## GAP-002 — PO approval / lifecycle workflow (R04, R08)

| Field | Detail |
|---|---|
| Issue | Client expects PO lifecycle (draft/approved/received/cancelled) and approval authority. `submit`/`approve`/`cancel` exist but always throw `POLICY_NOT_APPROVED`. |
| PDF | BO p1 (procurement); DB p4 (PO status field without workflow rules) |
| Files | `purchase-order.service.ts` (`assertWorkflowBlocked`); `purchase-order.controller.ts`; routes `POST .../submit|approve|cancel` |
| Root cause | **D03** |
| Proposed fix | Implement state machine per approved policy; side effects on budget commit per **D06/D07** |
| Tests | State transition matrix; negative transitions; audit entries |
| Client approval | **Yes (D03, D06, D07)** |
| Priority | **P0** |

---

## GAP-003 — PO expiry reminders (R04)

| Field | Detail |
|---|---|
| Issue | Client expects PO expiry alerts. No PO expiry column; expiry job explicitly skips PO (`poNotificationsBlocked: D04`). |
| PDF | BO p1 (renewals/expiry alerts); DB — no PO expiry on `purchase_orders` |
| Files | `notification.service.ts`; `schema.prisma` (`PurchaseOrder`) |
| Root cause | **D04** |
| Proposed fix | Add approved expiry field + migration; extend expiry job |
| Tests | Job creates deduped notifications; no false positives |
| Client approval | **Yes (D04, D14)** |
| Priority | **P1** |

---

## GAP-004 — Budget committed / actual / utilized semantics (R08)

| Field | Detail |
|---|---|
| Issue | Client wants allocated, **committed**, **actual**, **utilized**, **remaining** by year/PO/contract/vendor/category. API provides manual ledger append + `remainingProvisional = allocated - ledgerTotal` only. No auto-commit from PO/invoice. No reports by vendor/contract except manual ledger links. |
| PDF | BO p1; DB p3–4 (`budget_transactions.transaction_type`) |
| Files | `budget.service.ts`; `budget.routes.ts` (no `/budgets/by-po`, `/by-vendor`); `report.service.ts` (limited CSV columns) |
| Root cause | **D06, D07, D08** |
| Proposed fix | Define enums + aggregation service after policy sign-off; optional auto-posting hooks from approved PO/invoice events |
| Tests | Double-count prevention; fiscal year boundaries **D23** |
| Client approval | **Yes** |
| Priority | **P0** |

---

## GAP-005 — Quantity-based / consumable inventory (R03)

| Field | Detail |
|---|---|
| Issue | BO describes quantity-based inventory alongside unique asset codes. Implementation is **serialized assets only**; PO line `quantity` does not drive stock levels or bulk issuance. |
| PDF | BO p1, p3; DB p1, p4 |
| Files | `schema.prisma` (`Asset`, `PurchaseOrderLine`); no `stock_items` |
| Root cause | **D09** — unresolved product model |
| Proposed fix | If approved: stock ledger tables + APIs; else document scope as serialized-only |
| Tests | Quantity allocate/deallocate; no duplicate assignment |
| Client approval | **Yes (D09)** |
| Priority | **P1** |

---

## GAP-006 — Issue/return to departments (R07)

| Field | Detail |
|---|---|
| Issue | Client: issue/return to employees **or departments**. `AssetMovementDocument.employeeId` only; no department holder. |
| PDF | BO p1, p3; DB `asset_transactions.employee_id` |
| Files | `asset-movement.service.ts`; `schema.prisma` |
| Root cause | **D10** |
| Proposed fix | Optional `department_id` or holder type enum after approval |
| Tests | Issue to dept; return validation |
| Client approval | **Yes (D10)** |
| Priority | **P1** |

---

## GAP-007 — Document attachments linked to business records (R04, R19)

| Field | Detail |
|---|---|
| Issue | Upload API accepts `ownerType`/`ownerId` but **does not persist FK** on `stored_documents`. Attachments not returned in PO global search. Legacy `document_path` on PO/contract not integrated with upload service. |
| PDF | BO p1 (attachments); DB p2 (`document_path`); DB p4 (generated doc references) |
| Files | `document.service.ts` (`upload`); `search.service.ts`; `schema.prisma` (`StoredDocument`) |
| Root cause | Incomplete P14 model (proposed `document_generations` not migrated) |
| Proposed fix | Add `document_links` table (owner_type, owner_id, stored_document_id); enforce owner existence; include in search hub |
| Tests | Upload → search PO shows documents; unauthorized download denied |
| Client approval | Partial — file policy **D13** |
| Priority | **P1** |

---

## GAP-008 — Global search completeness (R09)

| Field | Detail |
|---|---|
| Issue | PO search returns PO graph, movements, maintenance (by PO assets), licenses — **not** stored attachments, budget summaries by vendor/contract/year, or all maintenance tied to PO via contract. Caps (`take: 100/50`) may truncate large POs. |
| PDF | BO p2 (PO-number retrieval of linked records) |
| Files | `search.service.ts` |
| Root cause | Partial implementation + missing document links |
| Proposed fix | Extend hub per signed checklist from client; pagination; include document links (GAP-007) |
| Tests | Fixture PO with all entity types; assert completeness |
| Client approval | Clarify exact entity list with client |
| Priority | **P1** |

---

## GAP-009 — License renewal workflow (R06)

| Field | Detail |
|---|---|
| Issue | `POST /software-licenses/:id/renew` returns `403 POLICY_NOT_APPROVED`. CRUD + expiry filter exist. |
| PDF | BO p1 (subscription renewal) |
| Files | `license.service.ts` (`renewBlocked`); `license.controller.ts` |
| Root cause | Policy not approved (renewal side effects) |
| Proposed fix | Implement renewal per client process after **D21** secrets policy |
| Tests | Renew extends expiry; audit; no secret leakage |
| Client approval | **Yes** |
| Priority | **P2** |

---

## GAP-010 — Approved RBAC matrix & user administration (R11)

| Field | Detail |
|---|---|
| Issue | Permissions are DB-driven but **no HTTP user/role admin APIs** (`users.manage` unused in routes). Seed role is PROPOSED (**D01**). Financial fields hidden unless `assets.manage` (proxy, not finance role). |
| PDF | BO p3 |
| Files | `permissions.ts`; missing `users` module routes; `asset.controller.ts` (`canViewFinancials`) |
| Root cause | **D01, D02, D22** |
| Proposed fix | User provisioning APIs; map approved roles; dedicated `assets.financials.read` if needed |
| Tests | Matrix per role; financial field isolation |
| Client approval | **Yes** |
| Priority | **P0** (production auth) |

---

## GAP-011 — Missing report endpoints (R10 partial)

| Field | Detail |
|---|---|
| Issue | Only `GET /reports/asset-register` and `/reports/budget-utilization`. No PO, contract, invoice, expenditure reports proposed in phase kit. |
| PDF | BO p2–3 |
| Files | `report.routes.ts`, `report.service.ts` |
| Root cause | Scope + **D12** |
| Proposed fix | Add report services after templates/policy |
| Tests | CSV row counts match DB |
| Client approval | **Yes (D12)** |
| Priority | **P1** |

---

## GAP-012 — Budget module test coverage (verification gap)

| Field | Detail |
|---|---|
| Issue | Budget APIs exist but **no automated HTTP tests**; financial calculations UNVERIFIED at runtime in CI. |
| PDF | R08 |
| Files | `apps/api/tests/` (no budget tests) |
| Root cause | Test gap, not necessarily logic bug |
| Proposed fix | Add `budget-workflow.test.ts`: year → allocation → ledger → summary |
| Tests | New integration file |
| Client approval | No |
| Priority | **P1** |

---

## GAP-013 — Restore drill & production ops (R12, R01)

| Field | Detail |
|---|---|
| Issue | `scripts/backup-db.mjs` only; no executed restore drill; no production LAN deployment in repo. |
| PDF | BO p3, p7–8 |
| Files | `scripts/backup-db.mjs`; Docker compose dev |
| Root cause | **D17** |
| Proposed fix | Documented restore runbook + automated smoke on throwaway DB |
| Tests | Restore + migrate + health ready |
| Client approval | **Yes (D17)** |
| Priority | **P0** (go-live) |

---

## GAP-014 — Invoice payment listing & credit notes (R05)

| Field | Detail |
|---|---|
| Issue | Payments recorded via POST; balance computed. No `GET /invoices/:id/payments`; no credit note / reversal model in schema. |
| PDF | BO p1; DB p2 (status only) |
| Files | `invoice.routes.ts`, `invoice.service.ts` |
| Root cause | **D05** partial extension |
| Proposed fix | Payment history endpoint; credit entries if approved |
| Tests | Partial pay sequence; idempotency (existing tests) |
| Client approval | **Yes (D05)** |
| Priority | **P2** |

---

## GAP-015 — Contract renewal endpoint (R04/R06)

| Field | Detail |
|---|---|
| Issue | Contract CRUD + expiry filter on list; no dedicated renewal workflow endpoint (phase kit optional). |
| PDF | BO p1 (renewals) |
| Files | `contract.service.ts` |
| Root cause | Policy / scope |
| Proposed fix | Align with client renewal process when defined |
| Client approval | **Yes** |
| Priority | **P2** |

---

## Implementation sequencing (recommended)

1. **Client decision workshop** — D01, D03, D05–D08, D12, D17 (blocks most P0).  
2. **Technical without policy** — GAP-007 document links, GAP-012 budget tests, GAP-008 search pagination.  
3. **Policy-gated features** — GAP-002, GAP-004, GAP-001, GAP-003.  
4. **Model expansions** — GAP-005, GAP-006 after D09/D10.  
5. **Ops** — GAP-013 before production sign-off.

---

## Explicit non-actions (audit run)

- No business policy invented.  
- No changes to PO workflow, budget semantics, or PDF renderers during audit.  
- No production database access.
