# P04 — Employee Records & Department Information

> **Status:** NOT_STARTED  
> **Dependencies:** P03  
> **Requirement basis:** BO p1; DB p1 employees  
> **Scope:** BACKEND ONLY. No UI/dashboard implementation.

## Outcome and boundaries
- Manage employee master records and current active/inactive status. These records are separate from login users.
- Support data search/pagination/filters, employee detail including **authorized** asset assignment summary (link becomes rich after P09).

## Entities and persistence
- Source: employee_number unique, full_name, department, designation, contact_number, email, is_active.
- Optional department master table only after D18; retain source `department` semantics if not approved.
- Avoid storing credentials within employee records.

## Application services and use cases
- `EmployeeService.create/update/findById/list/deactivate`, repository existsByNumber, listPage, reference checks.
- Use validated normalization of email/contact/employee_number according to policy. Deactivate is not delete when referenced by asset movements; preserve history.
- Add service method for `isEligibleForAssignment` consumed by P09 (policy whether inactive employee can retain assigned assets must be explicit).

## Business rules and important edge cases
- Duplicate employee_number → 409 (DB constraint). Empty/invalid fields → 422. Referenced employee with movements cannot be hard-deleted.
- Do not silently switch email into login identifier; employee email may be missing/nonunique unless approved.
- Employee archived status vs assignments must be addressed if present.

## Proposed REST API contract
- `POST /api/v1/employees`, `GET /api/v1/employees`, `GET /api/v1/employees/:id`, `PATCH /api/v1/employees/:id`, `POST /api/v1/employees/:id/deactivate`, `GET /api/v1/employees/:id/assets` (links ready P09).

All endpoints are provisional until the schema/permission decisions are resolved. Use versioned `/api/v1` routes; controllers parse inputs and delegate to services; repositories only access persistence. Use the standard response/error contract from `reference/API_AND_ERROR_CONVENTIONS.md`.

## Tests / verification checklist
- Create/list/get/update/deactivate; duplicate employee number; pagination ordering; unauthorized role; invalid data; linked historical transactions retained.
- Check query returns no user/session secrets. Query plan for employee_number lookup.

## Deliverables / exit gate
- Authenticated employee CRUD plus API docs, unit/integration tests, minimum log & audit for create/edit/deactivation.
- Ensure P09 can reference employee ID without changing employee PK.

## Open decisions and explicit non-assumptions
D18 normalization optional; employee assigned asset deactivation behavior to confirm with owner.

## Cursor execution instructions
1. Read `requirements/README.md`, `reference/SOURCE_TRACEABILITY.md`, `reference/DECISION_REGISTER.md`, `reference/ENGINEERING_STANDARDS.md`, and relevant preceding completed phase reports before coding.
2. Inspect the real repo first. Reuse existing code; implement only what this phase needs. If prerequisites are incomplete, stop and report.
3. Write failing tests for core business invariants where practical, implement, run tests, fix; do not hide failures.
4. Run actual format/lint/typecheck/tests and migration checks as relevant. Never claim a command passed unless its output confirms it.
5. Update `requirements/IMPLEMENTATION_STATUS.md` only with verified evidence. Log blockers and source-related decisions in `reference/DECISION_REGISTER.md`.
6. Stop at this phase's gate; **do not** implement the next phase without a new explicit continuation.
