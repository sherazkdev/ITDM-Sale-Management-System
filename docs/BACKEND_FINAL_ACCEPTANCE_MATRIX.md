# Backend Final Acceptance Matrix

**Date:** 2026-10-31 (post-remediation)  
**Test evidence:** 34/34 Vitest tests, isolated PostgreSQL  

Status: **FIXED** | **PARTIAL** | **BLOCKED** | **UNVERIFIED**

| GAP | Status | Client PDF ref | Notes |
|---|---|---|---|
| GAP-001 PDF/XLSX templates | **PARTIAL** | BO §4 | Placeholder exports only; **D12** |
| GAP-002 PO workflow | **BLOCKED** | BO §2.3 | **D03** |
| GAP-003 PO expiry alerts | **PARTIAL** | BO §2.3 | `valid_until` + job; **D04** semantics |
| GAP-004 Budget committed/actual | **PARTIAL** | BO §2.7 | Ledger + by-po/vendor; **D06–D08** |
| GAP-005 Quantity inventory | **BLOCKED** | BO §2.2 | **D09** |
| GAP-006 Department issuance | **BLOCKED** | BO §2.6 | **D10** |
| GAP-007 Document attachments | **FIXED** | BO §2.3, DB p4 | `document_links` |
| GAP-008 PO global search | **PARTIAL** | BO §3 | Major hub fields added |
| GAP-009 License renewal | **BLOCKED** | BO §2.5 | POST renew 403 |
| GAP-010 User/RBAC admin | **PARTIAL** | BO §6 | `/users` APIs; **D01** |
| GAP-011 Extra reports | **PARTIAL** | BO §4 | JSON/CSV/PDF/XLSX placeholder |
| GAP-012 Budget test coverage | **FIXED** | BO §2.7 | Automated HTTP tests |
| GAP-013 Restore drill | **PARTIAL** | BO §6 | Script only; **D17** |
| GAP-014 Invoice payments list | **FIXED** | BO §2.4 | GET payments |
| GAP-015 Contract renewal API | **BLOCKED** | BO §2.3 | Policy TBD |

## API inventory (post-remediation)

Base: `/api/v1`

| Area | Endpoints |
|---|---|
| Health | `GET /health/live`, `/ready` |
| Auth | `POST /auth/login`, `/logout`, `GET /auth/me` |
| Users (**new**) | `GET/POST /users`, `PATCH /users/:id`, `PUT /users/:id/roles`, `GET /users/roles` |
| Employees | CRUD + deactivate |
| Vendors | CRUD + archive |
| Assets | CRUD, history, holder, maintenance list, retire |
| Categories | list/create/patch |
| Contracts | CRUD + PO list |
| PO | CRUD, lines, invoices list, **validUntil** on create/patch, submit/approve/cancel **403** |
| Issuance/return | POST/GET documents |
| Invoices | CRUD, balance, **GET/POST payments** |
| Budget | financial-years, allocations, ledger, summary, **by-po/:id**, **by-vendor/:id** |
| Search | `GET /search/purchase-orders/:poNumber` (expanded payload) |
| Maintenance / licenses | CRUD; renew **403** |
| Documents | upload (linked), metadata, download (requires link), generate json/pdf placeholder |
| Notifications | list, unread, mark read; job expiry (contract, license, **PO valid_until**) |
| Audit | `GET /audit-events` |
| Reports | asset-register, budget-utilization, **purchase-orders**, **contracts**, **invoices** (`format=json\|csv\|pdf\|xlsx`) |

## Required client decisions (unchanged blockers)

**D01, D03, D04, D05–D08, D09, D10, D12, D17, D21** — see `requirements/reference/DECISION_REGISTER.md`

## Frontend integration order (updated)

1. Auth + **user admin** (ops-only, with D01 disclaimer)  
2. Masters: employees, vendors, categories  
3. Assets + issuance/return  
4. PO draft + lines + **validUntil** field + attachments via documents API  
5. Invoices + **payment list** + balance  
6. **PO search hub** (single screen data model)  
7. Budget views using **summary + by-po** (show provisional labels)  
8. Reports/downloads with **NON-OFFICIAL** banner  
9. Notifications inbox  
10. Defer: PO approve, license renew, official PDF templates until decisions land  

## Production acceptance

| Gate | Met? |
|---|---|
| Core CRUD + integrity tests | Yes |
| Expanded gap tests | Yes (34 tests) |
| Official client PDF/Excel templates | **No (D12)** |
| Approved finance/PO policy | **No** |
| Restore drill signed | **No (D17)** |
| Full PDF requirement compliance | **No** |

**Verdict:** Backend suitable for **controlled frontend integration** on documented subset; **not** final client acceptance or production go-live.
