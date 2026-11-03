# P14 — Controlled Files, Templates & Form Generation

> **Status:** NOT_STARTED  
> **Dependencies:** P08–P13 (usable models)  
> **Requirement basis:** BO pp2–3; DB p4  
> **Scope:** BACKEND ONLY. No UI/dashboard implementation.

## Outcome and boundaries
- Secure upload of supporting purchase order / contract / invoice docs and standardized issue/return documents.
- Store controlled document templates and document metadata, generate PDF/Excel where appropriate using owner-provided layouts; reports expansion P18.
- Manage authorized file downloads, revisions, hashes, retention and audit.

## Entities and persistence
- DB has `purchase_orders.document_path`, `contracts.document_path` and notes on generated document references, **not** schema for template management.
- PROPOSED `stored_documents` (id, ownerType/ownerId, storageKey, contentHash, mediaType, size, createdBy, createdAt, version) and `document_templates` (type, version, status, storedDocumentId).
- Issuance/return document headers and lines from P09 are source for generating forms, not rendered PDF as source of truth.

## Application services and use cases
- `FileStorageService.storePrivate/getAuthorized/deleteByRetention`, `TemplateService.registerVersion/getActive`, `DocumentGenerator.issueForm/returnForm/contractSummary/poSummary` (depending on approved template).
- For upload: validate real signature/media, size, filename, allowed types, ownership + permission; random storage key outside served web root. Anti-malware scanning plan per D13.
- For generate: render from immutable business data snapshot or defined current data; record template version and resulting content hash; audit view/download/generation.

## Business rules and important edge cases
- Do not trust original filename/path from request; no directory traversal or public static paths.
- Do not claim match to organization format without the sample template D12.
- Upload access uses resource-level permission, not only 'logged in'; preserve sensitive financial doc access.
- Generated files should be reproducible or clearly snapshot-versioned; no silent overwriting of historical official forms.

## Proposed REST API contract
- `POST /api/v1/documents/uploads` (scoped owner, permission), `GET /api/v1/documents/:id/metadata`, `GET /api/v1/documents/:id/download`, `GET /api/v1/documents?ownerType=...&ownerId=...`.
- `POST /api/v1/issuance-documents/:id/generate`, `POST /api/v1/return-documents/:id/generate`; contract/PO preview/generate only for received templates.
- `POST /api/v1/document-templates` admin-only if approved.

All endpoints are provisional until the schema/permission decisions are resolved. Use versioned `/api/v1` routes; controllers parse inputs and delegate to services; repositories only access persistence. Use the standard response/error contract from `reference/API_AND_ERROR_CONVENTIONS.md`.

## Tests / verification checklist
- MIME spoof, oversize, traversal, path outside storage, unauthorized resource, deleted owner, malicious filename, concurrent generation idempotency.
- Rendering golden fixtures from actual organization template; PDF text/layout and XLSX cell validity where applicable.
- Private file never directly retrievable without permission; audit download.

## Deliverables / exit gate
- Secure document storage + metadata + download and template rendering where approved.
- D12 missing template -> feature remains BLOCKED with explicit list, not marked compliant.

## Open decisions and explicit non-assumptions
D12 controlled templates, D13 file policy, D16 retention; real company sample templates required for final forms.

## Cursor execution instructions
1. Read `requirements/README.md`, `reference/SOURCE_TRACEABILITY.md`, `reference/DECISION_REGISTER.md`, `reference/ENGINEERING_STANDARDS.md`, and relevant preceding completed phase reports before coding.
2. Inspect the real repo first. Reuse existing code; implement only what this phase needs. If prerequisites are incomplete, stop and report.
3. Write failing tests for core business invariants where practical, implement, run tests, fix; do not hide failures.
4. Run actual format/lint/typecheck/tests and migration checks as relevant. Never claim a command passed unless its output confirms it.
5. Update `requirements/IMPLEMENTATION_STATUS.md` only with verified evidence. Log blockers and source-related decisions in `reference/DECISION_REGISTER.md`.
6. Stop at this phase's gate; **do not** implement the next phase without a new explicit continuation.
