# Proposed API Contract and Error Conventions

These endpoint paths and wire formats are **PROPOSED implementation choices**. The PDF mandates capabilities, not exact HTTP paths. Every module uses versioned `/api/v1`; publish OpenAPI after actual implementation.

## Request pipeline
`requestId → security headers → size limits → rate limit → authn → permission check → Zod parse → controller → service → repository → DB → error mapper`.

## Standard response shapes (example proposals)
Success (single):
```json
{"success":true,"data":{"id":"uuid","assetCode":"IT-LAP-0001"},"meta":{"requestId":"req-id"}}
```
Success (page):
```json
{"success":true,"data":[{"id":"uuid"}],"meta":{"page":1,"pageSize":20,"total":1,"requestId":"req-id"}}
```
Failure:
```json
{"success":false,"error":{"code":"ASSET_ALREADY_ISSUED","message":"Asset is currently assigned","details":null},"meta":{"requestId":"req-id"}}
```

## HTTP semantics
- `200` read/update; `201` created; `204` deleted only when no body returned.
- `400` malformed request; `401` not authenticated; `403` authenticated but forbidden; `404` absent or concealed resource; `409` conflict/invalid state or duplicate business ID; `422` schema-semantic validation; `429` throttled; `500` scrubbed generic error.
- Reject bad IDs and invalid pagination; maximum pageSize, deterministic stable cursor/page boundaries; no unbounded `?include=all`.
- Require idempotency for replay-prone operations (asset issue, invoice payment, budget posting) where appropriate.
- Pass money as **decimal strings**, e.g. `"12500.00"`, or well-defined minor-unit integers after approval. Never represent financial values as imprecise JS floats.

## Examples for tricky workflows
Issue assets:
```json
{"employeeId":"EMP-DB-ID","assetIds":["ASSET-DB-ID-1","ASSET-DB-ID-2"],"issueAt":"2026-11-01T09:00:00+05:00","referenceNumber":"ISS-001","conditionNotes":"Good"}
```
Return assets:
```json
{"issueDocumentId":"DOC-DB-ID","assetIds":["ASSET-DB-ID-1"],"returnAt":"2026-11-02T09:00:00+05:00","conditionNotes":"Good"}
```
Both require transaction lock, permissions, partial-return policy decisions, immutable history. IDs are placeholders, not real records.

## Permission model (proposed)
- Domain actions: `employees.read`, `employees.write`, `assets.read`, `assets.manage`, `assets.issue`, `assets.return`, `vendors.manage`, `contracts.manage`, `purchaseOrders.manage`, `invoices.read`, `invoices.manage`, `budgets.read`, `budgets.post`, `reports.export`, `users.manage`, `audit.read`.
- Permission assignment and exact roles **BLOCKED** by D01. Deny by default; permission middleware checks scope and service enforces sensitive transitions.
- Financial/private results must respect authorization in global search and exports.

## Endpoint conventions
- Prefer plural nouns: `/employees`, `/assets`, `/purchase-orders/:id/lines`.
- Lifecycle operations are named actions POST `/purchase-orders/:id/approve` rather than generic PATCH `status` when approvals have business consequences.
- Use GET for read only; never mutate on GET. Action endpoints must produce audit events and transactionally consistent state.
- Document format: `/reports/<type>?format=pdf|xlsx` after P18; authorized download URLs after P14.
- Endpoint lists in phase files are draft until P00 policies resolved. Generate actual OpenAPI from code and update contract on change.
