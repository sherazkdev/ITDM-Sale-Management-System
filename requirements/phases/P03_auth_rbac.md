# P03 — Authentication, Session Management & Role-Based Access

> **Status:** NOT_STARTED  
> **Dependencies:** P02  
> **Requirement basis:** BO p3 (secure user auth, roles, sensitive financial access); roles/strategy PROPOSED  
> **Scope:** BACKEND ONLY. No UI/dashboard implementation.

## Outcome and boundaries
- Implement chosen auth strategy (approved local accounts/session or organization SSO). API-only user management and session lifecycle.
- Define auth users separately from employee HR records; provision/revoke accounts according to policy.
- Fine-grained permissions enforced server-side and audited for security events; deny by default.

## Entities and persistence
- Proposed `users`, `roles`, `permissions`, `user_roles`, `role_permissions`, `sessions`, password reset/attempt records if applicable.
- Secret hashes/tokens never exposed; enforce user active/locked state and session revocation on password change/deactivation.
- Confirm whether employee ↔ user relation exists and is optional.

## Application services and use cases
- `AuthService.login/logout/me/revokeSessions`, `UserService.create/deactivate/changeRoles`, `PermissionService.authorize`.
- Implement password hashing using established audited primitive or SSO, secure session cookies with httpOnly/secure/sameSite, CSRF protection for cookie mutations, rate limits on sensitive endpoints, safe reset workflow if approved.
- Add `requireAuth`, `requirePermission` and owner/resource checks reusable by later modules.

## Business rules and important edge cases
- Do not assume IT_ADMIN and SOFTWARE_MANAGER permissions; approve matrix D01 and account method D02.
- No privilege escalation through mass assignment or user-supplied `roleIds`; ability to alter role requires explicit permission.
- Authentication failures use non-enumerating messages; no raw credentials in logs.
- Rotate/revoke on compromise and test logout on disabled account.

## Proposed REST API contract
PROPOSED:
- `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`, `POST /api/v1/auth/refresh` (only if refresh strategy selected).
- `GET /api/v1/users`, `POST /api/v1/users`, `PATCH /api/v1/users/:id`, `POST /api/v1/users/:id/deactivate`, `PUT /api/v1/users/:id/roles`.
- `GET /api/v1/roles`, `GET /api/v1/permissions`; mutation endpoints admin-only by approved permission matrix.

All endpoints are provisional until the schema/permission decisions are resolved. Use versioned `/api/v1` routes; controllers parse inputs and delegate to services; repositories only access persistence. Use the standard response/error contract from `reference/API_AND_ERROR_CONVENTIONS.md`.

## Tests / verification checklist
- Valid/invalid login, locked/disabled accounts, throttling, CSRF, missing/expired/revoked session.
- Role downgrade immediately effective according to policy; unrelated role denied by both endpoint and service.
- IDOR tests, refresh replay prevention if tokens used, simultaneous logouts; sanitized auth logs.

## Deliverables / exit gate
- Authn/authz tests pass; OpenAPI examples and permission registry; audit record of account changes and logins per policy.
- Gate: approved roles and account strategy from D01/D02/D22. No fake default admin credentials in production.

## Open decisions and explicit non-assumptions
D01, D02 and D22 BLOCK final auth. Safe library scaffolding may proceed without hardcoded organization account policy.

## Cursor execution instructions
1. Read `requirements/README.md`, `reference/SOURCE_TRACEABILITY.md`, `reference/DECISION_REGISTER.md`, `reference/ENGINEERING_STANDARDS.md`, and relevant preceding completed phase reports before coding.
2. Inspect the real repo first. Reuse existing code; implement only what this phase needs. If prerequisites are incomplete, stop and report.
3. Write failing tests for core business invariants where practical, implement, run tests, fix; do not hide failures.
4. Run actual format/lint/typecheck/tests and migration checks as relevant. Never claim a command passed unless its output confirms it.
5. Update `requirements/IMPLEMENTATION_STATUS.md` only with verified evidence. Log blockers and source-related decisions in `reference/DECISION_REGISTER.md`.
6. Stop at this phase's gate; **do not** implement the next phase without a new explicit continuation.
