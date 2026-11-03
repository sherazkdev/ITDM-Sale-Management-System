# P16 — Contract, License & Purchase Order Expiry Notifications

> **Status:** NOT_STARTED  
> **Dependencies:** P07, P08, P13  
> **Requirement basis:** BO p1 mentions contract/PO expiry notifications; BO p1 software renewal tracking  
> **Scope:** BACKEND ONLY. No UI/dashboard implementation.

## Outcome and boundaries
- Durable in-app notification records and scheduler for expiry/renewal rules approved by business owner.
- Scan contracts, software licenses and POs only when PO expiry field/semantics defined; deduplicate reminders and support retry.
- Email channel optional only if explicitly approved and server can send internally.

## Entities and persistence
- PROPOSED `notification_events` (id, eventType, targetType, targetId, dueAt, status, recipient, dedupKey, createdAt, readAt) and `notification_attempts` for external channels.
- Trigger rules lead days, responsible roles/users, timezone, disabled/cancelled status handling require D14, D04, D23.

## Application services and use cases
- `ExpiryRuleService.findDue(asOf)`, `NotificationService.enqueue/deliver/list/markRead`, `ReminderJob.run` with locking and unique event key.
- Run scheduled jobs in separate worker process OR simple process with reliable single-leader DB lock; no duplicate reminders on restart/parallel worker.
- Log attempts and retry failures with exponential backoff and max attempt policy; clean process shutdown.

## Business rules and important edge cases
- Never set guessed 30/60/90-day alert as client's rule; derive from approved configuration.
- PO has no source expiry column. Do not compute from `po_date` or contract expiry without D04.
- Scheduled jobs follow business timezone; skip expired/cancelled targets per approved status policy. Notifications should not expose financial details to unauthorized recipients.

## Proposed REST API contract
- `GET /api/v1/notifications`, `GET /api/v1/notifications/unread-count`, `POST /api/v1/notifications/:id/read`, `GET /api/v1/notifications/settings` (if configurable).
- Admin-only `POST /api/v1/internal/jobs/expiry/run` for testing in non-production environments; avoid public cron endpoints.

All endpoints are provisional until the schema/permission decisions are resolved. Use versioned `/api/v1` routes; controllers parse inputs and delegate to services; repositories only access persistence. Use the standard response/error contract from `reference/API_AND_ERROR_CONVENTIONS.md`.

## Tests / verification checklist
- Job on threshold boundary, repeated run idempotent, 2 concurrent workers no duplicate event, time zone boundary, permission-filtered notifications, failed delivery retry.
- Test PO notifications ONLY after expiry source approved; otherwise marked blocked clearly.

## Deliverables / exit gate
- Scheduled job, durable notifications, read endpoints, monitoring and unit/integration tests.
- Document cron, worker startup, manual replay, alerting and retention.

## Open decisions and explicit non-assumptions
D04 PO expiry, D14 lead days/channel, D23 timezone, D01 recipients/permissions are required for final behavior.

## Cursor execution instructions
1. Read `requirements/README.md`, `reference/SOURCE_TRACEABILITY.md`, `reference/DECISION_REGISTER.md`, `reference/ENGINEERING_STANDARDS.md`, and relevant preceding completed phase reports before coding.
2. Inspect the real repo first. Reuse existing code; implement only what this phase needs. If prerequisites are incomplete, stop and report.
3. Write failing tests for core business invariants where practical, implement, run tests, fix; do not hide failures.
4. Run actual format/lint/typecheck/tests and migration checks as relevant. Never claim a command passed unless its output confirms it.
5. Update `requirements/IMPLEMENTATION_STATUS.md` only with verified evidence. Log blockers and source-related decisions in `reference/DECISION_REGISTER.md`.
6. Stop at this phase's gate; **do not** implement the next phase without a new explicit continuation.
