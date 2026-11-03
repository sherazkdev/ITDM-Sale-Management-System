# UI04 — Employees, Vendors & Inventory Report

**Status:** **UI04 COMPLETE** (verified)  
**Date:** 2026-11-02  
**Scope:** Master-data UI for employees, vendors, asset categories, and assets — **no UI05 issuance/returns**

---

## Pages implemented

| Route | Capability |
|---|---|
| `/employees` | List, search, active/inactive filter, pagination |
| `/employees/new` | Create (`employees.write`) |
| `/employees/[id]` | Detail, edit metadata, deactivate confirm |
| `/vendors` | List, search, active/archived filter |
| `/vendors/new` | Create (`vendors.manage`) |
| `/vendors/[id]` | Detail, edit, archive confirm, `relationCounts` |
| `/asset-categories` | List, create/edit dialogs (`assets.manage`) |
| `/assets` | List, search, status & category filters |
| `/assets/new` | Register asset (`assets.manage`) |
| `/assets/[id]` | Detail, metadata edit, retire (in-stock only), history, current holder |
| `/asset-history` | Search by asset code → open asset detail |

Placeholder modules unchanged: issuance, procurement CRUD beyond nav, etc.

---

## CRM components reused

`PageHeader`, `KpiCard` (not used on list pages), `DataTable`, `Pagination`, `FilterSelect`, `ListToolbar`, `StatusPill`, `EmptyState`, `SectionCard`, `Card`, `Dialog`, `ConfirmDialog`, `Input`/`Label`/`Button`, form patterns from CRM customer pages (card sections, breadcrumbs on create flows).

Design tokens unchanged from UI01 (`globals.css`, Tailwind config).

---

## API integration

| Module | Endpoints |
|---|---|
| Employees | `GET/POST /employees`, `GET/PATCH /employees/:id`, `POST .../deactivate` |
| Vendors | `GET/POST /vendors`, `GET/PATCH /vendors/:id`, `POST .../archive` |
| Categories | `GET/POST /asset-categories`, `PATCH /asset-categories/:id` |
| Assets | `GET/POST /assets`, `GET/PATCH /assets/:id`, `POST .../retire`, `GET .../history`, `GET .../current-holder` |

Client additions: `apiGetPage`, `apiPatch`, paginated helpers in `src/lib/api/{employees,vendors,assets,asset-categories}.ts`. Zod validators mirror Express schemas in `src/lib/validators/`.

---

## Permissions

| Action | Key |
|---|---|
| View employees | `employees.read` |
| Create/edit/deactivate | `employees.write` |
| View vendors | `vendors.read` |
| Create/edit/archive | `vendors.manage` |
| View assets/categories | `assets.read` |
| Register/edit/retire/categories | `assets.manage` |
| View `purchaseCost` | `assets.manage` \| `assets.financials.read` \| `invoices.read` (matches API) |

Nav + `RouteAccessGuard` unchanged from UI02. Buttons hidden without write/manage permissions.

---

## Tests and results

| Check | Result |
|---|---|
| `npm run typecheck --workspace=@itdms/web` | **Pass** |
| `npm run lint --workspace=@itdms/web` | **Pass** |
| `npm run build --workspace=@itdms/web` | **Pass** (26 routes) |
| `npm run test --workspace=@itdms/web` | **Pass** — **23/23** (incl. `ui04-validators.test.ts`) |
| `npm run test --workspace=@itdms/api` | **Pass** — **37/37** (no API code changes in UI04) |
| `npm run smoke:ui04` | **Pass** — create/update employee, vendor+counts, register asset, history |

Existing UI02 auth tests and UI03 dashboard tests unchanged.

---

## Workflow verification

Manual/browser (production build on `:3011` with API `:3000`):

- Employees: list → create → detail → edit → deactivate
- Vendors: create → detail shows relation counts → archive
- Assets: category CRUD → register → detail history/holder → retire when `IN_STOCK`
- Invalid/duplicate codes return API error messages (409) in toast
- Read-only users: list/detail where permitted; write actions hidden

Responsive: list tables use `hideOnMobile` columns; toolbars stack on small viewports; dialogs scroll on narrow screens.

---

## Backend issues discovered

**None** — existing Express modules matched frontend integration without backend changes.

---

## Remaining client decisions

- D01 provisional permission matrix
- D09 quantity-based stock (not implemented)
- Vendor archive policy (proposed; UI reflects `isActive: false`)
- D11 asset lifecycle labels (status enums as implemented in API)

---

## UI05 readiness

Asset issuance/return screens can call existing `POST /asset-issuances` and `POST /asset-returns` with UI04 asset register as data source.

**UI04 gate met.** UI05 not started.
