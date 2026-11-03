# P17 — Audit Trail, Security Hardening & Backup/Restore

> **Status:** NOT_STARTED  
> **Dependencies:** cross-cutting P01–P16; P03 security foundation  
> **Requirement basis:** BO p3 (audit, RBAC, backups, recovery)  
> **Scope:** BACKEND ONLY. No UI/dashboard implementation.

## Outcome and boundaries
- Consolidate structured activity auditing for create/edit/delete, issuance/return, money, role changes and document access.
- Security review across all routes and data flows; data backup, restore and disaster recovery runbook.
- This phase HARDENS controls initially introduced in P01/P03 and on every important mutation — audit must not be postponed until now.

## Entities and persistence
- PROPOSED `audit_logs`: actor user ID, request ID, occurredAt, action, resourceType, resourceID, safe before/after, result/outcome, optional source IP; retention policy.
- Backup artifacts outside DB: encrypted dump, attachments manifest, versioned migration and restoration metadata; avoid storing credentials in backup documentation.

## Application services and use cases
- `AuditService.record` invoked transactionally for business-critical changes where consistency matters; query only for auditor permissions.
- Backup automation via approved Postgres-native tool and secure file snapshot, encrypted remote/offsite secondary storage per on-prem policy; restore to isolated test instance and validate row counts/FKs/seed workflows.
- Security hardening: auth bypass/IDOR tests, CSRF if cookies, brute-force protection, API rate limits, secure file access, response redaction, web CORS rules, dependency audit, structured log scrubbing.

## Business rules and important edge cases
- Never log plain passwords, tokens, software secrets, unredacted contract files or sensitive personally identifying content.
- Audits record corrections without overwriting prior events; restricted deletion and tamper detection per policy.
- Backups are not complete without tested **restore**. Define RPO/RTO, retention, encryption and key custody with IT owner.
- Deployment must ensure DB and API are not exposed to internet just because host has network access.

## Proposed REST API contract
- `GET /api/v1/audit-events` (strict `audit.read` and filters), `GET /api/v1/audit-events/:id`.
- Backup/restore operational scripts (CLI), not general exposed HTTP endpoint. Health endpoints don't leak backup credentials.

All endpoints are provisional until the schema/permission decisions are resolved. Use versioned `/api/v1` routes; controllers parse inputs and delegate to services; repositories only access persistence. Use the standard response/error contract from `reference/API_AND_ERROR_CONVENTIONS.md`.

## Tests / verification checklist
- Audit event exists for every representative mutation incl failed security-sensitive attempts as policy requires.
- Unauthorized read/export, IDOR, file access, CSRF, rate-limit and token replay checks.
- Encrypted backup created; isolated restore executed with evidence; tests of indexes, FKs, records, attachment path references and sample summaries.

## Deliverables / exit gate
- Auditable API and admin read permissions, threat checklist, backup/restore scripts/runbook, verified drill logs, remediation list.
- R11/R12 evidenced, except org-specific retention/DR acceptance pending owner signoff.

## Open decisions and explicit non-assumptions
D01, D13, D16, D17, D21–D23; backup schedule/RPO/RTO and offsite permissions MUST be approved before production.

## Cursor execution instructions
1. Read `requirements/README.md`, `reference/SOURCE_TRACEABILITY.md`, `reference/DECISION_REGISTER.md`, `reference/ENGINEERING_STANDARDS.md`, and relevant preceding completed phase reports before coding.
2. Inspect the real repo first. Reuse existing code; implement only what this phase needs. If prerequisites are incomplete, stop and report.
3. Write failing tests for core business invariants where practical, implement, run tests, fix; do not hide failures.
4. Run actual format/lint/typecheck/tests and migration checks as relevant. Never claim a command passed unless its output confirms it.
5. Update `requirements/IMPLEMENTATION_STATUS.md` only with verified evidence. Log blockers and source-related decisions in `reference/DECISION_REGISTER.md`.
6. Stop at this phase's gate; **do not** implement the next phase without a new explicit continuation.
