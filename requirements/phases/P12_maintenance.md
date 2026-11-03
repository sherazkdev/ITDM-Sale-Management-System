# P12 — IT Equipment Maintenance & Repair Lifecycle

> **Status:** NOT_STARTED  
> **Dependencies:** P06, P07, P05  
> **Requirement basis:** BO p1; DB p3  
> **Scope:** BACKEND ONLY. No UI/dashboard implementation.

## Outcome and boundaries
- Track maintenance requests, repair progress, completion, costs, vendors and applicable maintenance contract links.
- Asset maintenance history integrates into global PO/asset view and may influence asset availability.

## Entities and persistence
- `maintenance_records`: maintenance_id, optional asset_id, contract_id, vendor_id, maintenance_type, request_date, completion_date, cost, status, remarks.
- Clarify whether software-only contract maintenance may omit asset; at least one meaningful reference/description should exist by approved validation rule.

## Application services and use cases
- `MaintenanceService.create/assignVendor/start/complete/cancel/listByAsset`, repository vendor/contract/asset joins.
- Update asset availability only if approved state policy; verify consistent current holder/issue status and repair status (no silent return).
- Track costs as maintenance records, but do not automatically book budget until owner defines expense source and D06-D07.

## Business rules and important edge cases
- Completion cannot precede request; status transitions permitted by signed policy; nonnegative cost.
- Vendor/contract relationship validation and disabled vendor handling; repair of lost/retired item policy unresolved.
- No expensive mass cascading changes to asset issuance on maintenance creation.

## Proposed REST API contract
- `POST /api/v1/maintenance-records`, `GET /api/v1/maintenance-records`, `GET /api/v1/maintenance-records/:id`, `PATCH /api/v1/maintenance-records/:id`, `POST /api/v1/maintenance-records/:id/complete` (if approved), `GET /api/v1/assets/:id/maintenance`.

All endpoints are provisional until the schema/permission decisions are resolved. Use versioned `/api/v1` routes; controllers parse inputs and delegate to services; repositories only access persistence. Use the standard response/error contract from `reference/API_AND_ERROR_CONVENTIONS.md`.

## Tests / verification checklist
- Full maintenance lifecycle, invalid dates, optional FK combinations, asset status interaction, permission tests, lookup by PO via linked asset and vendor.

## Deliverables / exit gate
- Maintenance APIs with historical tracking, linked reads, validation and audit. Provide report-ready view.
- Explicitly flag any unapproved asset state and cost posting behavior.

## Open decisions and explicit non-assumptions
D11 asset state while maintenance, D19 SLA/cost approvals, D07 whether maintenance impacts budgets.

## Cursor execution instructions
1. Read `requirements/README.md`, `reference/SOURCE_TRACEABILITY.md`, `reference/DECISION_REGISTER.md`, `reference/ENGINEERING_STANDARDS.md`, and relevant preceding completed phase reports before coding.
2. Inspect the real repo first. Reuse existing code; implement only what this phase needs. If prerequisites are incomplete, stop and report.
3. Write failing tests for core business invariants where practical, implement, run tests, fix; do not hide failures.
4. Run actual format/lint/typecheck/tests and migration checks as relevant. Never claim a command passed unless its output confirms it.
5. Update `requirements/IMPLEMENTATION_STATUS.md` only with verified evidence. Log blockers and source-related decisions in `reference/DECISION_REGISTER.md`.
6. Stop at this phase's gate; **do not** implement the next phase without a new explicit continuation.
