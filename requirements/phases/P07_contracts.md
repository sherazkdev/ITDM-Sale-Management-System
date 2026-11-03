# P07 — Contracts, Expiry & Renewal Records

> **Status:** NOT_STARTED  
> **Dependencies:** P05  
> **Requirement basis:** BO p1; DB pp2,4  
> **Scope:** BACKEND ONLY. No UI/dashboard implementation.

## Outcome and boundaries
- Implement vendor-linked independent contracts, contract dates/value/status and related-PO view.
- Explicitly record reminders capability for P16 without triggering undefined expiry policy now.
- Track document metadata references; secure document upload/generation implemented P14.

## Entities and persistence
- `contracts`: contract_id, unique contract_number, vendor_id FK, start_date, expiry_date, contract_value, renewal_status, document_path.
- Existing contract may have zero or many POs; PO relation optional, no forced single PO.
- Renewals as editing same record vs new linked contract version must be approved (D03/D15 style).

## Application services and use cases
- `ContractService.create/update/get/list/findExpiring/renewOrClose` (renew workflow gated), repository findByVendor/expiryRange/withRelatedPOs.
- Use controlled contract status and renewal lifecycle after approval; dates and values validated; placeholder document_path never built from arbitrary user path.

## Business rules and important edge cases
- Reject expiry before start; consider whether same-day acceptable; date-only vs timezone semantics D23.
- Linked contract cannot be hard-deleted; contract vendor must match a linked PO vendor unless exception approved.
- Unapproved renewal must not overwrite legal history or previous document; use audit/revision policy.

## Proposed REST API contract
- `POST /api/v1/contracts`, `GET /api/v1/contracts`, `GET /api/v1/contracts/:id`, `PATCH /api/v1/contracts/:id`, `GET /api/v1/contracts/:id/purchase-orders`, `GET /api/v1/contracts/expiring?before=...` (subject to permissions).
- `POST /api/v1/contracts/:id/renew` only after renewal semantics approved.

All endpoints are provisional until the schema/permission decisions are resolved. Use versioned `/api/v1` routes; controllers parse inputs and delegate to services; repositories only access persistence. Use the standard response/error contract from `reference/API_AND_ERROR_CONVENTIONS.md`.

## Tests / verification checklist
- Unique contract number, date validation, vendor link, multiple POs per contract, unauthorized contract-value read, expired contract query at timezone boundary, audit updates.

## Deliverables / exit gate
- Contract API complete with linked lookup and truthful note about pending document uploads / renewal workflow if blocked.
- Provide test fixtures for P08 and P16.

## Open decisions and explicit non-assumptions
D15 number format; renewal means modify vs new history; D14 alert timing later, file templates D12/D13 later.

## Cursor execution instructions
1. Read `requirements/README.md`, `reference/SOURCE_TRACEABILITY.md`, `reference/DECISION_REGISTER.md`, `reference/ENGINEERING_STANDARDS.md`, and relevant preceding completed phase reports before coding.
2. Inspect the real repo first. Reuse existing code; implement only what this phase needs. If prerequisites are incomplete, stop and report.
3. Write failing tests for core business invariants where practical, implement, run tests, fix; do not hide failures.
4. Run actual format/lint/typecheck/tests and migration checks as relevant. Never claim a command passed unless its output confirms it.
5. Update `requirements/IMPLEMENTATION_STATUS.md` only with verified evidence. Log blockers and source-related decisions in `reference/DECISION_REGISTER.md`.
6. Stop at this phase's gate; **do not** implement the next phase without a new explicit continuation.
