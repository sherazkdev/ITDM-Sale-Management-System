# P05 — Vendor Records & Procurement Partners

> **Status:** NOT_STARTED  
> **Dependencies:** P03  
> **Requirement basis:** BO p1; DB pp1–2 vendors  
> **Scope:** BACKEND ONLY. No UI/dashboard implementation.

## Outcome and boundaries
- Vendor contact directory for purchase orders, contracts, maintenance and licenses; no destructive delete of referenced vendors.
- Search and filter vendors, show linked-summary counts after downstream phases.

## Entities and persistence
- Source: vendor_id, vendor_name, registration_number, contact_person, phone, email, address.
- Registration_number unique constraint only if business approves; optional active status proposed with migration approval.

## Application services and use cases
- `VendorService.create/update/list/get/archive`, repository getWithRelationCounts and duplicate matching.
- Define vendor archive semantics: do not hide historical purchases, invoices or maintenance, cannot reassign vendor FK silently.

## Business rules and important edge cases
- Validate name/registration and optional contacts; handle duplicate policy explicitly.
- Prevent deleting vendor if it has contracts/POs unless policy approves archival; protect financial reports.

## Proposed REST API contract
- `POST /api/v1/vendors`, `GET /api/v1/vendors`, `GET /api/v1/vendors/:id`, `PATCH /api/v1/vendors/:id`, `POST /api/v1/vendors/:id/archive` (if approved).

All endpoints are provisional until the schema/permission decisions are resolved. Use versioned `/api/v1` routes; controllers parse inputs and delegate to services; repositories only access persistence. Use the standard response/error contract from `reference/API_AND_ERROR_CONVENTIONS.md`.

## Tests / verification checklist
- Vendor CRUD, registration duplicate according to approved rule, linked vendor not deleted, RBAC, paging/search, audit.

## Deliverables / exit gate
- Vendor master APIs tested and stable for P07/P08/P12/P13.
- Document vendor duplicate/merge policy and avoid accidental deduplication.

## Open decisions and explicit non-assumptions
D15 affects vendor registration uniqueness if organization has multiple branches; archive policy D16.

## Cursor execution instructions
1. Read `requirements/README.md`, `reference/SOURCE_TRACEABILITY.md`, `reference/DECISION_REGISTER.md`, `reference/ENGINEERING_STANDARDS.md`, and relevant preceding completed phase reports before coding.
2. Inspect the real repo first. Reuse existing code; implement only what this phase needs. If prerequisites are incomplete, stop and report.
3. Write failing tests for core business invariants where practical, implement, run tests, fix; do not hide failures.
4. Run actual format/lint/typecheck/tests and migration checks as relevant. Never claim a command passed unless its output confirms it.
5. Update `requirements/IMPLEMENTATION_STATUS.md` only with verified evidence. Log blockers and source-related decisions in `reference/DECISION_REGISTER.md`.
6. Stop at this phase's gate; **do not** implement the next phase without a new explicit continuation.
