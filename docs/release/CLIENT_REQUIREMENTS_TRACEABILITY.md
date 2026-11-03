# Client Requirements Traceability Matrix

**Project:** ITDMS  
**Baseline sources:** `requirements/Background and Objective.pdf` (BO), `requirements/Database structure.pdf` (DB)  
**Audit date:** 2026-11-03 (Phase 03)  
**Legend:** VERIFIED = tested/evidence; IMPLEMENTED BUT NOT VERIFIED = code exists, weak/no E2E proof; PARTIAL = gaps; BLOCKED = client decision; MISSING = not built; N/A = out of scope

| # | Domain (client) | Source IDs | Backend | DB tables | API (representative) | Frontend routes | Status | Tests / evidence | Client decision |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Employees | R02 | P04 | `employees` | `/api/v1/employees` | `/employees`, `/employees/new`, `/employees/[id]` | **VERIFIED** | API + Playwright employee workflow | D18 optional dept master |
| 2 | Asset categories | R03 | P06 | `asset_categories` | `/api/v1/asset-categories` | `/asset-categories` | **VERIFIED** | API tests | — |
| 3 | Assets & inventory quantity | R03, R18 | P06, P09, **Wave 1 + Wave 3** | `assets`, **`non_asset_stock_items`** (+ PO/type/received date), `asset_transactions` | `/api/v1/assets`, **`/non-asset-stock-items`**, issuances/returns | `/assets`, `/assets/new`, **`/assets/non-asset/[id]`**, `/asset-issuance` | **PARTIAL** | Serialized **VERIFIED**; non-asset entry + detail **Wave 3**; movement/consumption **MISSING** | **D09** partial |
| 4 | Vendors | R04 | P05 | `vendors` | `/api/v1/vendors` | `/vendors` | **VERIFIED** | API + UI smoke | D16 archive policy |
| 5 | Purchase orders & lines | R04, R14, R15 | P08, **Wave 1** | `purchase_orders`, `purchase_order_lines` | `/api/v1/purchase-orders`, lines | `/purchase-orders` | **PARTIAL** | Draft CRUD **VERIFIED**; in-app approve **N/A (SAP external)** | **D03 CONFIRMED** |
| 6 | Contracts | R04 | P07 | `contracts` | `/api/v1/contracts` | `/contracts` | **VERIFIED** | API tests | D04 renewal semantics |
| 7 | Invoices & payments | R05, R16 | P10 | `invoices`, `invoice_payments` | `/api/v1/invoices`, payments | `/invoices` | **PARTIAL** | Ledger + idempotency **VERIFIED**; posting policy **PROPOSED** | **D05**, D06 |
| 8 | Asset issuance & returns | R07, R17 | P09, P14 | movement docs, transactions | `/api/v1/asset-issuances`, `/asset-returns` | `/asset-issuance` | **VERIFIED** | Concurrency tests, E2E issuance paths | D10 dept holder, D11 states, D12 forms |
| 9 | Maintenance | R06 | P12 | `maintenance_records` | `/api/v1/maintenance-records` | `/maintenance` | **VERIFIED** | API tests | D19 optional SLA |
| 10 | Software licenses | R06 | P13 | `software_licenses` | `/api/v1/software-licenses` | `/software-licenses` | **PARTIAL** | CRUD **VERIFIED**; renew workflow **BLOCKED**; keys redacted | **D21** |
| 11 | Financial years | R08 | P11 | `financial_years` | `/api/v1/financial-years` | `/budgets` (year context) | **VERIFIED** | API tests | D23 fiscal boundaries |
| 12 | Budget allocations & transactions | R08, R18 | P11 | `budget_allocations`, `budget_transactions` | `/api/v1/budgets/*` | `/budgets` | **PARTIAL** | Manual ledger **VERIFIED**; commit/actual rules **PROPOSED** | **D06–D08** |
| 13 | PO-number global search | R09 | P15 | relational links | `/api/v1/search/purchase-orders/:poNumber/overview` | `/search` | **VERIFIED** | Integration + UI search | — |
| 14 | Documents & attachments | R04, R19 | P14 | `stored_documents`, `document_links` | `/api/v1/documents/uploads`, download | `/documents` | **PARTIAL** | Upload/download **VERIFIED**; integrity on shared dev DB **PARTIAL** (see Phase 03 DR report) | **D12**, **D13** |
| 15 | PDF/Excel reports & official forms | R10 | P18, P14, **Wave 1** | — | `/api/v1/reports/*` JSON/CSV/**XLSX** | `/reports` | **PARTIAL** | Operational XLSX **VERIFIED**; official templates **BLOCKED** | **D12** partial |
| 16 | Authentication & RBAC | R11 | P03 | `users`, `roles`, permissions | `/api/v1/auth/*`, users admin | `/login`, `/admin` | **PARTIAL** | Security Phase 01 **VERIFIED**; role matrix **PROPOSED seed** | **D01**, **D02**, D22 |
| 17 | Audit logs | R11 | P17 | `audit_logs` | `/api/v1/audit-events` | `/admin/audit` | **VERIFIED** | API + UI08 | D16 retention |
| 18 | Contract/license expiry notifications | R04 | P16, **Wave 1** | `notification_events` | `/api/v1/notifications`, job endpoint | `/notifications` | **PARTIAL** | **60-day** lead **VERIFIED**; PO uses `valid_until` when set | **D04** partial, **D14** partial |
| 19 | Internal LAN deployment | R01 | P19 | — | health, runbooks | Next proxy to API | **IMPLEMENTED BUT NOT VERIFIED** | Runbooks only; **no production deploy** | **D17** |
| 20 | Data backup & recovery | R12 | P17, Phase 02 | dumps + files | CLI scripts | — | **PARTIAL** | DB restore **VERIFIED**; **full document recovery PARTIAL** on polluted dev DB | **D17** |

## Multi-record relationships (verified in tests)

| Relationship | Status | Evidence |
|---|---|---|
| Contract → multiple POs | **VERIFIED** | Schema + procurement tests |
| PO → multiple lines | **VERIFIED** | `po-line.test.ts` |
| PO → multiple invoices / partial payments | **VERIFIED** | Finance + procurement tests |
| Issuance doc → multiple assets | **VERIFIED** | P09 concurrency tests |
| PO search hub → linked entities | **VERIFIED** | Search integration |

## Explicit non-compliance (not claimed)

- Approved PO approval workflow (D03)
- Client-official PDF/Excel layouts (D12)
- Automatic budget commit on PO approve (D06/D07)
- Consumable quantity inventory (D09)
- Department as issuance holder (D10)
- Production DR policy sign-off (D17)
- Client UAT execution (Phase 03 prepares plan only)

## ORLEN branding (record only — not implemented)

Separate client requirement: **ORLEN** logo, red-tone palette, **preserve CRM-derived layout and business logic**. Scheduled for final branding phase; **no Phase 03 UI changes**.
