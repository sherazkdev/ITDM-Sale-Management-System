# API Plan (DRAFT — No Implementation in P00)

**Version prefix:** `/api/v1`  
**Status:** Permission names and paths are **PROPOSED** (`requirements/reference/FULL_API_SURFACE_MAP.md`). Deny-by-default until D01 resolved.

## Principles

- Controllers: parse/validate only; delegate to services.
- Services: business rules, transactions, typed errors.
- Repositories: Prisma/ SQL only.
- Responses/errors: `requirements/reference/API_AND_ERROR_CONVENTIONS.md`.
- Money: decimal strings; no JS float for finance.
- No stub endpoints that return fake success for blocked workflows.

## Module map (routes prefix → phase)

| Module | Base path | Phase |
|---|---|---|
| Health | `/health/live`, `/health/ready` | P01 |
| Auth | `/auth/*`, `/users/*` | P03 |
| Employees | `/employees` | P04 |
| Vendors | `/vendors` | P05 |
| Asset categories | `/asset-categories` | P06 |
| Assets | `/assets` | P06, P09 |
| Contracts | `/contracts` | P07 |
| Purchase orders | `/purchase-orders` | P08 |
| Issuance | `/asset-issuances`, `/asset-returns` | P09 |
| Invoices | `/invoices` | P10 |
| Budget | `/financial-years`, `/budget-allocations`, `/budgets/*` | P11 |
| Maintenance | `/maintenance-records` | P12 |
| Licenses | `/software-licenses` | P13 |
| Documents | `/documents/*`, generation subpaths | P14 |
| Search | `/search`, `/search/purchase-orders/:poNumber/overview` | P15 |
| Notifications | `/notifications` | P16 |
| Audit | `/audit-events` | P17 |
| Reports | `/reports/*` | P18 |

## Draft permission catalog (not role assignments)

See `API_AND_ERROR_CONVENTIONS.md` — candidates include `employees.read`, `assets.issue`, `purchaseOrders.manage`, `invoices.pay`, `budgets.post`, `reports.export`, `audit.read`.

**BLOCKED:** Mapping permissions to job titles (IT Admin vs Software Manager) — D01.

## Action endpoints vs CRUD

Lifecycle mutations use explicit POST actions when side effects matter:

- `POST /purchase-orders/:id/approve` (D03)
- `POST /purchase-orders/:id/cancel`
- `POST /invoices/:id/post`, `/payments` (D05–D06)
- `POST /asset-issuances`, `/asset-returns` (atomic)

Avoid blind `PATCH status` on financial or issuance entities.

## Blocked endpoint behaviors (must not ship as no-ops)

| Endpoint area | Blocker |
|---|---|
| PO approve/cancel side effects | D03, D07 |
| Invoice post/pay/reconcile | D05, D06 |
| Budget summary/ledger aggregates | D07, D08 |
| Expiring PO list | D04 |
| Official PDF/Excel generation | D12 |
| Global search financial sections | D01 + data existence |

## OpenAPI

Generate from implemented routes starting P01 (health) and expand per phase. Maintain in repo when `apps/api` exists (P01+).

## Reference

Full endpoint table: `requirements/reference/FULL_API_SURFACE_MAP.md` (87+ rows).

## Example contracts (illustrative)

Issue (P09 — policy gated):

```json
POST /api/v1/asset-issuances
{
  "employeeId": "uuid",
  "assetIds": ["uuid1", "uuid2"],
  "issueAt": "2026-11-01T09:00:00+05:00",
  "referenceNumber": "ISS-001",
  "conditionNotes": "Good"
}
```

Error shape:

```json
{
  "success": false,
  "error": {
    "code": "ASSET_ALREADY_ISSUED",
    "message": "Asset is currently assigned",
    "details": null
  },
  "meta": { "requestId": "..." }
}
```
