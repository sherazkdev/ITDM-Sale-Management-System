# P13 — Software Licensing, Subscriptions & Renewal History

> **Status:** NOT_STARTED  
> **Dependencies:** P05, P08  
> **Requirement basis:** BO p1; DB p3  
> **Scope:** BACKEND ONLY. No UI/dashboard implementation.

## Outcome and boundaries
- Register software licenses/subscriptions with vendor, optional PO, start/expiry, license quantities, renewal costs and status.
- Provide expiring license list and compliance-safe metadata without displaying raw license keys.

## Entities and persistence
- `software_licenses`: license_id, software_name, license_key_reference (secure pointer, not public key), optional vendor_id / purchase_order_id FKs, start_date, expiry_date, license_quantity, renewal_cost, status.
- Optional assignment seats table, renewals/version table only if client confirms; do not promise license seat allocation from base columns alone.

## Application services and use cases
- `LicenseService.create/update/list/get/findExpiring/renew`, optional assignment services after approval; repository vendor/PO joins.
- Keep actual license key in approved encrypted secret store only if required; otherwise save reference ID; never log secret.
- Renewal policy: new period vs mutation of existing row, history and quantity adjustments determined by owner. Reconcile renewal cost only if budgeting policy allows.

## Business rules and important edge cases
- quantity positive integer, expiry not before start, date/timezone, vendor/PO congruence.
- Permission field filtering for keys, costs, agreements and related documents; avoid exposing license_key_reference in general list when sensitive.
- No hardcoded alerts until P16 policy approved; `findExpiring` is read-only.

## Proposed REST API contract
- `POST /api/v1/software-licenses`, `GET /api/v1/software-licenses`, `GET /api/v1/software-licenses/:id`, `PATCH /api/v1/software-licenses/:id`, `GET /api/v1/software-licenses/expiring?before=...`, `POST /api/v1/software-licenses/:id/renew` when approved.

All endpoints are provisional until the schema/permission decisions are resolved. Use versioned `/api/v1` routes; controllers parse inputs and delegate to services; repositories only access persistence. Use the standard response/error contract from `reference/API_AND_ERROR_CONVENTIONS.md`.

## Tests / verification checklist
- Expiry boundary, update quantity, vendor/PO FK, no secret leakage in JSON/logs/errors, authorized vs unauthorized renewal, history preservation after renewal.

## Deliverables / exit gate
- Software register + expiry read model + business status tests; secure key-handling reviewed.
- Ready for notifications and linked PO search.

## Open decisions and explicit non-assumptions
D14 reminder lead time, D21 secret reference/encryption, software seat allocation scope, D08 currency and renewal financial posting.

## Cursor execution instructions
1. Read `requirements/README.md`, `reference/SOURCE_TRACEABILITY.md`, `reference/DECISION_REGISTER.md`, `reference/ENGINEERING_STANDARDS.md`, and relevant preceding completed phase reports before coding.
2. Inspect the real repo first. Reuse existing code; implement only what this phase needs. If prerequisites are incomplete, stop and report.
3. Write failing tests for core business invariants where practical, implement, run tests, fix; do not hide failures.
4. Run actual format/lint/typecheck/tests and migration checks as relevant. Never claim a command passed unless its output confirms it.
5. Update `requirements/IMPLEMENTATION_STATUS.md` only with verified evidence. Log blockers and source-related decisions in `reference/DECISION_REGISTER.md`.
6. Stop at this phase's gate; **do not** implement the next phase without a new explicit continuation.
