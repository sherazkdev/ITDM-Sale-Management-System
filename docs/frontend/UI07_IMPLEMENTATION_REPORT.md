# UI07 — Search, Documents, Reports, Notifications & Administration Report

**Status:** **UI07 COMPLETE** (verified)  
**Date:** 2026-11-02  
**Scope:** Global PO search hub, documents, reports/exports, notifications, user admin, audit log — **no UI08**

---

## Routes implemented

| Route | Features |
|---|---|
| `/search` | PO number hub; tabs for lines, assets, movements, maintenance, licenses, documents; invoice/budget tabs permission-gated |
| `/documents` | Base64 upload (manage), metadata lookup + authorized download (read) |
| `/reports` | JSON preview + CSV/PDF/XLSX download; D12 disclaimer notice; budget year filter |
| `/notifications` | Paginated list, unread filter, mark-as-read |
| `/admin` | User list/create/edit/roles (`users.manage`) |
| `/admin/audit` | Paginated audit log + detail dialog (`audit.read`) |

**Topbar:** Unread badge, preview of unread notifications, mark-read shortcuts (requires `notifications.read`).

---

## CRM components reused

`PageHeader`, `SectionCard`, `DataTable`, `Pagination`, `FilterSelect`, `StatusPill`, `EmptyState`, `QuickTip`, `BudgetProvisionalNotice`, `ExportDisclaimerNotice`, `Dialog`, `Tabs`, `Button`, `Input`, `Card` patterns from UI01–UI06.

---

## API integrations

| Module | Endpoints |
|---|---|
| Search | `GET /search/purchase-orders/:poNumber` |
| Documents | `POST /documents/uploads`, `GET /:id/metadata`, `GET /:id/download` |
| Reports | `GET /reports/{asset-register,budget-utilization,purchase-orders,contracts,invoices}?format=` |
| Notifications | `GET /notifications`, `GET /notifications/unread-count`, `POST /notifications/:id/read` |
| Users | `GET/POST/PATCH /users`, `PUT /users/:id/roles`, `GET /users/roles` |
| Audit | `GET /audit-events`, `GET /audit-events/:id` |

Clients: `src/lib/api/{search,documents,reports,notifications,admin-users,audit}.ts`  
Validators: `src/lib/validators/{document,admin-user}.ts`  
Helpers: `apiFetchBinary`, `saveBlobAsFile`, `ExportDisclaimerNotice`

**Not exposed in UI:** `POST /internal/jobs/expiry/run` (`jobs.run`) — backend/ops only.

---

## Permissions

| Area | Permission |
|---|---|
| PO search | `search.read` |
| Documents read / manage | `documents.read` / `documents.manage` |
| Reports | `reports.read` |
| Notifications | `notifications.read` |
| User admin | `users.manage` |
| Audit log | `audit.read` |

**Frontend redaction (defense in depth):** Search hides invoice financials without `invoices.read`, budget tab without `budgets.read`, asset purchase price without `assets.financials.read`, document download without `documents.read`.

---

## Policy / provisional UI

| Decision | UI treatment |
|---|---|
| **D12** | `ExportDisclaimerNotice`; toast on CSV/PDF/XLSX when `X-ITDMS-Export-Disclaimer: NON-OFFICIAL-D12` |
| **D06–D08** | Budget tab uses `BudgetProvisionalNotice` + API `semanticsNote` |
| **Search scope** | PO number only — no free-text global search (backend limitation documented) |
| **Inventory reports** | Uses asset-register endpoint with explicit alias note |

---

## Tests and verification

| Check | Result |
|---|---|
| Web typecheck / lint / build | **Pass** — **32** routes |
| Web vitest | **Pass** — **40/40** (incl. `ui07-validators.test.ts`) |
| API regression | **Pass** — **37/37** |
| `npm run smoke:ui07` | **Pass** (API + DB available) |

---

## Responsive screenshots

Capture checklist: `docs/frontend/screenshots/ui07/README.md` (1440 / 1280 / 1024 / 768 / 390 / 375). **Not marked complete until PNGs are attached.**

UI05/UI06 screenshot folders remain checklist-only unless PNGs are present.

---

## Missing backend capabilities / gaps

| Gap | Notes |
|---|---|
| Free-text global search | Only PO hub endpoint exists |
| Document list-by-owner | Upload + metadata-by-id only; lists appear via PO search |
| Dedicated inventory report | Asset register used as provisional alias |
| Multi-role admin UI | `PUT /users/:id/roles` replaces full set; UI uses single-role picker (documented) |
| Official D12 templates | PDF/XLSX are non-official placeholders |
| Expiry job trigger | No UI for `jobs.run` (by design) |

---

## Blocked client requirements

- **D12** — Official report templates  
- **D04/D14** — PO expiry semantics (shown as API notes on search)  
- **D01** — Final client role matrix (UI shows server roles only)

---

## Bugs fixed during UI07

- Added `apiPut` and `apiFetchBinary` to API client  
- Aligned `DataTable` with required `getRowId` / `empty` props  
- `FilterSelect` uses `onChange` (not CRM-invented props)  
- Document metadata field `createdAt` (not `uploadAt`)  
- Role DTO `displayName` (not `roleName`)

---

## UI08 readiness

Master data and operational modules UI00–UI07 are wired to real APIs. UI08 (if specified) can focus on remaining client workflows, official exports post-D12, and any new backend endpoints — **do not start UI08 without an explicit gate.**

---

## Functional test notes (manual / smoke)

1. PO search with related records — **smoke + gap-remediation API tests**  
2. Permission-gated search tabs — **implemented in `/search`**  
3. Document upload/link/download — **smoke**  
4. Report JSON + CSV disclaimer header — **smoke**  
5. Notifications unread + list — **smoke**  
6. Users + audit — **smoke**  
7. Session/network errors — **ApiClientError paths in pages**

Browser responsive capture — **pending PNG checklist**.
