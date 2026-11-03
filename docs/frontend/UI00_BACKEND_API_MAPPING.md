# UI00 — Backend API Mapping for Frontend

**API base:** `/api/v1` on Express (`apps/api`)  
**Auth:** Session cookie (+ optional `Authorization: Bearer`); `credentials: 'include'` from browser  
**Success shape:** `{ success: true, data, meta: { requestId, page?, pageSize?, total? } }`  
**Error shape:** `{ success: false, error: { code, message, details }, meta: { requestId } }`  

**Permissions:** `GET /auth/me` → `permissions: string[]` (keys below). **D01:** seed matrix is PROPOSED.

---

## Permission keys (gate nav + actions)

From `apps/api/src/shared/auth/permissions.ts`:

| Key | Typical UI |
|---|---|
| `employees.read` / `employees.write` | Employees list/detail/edit |
| `vendors.read` / `vendors.manage` | Vendors |
| `assets.read` / `assets.manage` / `assets.financials.read` | Assets; purchase cost visibility |
| `assets.issue` / `assets.return` | Issuance/return forms |
| `contracts.read` / `contracts.manage` | Contracts |
| `purchaseOrders.read` / `purchaseOrders.manage` | POs (draft edit only while D03 blocked) |
| `invoices.read` / `invoices.manage` | Invoices + payments |
| `budgets.read` / `budgets.manage` | Budget years, allocations, ledger |
| `search.read` | PO global search |
| `maintenance.read` / `maintenance.manage` | Maintenance |
| `licenses.read` / `licenses.manage` | Licenses (renew blocked) |
| `documents.read` / `documents.manage` | Upload/download |
| `notifications.read` | Notification center |
| `reports.read` | Report downloads |
| `audit.read` | Audit log viewer |
| `users.manage` | User admin |
| `jobs.run` | Internal expiry job (admin tooling only) |

---

## Module mapping

### Overview (dashboard)

| UI need | API (UI03) | Permission gating |
|---|---|---|
| KPI + charts + activity | **`GET /dashboard/summary`** — Prisma aggregates; sections omitted without read permission | Authenticated; each block requires module read key (see `dashboard.service.ts`) |
| Budget utilization KPIs | **Not exposed** — `budgetNotice` only when `budgets.read` (D06–D08) | — |
| Unread notifications | Included in summary when `notifications.read` | Same |
| Recent audit | Last 8 events when `audit.read` | Same |

Legacy list endpoints remain for module screens (UI04+).

### Employees

| Action | Method | Path | Permission |
|---|---|---|---|
| List | GET | `/employees?page&pageSize` | `employees.read` |
| Get | GET | `/employees/:id` | `employees.read` |
| Create | POST | `/employees` | `employees.write` |
| Update | PATCH | `/employees/:id` | `employees.write` |
| Deactivate | POST | `/employees/:id/deactivate` | `employees.write` |

### Vendors

| Action | Method | Path | Permission |
|---|---|---|---|
| List | GET | `/vendors` | `vendors.read` |
| CRUD | POST/PATCH/GET | `/vendors`, `/vendors/:id` | manage/read |
| Archive | POST | `/vendors/:id/archive` | `vendors.manage` |

### Asset categories & assets

| Action | Method | Path | Permission |
|---|---|---|---|
| Categories | GET/POST/PATCH | `/asset-categories` | `assets.read` / `assets.manage` |
| Register asset | POST | `/assets` | `assets.manage` |
| List/detail | GET | `/assets`, `/assets/:id` | `assets.read` |
| History | GET | `/assets/:id/history` | `assets.read` |
| Current holder | GET | `/assets/:id/current-holder` | `assets.read` |
| Maintenance by asset | GET | `/assets/:id/maintenance` | `maintenance.read` |
| Retire | POST | `/assets/:id/retire` | `assets.manage` |

**Note:** `purchaseCost` hidden unless `assets.manage`, `assets.financials.read`, or `invoices.read` (controller rule).

### Contracts

| Action | Method | Path | Permission |
|---|---|---|---|
| List/filter | GET | `/contracts` | `contracts.read` |
| CRUD | POST/PATCH/GET | `/contracts`, `/contracts/:id` | manage/read |
| POs on contract | GET | `/contracts/:id/purchase-orders` | `contracts.read` |

### Purchase orders

| Action | Method | Path | Permission | Notes |
|---|---|---|---|---|
| List | GET | `/purchase-orders` | `purchaseOrders.read` | |
| Create draft | POST | `/purchase-orders` | `purchaseOrders.manage` | body includes optional `validUntil` |
| Detail | GET | `/purchase-orders/:id` | read | includes lines |
| By number | GET | `/purchase-orders/by-number/:poNumber` | read | |
| Update draft | PATCH | `/purchase-orders/:id` | manage | draft only |
| Lines | POST/DELETE | `.../lines`, `.../lines/:lineId` | manage | |
| Invoices on PO | GET | `/purchase-orders/:id/invoices` | `invoices.read` | |
| Submit/approve/cancel | POST | `.../submit`, `.../approve`, `.../cancel` | manage | **403 POLICY_NOT_APPROVED (D03)** — UI disabled + explanation |

### Issuance & returns

| Action | Method | Path | Permission |
|---|---|---|---|
| Issue | POST | `/asset-issuances` | `assets.issue` |
| Return | POST | `/asset-returns` | `assets.return` |
| Get document | GET | `/asset-issuances/:id`, `/asset-returns/:id` | `assets.read` |

### Invoices & payments

| Action | Method | Path | Permission |
|---|---|---|---|
| List/create | GET/POST | `/invoices` | read/manage |
| Detail | GET | `/invoices/:id` | read |
| Balance | GET | `/invoices/:id/balance` | read |
| Payments list | GET | `/invoices/:id/payments` | read |
| Record payment | POST | `/invoices/:id/payments` | manage (idempotencyKey required) |

### Budgets

| Action | Method | Path | Permission |
|---|---|---|---|
| Financial years | POST/GET | `/financial-years` | manage/read |
| Allocations | POST/GET | `/budget-allocations` | manage/read |
| Ledger entry | POST | `/budget-ledger/entries` | `budgets.manage` |
| Summary | GET | `/budgets/:budgetId/summary` | read |
| By PO | GET | `/budgets/by-po/:id` | read |
| By vendor | GET | `/budgets/by-vendor/:id` | read |

**UI copy:** show `remainingProvisional` and API `semanticsNote` — not client-approved committed/actual (D06–D08).

### Maintenance & licenses

| Action | Method | Path | Permission | Notes |
|---|---|---|---|---|
| Maintenance CRUD | `/maintenance-records` | read/manage | | |
| Complete | POST | `.../:id/complete` | manage | |
| License CRUD | `/software-licenses` | read/manage | list strips `licenseKeyReference` | |
| Renew | POST | `/software-licenses/:id/renew` | manage | **403 blocked** |

### Global search

| Action | Method | Path | Permission |
|---|---|---|---|
| PO hub | GET | `/search/purchase-orders/:poNumber` | `search.read` |

Response includes: `purchaseOrder`, `supportingDocuments`, `invoiceFinancials`, `movements`, `maintenance`, `softwareLicenses`, `budget`, `expiryDates`.

### Documents

| Action | Method | Path | Permission |
|---|---|---|---|
| Upload (base64 JSON) | POST | `/documents/uploads` | `documents.manage` |
| Metadata | GET | `/documents/:id/metadata` | read |
| Download | GET | `/documents/:id/download` | read (requires document link) |
| Movement PDF/json | POST | `/documents/issuance-documents/:id/generate?format=` | read |

### Notifications

| Action | Method | Path | Permission |
|---|---|---|---|
| List | GET | `/notifications` | read |
| Unread count | GET | `/notifications/unread-count` | read |
| Mark read | POST | `/notifications/:id/read` | read |
| Expiry job | POST | `/internal/jobs/expiry/run` | `jobs.run` |

### Reports

| Report | GET path | `format` query |
|---|---|---|
| Asset register | `/reports/asset-register` | json, csv, pdf, xlsx |
| Budget utilization | `/reports/budget-utilization` | same |
| Purchase orders | `/reports/purchase-orders` | same |
| Contracts | `/reports/contracts` | same |
| Invoices | `/reports/invoices` | same |

**pdf/xlsx:** placeholder only; show **NON-OFFICIAL (D12)** disclaimer in UI when response header `X-ITDMS-Export-Disclaimer` present.

### Administration

| Action | Method | Path | Permission |
|---|---|---|---|
| Users | GET/POST/PATCH | `/users` | `users.manage` |
| Set roles | PUT | `/users/:id/roles` | `users.manage` |
| List roles | GET | `/users/roles` | `users.manage` |
| Audit | GET | `/audit-events` | `audit.read` |

### Auth

| Action | Method | Path |
|---|---|---|
| Login | POST | `/auth/login` |
| Logout | POST | `/auth/logout` |
| Me | GET | `/auth/me` |

---

## Blocked workflows (UI treatment)

| Feature | Error | UI |
|---|---|---|
| PO approval workflow | `POLICY_NOT_APPROVED` | Hide or disable; link to decision D03 |
| License renew | 403 | No primary renew button |
| Official PDF templates | Disclaimer header / policy | Banner on export |
| Dept issuance / consumable qty | No API | Do not show (D09/D10) |
| Credit notes | No API | Defer (D05) |

---

## Next.js integration pattern (UI02+)

- Dev proxy: `/api/v1/*` → `http://localhost:3000` (API `PORT`) or env `ITDMS_API_URL`
- Server Components for initial data optional; mutations via client + React Query
- Map `error.code` to toast + inline field errors (`VALIDATION_ERROR`, `CONFLICT`, etc.)

---

## References

- `docs/BACKEND_FINAL_ACCEPTANCE_MATRIX.md`
- `docs/CLIENT_REQUIREMENTS_REMEDIATION_REPORT.md`
- `requirements/reference/DECISION_REGISTER.md`
