# P06 — Asset Categories & Physical Inventory

> **Status:** NOT_STARTED  
> **Dependencies:** P04, P05, P02  
> **Requirement basis:** BO pp1,3; DB pp1,4  
> **Scope:** BACKEND ONLY. No UI/dashboard implementation.

## Outcome and boundaries
- Implement asset category master, physical equipment registration, unique manually entered asset codes, equipment history read model.
- Support inventory status/location/serial and optional purchase-order provenance; quantity-based stock remains decision-gated.

## Entities and persistence
- `asset_categories`, `assets` source columns. Optional `purchase_order_line_id` FK depends on approved PO line schema; link `purchase_order_id` as source.
- Status enum/state machine proposed; category and asset stable IDs; optional asset condition/location movement policy.
- If bulk consumables required, model separate `stock_items` and stock movements after D09 rather than pretending each quantity is a serial asset.

## Application services and use cases
- `AssetService.register/get/list/updateMetadata/getHistory/retire` and `CategoryService.create/update/list`.
- State changes requiring issuance/return belong P09 service, not arbitrary PATCH status.
- Support filtering by code, category, status, current location, PO; optional serial and purchase cost authorized by permission.

## Business rules and important edge cases
- Asset code is supplied by authorized user: never silently generate code; unique index and normalization policy.
- Cannot assign issue status via PATCH directly; do not allow editing purchase references after financial posting without approved correction policy.
- Validate nonnegative purchase cost, reasonable date and category existence, no loss of historical asset transactions.
- Protect sensitive purchase costs in lists and exports according to D01.

## Proposed REST API contract
- `POST /api/v1/asset-categories`, `GET /api/v1/asset-categories`, `PATCH /api/v1/asset-categories/:id`.
- `POST /api/v1/assets`, `GET /api/v1/assets`, `GET /api/v1/assets/:id`, `PATCH /api/v1/assets/:id`, `GET /api/v1/assets/:id/history` (initially empty/linked, populated by P09/P12).
- `POST /api/v1/assets/:id/retire` only with approved transition policy.

All endpoints are provisional until the schema/permission decisions are resolved. Use versioned `/api/v1` routes; controllers parse inputs and delegate to services; repositories only access persistence. Use the standard response/error contract from `reference/API_AND_ERROR_CONVENTIONS.md`.

## Tests / verification checklist
- Duplicate asset code incl concurrent requests, optional serial duplicate semantics, category FK, referenced asset cannot hard-delete, unauthorized cost read.
- Test assigned status cannot be arbitrarily changed; purchase PO FK optional.
- Query performance for asset-code exact index.

## Deliverables / exit gate
- Categories/assets API, approved status rules, tests, docs and seeded samples with manually distinct codes.
- P09 consumes asset state/service for issuance; no partial implementation hidden as complete.

## Open decisions and explicit non-assumptions
D09 (bulk inventory quantities), D11 (state transitions), D16 (deletion) must be acknowledged; no assumptions about asset physical types.

## Cursor execution instructions
1. Read `requirements/README.md`, `reference/SOURCE_TRACEABILITY.md`, `reference/DECISION_REGISTER.md`, `reference/ENGINEERING_STANDARDS.md`, and relevant preceding completed phase reports before coding.
2. Inspect the real repo first. Reuse existing code; implement only what this phase needs. If prerequisites are incomplete, stop and report.
3. Write failing tests for core business invariants where practical, implement, run tests, fix; do not hide failures.
4. Run actual format/lint/typecheck/tests and migration checks as relevant. Never claim a command passed unless its output confirms it.
5. Update `requirements/IMPLEMENTATION_STATUS.md` only with verified evidence. Log blockers and source-related decisions in `reference/DECISION_REGISTER.md`.
6. Stop at this phase's gate; **do not** implement the next phase without a new explicit continuation.
