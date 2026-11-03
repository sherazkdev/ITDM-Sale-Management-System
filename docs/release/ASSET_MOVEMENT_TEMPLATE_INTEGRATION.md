# Asset issue/return — official template integration (Wave 1)

**Client confirmation (Wave 1):** IT performs issuance/receipt; end users **manually sign** paper (or external) documents; **official templates arrive separately**.

## Current behavior (preserved)

- API: `POST /api/v1/asset-issuances`, `POST /api/v1/asset-returns` with employee holder linkage and movement history.
- Persistence: `asset_movement_documents`, `asset_movement_document_lines`, `asset_transactions`.
- UI: `/asset-issuance` — operational records; no claim of compliance-ready PDF layout.

## Template integration points (when client supplies D12 artwork)

| Layer | Hook |
|--------|------|
| **Data** | `AssetMovementDocument` + lines (document number, type ISSUANCE/RETURN, timestamps, employee, assets). |
| **Service** | `AssetMovementService` after successful issue/return transaction — add optional `generateOfficialDocument(documentId)` calling template renderer. |
| **Storage** | `stored_documents` + `document_links` with `ownerType` movement document (same pattern as PO uploads). |
| **API** | New read-only download route e.g. `GET /api/v1/asset-issuances/:documentId/official-pdf` gated by `documents.read` + D12 approval flag. |
| **UI** | `/asset-issuance` detail — “Download signed template PDF” when file exists; until then show “Template pending client artwork”. |

## Explicitly not implemented in Wave 1

- Auto-generated “official” PDFs without client templates.
- Digital signature capture or department-level holder rules (**D10**).
- Changing movement business rules or audit trail.
