# P08 — Purchase Orders, Multiple Lines & State Machine

> **Status:** NOT_STARTED  
> **Dependencies:** P05, P07  
> **Requirement basis:** BO pp1–2; DB pp2,4  
> **Scope:** BACKEND ONLY. No UI/dashboard implementation.

## Outcome and boundaries
- Purchase order header and multiple products/services as line records; link vendor and optionally contract; support statuses under signed business workflow.
- PO search/detail must expose item lines and later invoices/assets/report references via relations.
- Plan approval/commitment hook for P11 but **do not** book budget against undefined business rules.

## Entities and persistence
- Source `purchase_orders`: unique po_number, vendor_id FK, nullable contract_id FK, po_date, total_amount, currency, status, document_path.
- **PROPOSED** `purchase_order_lines`: line_id, purchase_order_id, line_number, description, line_type, quantity, unit_cost, line_total, optional category/tax details only if approved.
- PO line amount aggregation vs manually entered header total reconciliation (tax, discounts, freight) is a business decision.

## Application services and use cases
- `PurchaseOrderService.createDraft/addLine/updateLine/removeLine/submit/approve/cancel/list/getWithRelations` with transition endpoints enabled only for approved states.
- `PurchaseOrderRepository.getWithLines`, `getByNumber`, vendor/contract joins; operate all lines in DB transaction for atomic creation/update.
- Prevent approved PO content mutation except audited amendment/revision policy; reserve budget hook for P11 once approved.

## Business rules and important edge cases
- Contract and PO vendors must match unless client policy supports exceptions; invalid vendor/contract FK yields clear 422/409.
- `total_amount` computed/validated according to approved tax/discount rule; no JS float.
- PO cancellation after invoices/assets/commitment is not generic delete; explicit reversal workflow and audit.
- Clarify PO 'expiry': source PO schema has no expiry column; D04 blocks reminders, not core PO CRUD.

## Proposed REST API contract
- `POST /api/v1/purchase-orders`, `GET /api/v1/purchase-orders`, `GET /api/v1/purchase-orders/:id`, `PATCH /api/v1/purchase-orders/:id` (draft metadata), `POST /api/v1/purchase-orders/:id/lines`, `PATCH /api/v1/purchase-orders/:id/lines/:lineId`, `DELETE /api/v1/purchase-orders/:id/lines/:lineId` (draft only).
- `POST /api/v1/purchase-orders/:id/submit|approve|cancel` only after D03 approval.
- `GET /api/v1/purchase-orders/by-number/:poNumber` (safe encoded search).

All endpoints are provisional until the schema/permission decisions are resolved. Use versioned `/api/v1` routes; controllers parse inputs and delegate to services; repositories only access persistence. Use the standard response/error contract from `reference/API_AND_ERROR_CONVENTIONS.md`.

## Tests / verification checklist
- Create with 3 lines and correct totals; invalid price/quantity; 1 contract to 2 POs; independent PO without contract.
- Draft-only line edits; concurrent updates of PO lines, DB transaction rollback, cancellation prevention when dependent records exist, authz and audit.
- Verify no premature budget posting before approved policy.

## Deliverables / exit gate
- Functional PO draft+line APIs and documented state machine (approved if D03 settled).
- OpenAPI and integration tests; P10 can link many invoices; P15 can search by PO number.

## Open decisions and explicit non-assumptions
D03 PO workflow, D04 PO expiry, D08 currency, D15 numbering, D16 delete/revision; approval-dependent actions blocked if unresolved.

## Cursor execution instructions
1. Read `requirements/README.md`, `reference/SOURCE_TRACEABILITY.md`, `reference/DECISION_REGISTER.md`, `reference/ENGINEERING_STANDARDS.md`, and relevant preceding completed phase reports before coding.
2. Inspect the real repo first. Reuse existing code; implement only what this phase needs. If prerequisites are incomplete, stop and report.
3. Write failing tests for core business invariants where practical, implement, run tests, fix; do not hide failures.
4. Run actual format/lint/typecheck/tests and migration checks as relevant. Never claim a command passed unless its output confirms it.
5. Update `requirements/IMPLEMENTATION_STATUS.md` only with verified evidence. Log blockers and source-related decisions in `reference/DECISION_REGISTER.md`.
6. Stop at this phase's gate; **do not** implement the next phase without a new explicit continuation.
