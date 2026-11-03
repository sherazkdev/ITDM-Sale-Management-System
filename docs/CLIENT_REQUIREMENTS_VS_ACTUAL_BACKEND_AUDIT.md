# Client Requirements vs Actual Backend — Independent Audit

**Audit date:** 2026-10-31  
**Auditor role:** Evidence-based comparison of **running code** vs **authoritative PDFs**  
**Sources (primary):**

- `requirements/Background and Objective.pdf` (**BO**, 4 pages) — read in full this audit  
- `requirements/Database structure.pdf` (**DB**, 4 pages) — read in full this audit  

**Sources (context only):** `docs/requirements-coverage.md`, `docs/backend-final-gap-analysis.md`, `requirements/reference/DECISION_REGISTER.md`, `requirements/reference/SOURCE_TRACEABILITY.md`

**Method:** Route/service/schema inspection + Vitest/Supertest against isolated PostgreSQL (`DATABASE_URL` test DB, `prepareTestDatabase()`). Prior phase “VERIFIED” labels were **not** treated as proof.

---

## 1. Executive summary

The repository contains a **modular Express + Prisma + PostgreSQL backend** with **~55 authenticated API routes**, migrations for **13 PDF baseline tables plus approved extensions**, and **30 automated integration/unit tests** (serial DB suite).

**Compliance verdict:** The implementation **partially satisfies** the client PDFs. Core relational CRUD, serialized asset tracking, multi-line POs, multi-invoice payments (ledger), atomic issuance/returns, maintenance/licenses, manual budget ledger, contract expiry notifications, and a **PO-centric search hub** are **real and tested**. The client’s **mandatory PDF/Excel organizational documents**, **full budget semantics (committed/actual/utilized)**, **PO expiry reminders**, **quantity-based consumable inventory**, **department-level issuance**, **PO approval workflow**, **complete global search (documents + budget utilization summary)**, **user/role administration APIs**, and **production backup/restore sign-off** are **not fully delivered**.

| Overall | Assessment |
|---|---|
| Meets PDF intent end-to-end | **No** |
| Safe for frontend integration on agreed subset | **Yes, with documented gaps** |
| Production-ready for client LAN | **No** (see §14) |
| Blocked by documented decisions | **Yes** — D01–D08, D12, D17, etc. |

Remediation plan (no code changed in audit run): **`docs/CLIENT_REQUIREMENTS_GAP_FIX_PLAN.md`**.

---

## 2. Independent PDF requirements inventory

Requirements below are taken **directly from the PDF text** (page markers `-- n of 4 --` in extracted text). Mapped IDs extend R01–R19 where needed.

| ID | Client requirement (faithful paraphrase) | PDF source |
|---|---|---|
| **BO-1** | Browser-based internal IT management system; dedicated in-house server; LAN browser access | BO §1 (p1) |
| **BO-2** | Employee records, department, contact, IT assignments | BO §2.1 (p1) |
| **BO-3** | Central inventory: categories, **quantities**, serials, locations; **manual unique asset code** | BO §2.2 (p1) |
| **BO-4** | POs, contracts, vendors, financial details, **supporting documents**, dates, renewals; **expiry notifications for contracts and POs** | BO §2.3 (p1) |
| **BO-5** | Invoices linked to PO, **contracts, vendors, budget**; payment status, amounts, **outstanding balances** | BO §2.4 (p1) |
| **BO-6** | Licenses, subscriptions, **renewals**, maintenance, repairs, agreements, expenses | BO §2.5 (p1) |
| **BO-7** | Issue/return to **employees or departments**; full transaction history; current status/location | BO §2.6 (p1) |
| **BO-8** | Annual budget: allocated, **committed**, **actual**, **utilized**, **remaining**; reports by year, PO, contract, vendor, category | BO §2.7 (p1) |
| **BO-9** | Unified relational DB; no duplicate isolated records | BO §3 (p2) |
| **BO-10** | Global search by PO number returns **single-screen** bundle: PO+contract, vendor+**documents**, invoices+**payments**+finance, purchased items+**asset codes**, issuance/returns, maintenance/software, **PO/contract expiry**, **budget allocation/utilization/remaining** | BO §3 bullets (p2) |
| **BO-11** | Standard **organizational** PDF/Excel documents: PO, contract, issue/return, invoice/expenditure, budget, asset reports | BO §4 (pp2–3) |
| **BO-12** | Manual asset codes used across inventory, forms, maintenance, transactions; **full asset history** (procurement, PO, cost, assignee, dates, maintenance, status) | BO §5 (p3) |
| **BO-13** | Authentication, **role-based** permissions, sensitive financial restrictions, **audit logs**, **backups & recovery** | BO §6 (pp3–4) |
| **BO-14** | Browser LAN, in-house server, relational DB, modular, reports/exports, auth/audit/backup | BO §7 (p3) |
| **DB-1** | 13 related tables with PKs/FKs as specified | DB §A–E (pp1–4) |
| **DB-2** | PO 1:N lines; PO 1:N partial invoices; movement history not overwritten; budget separate from allocations | DB p4 |
| **DB-3** | Issuance/return **document header/line** design for multi-asset forms | DB §C note (p2) |
| **DB-4** | Controlled templates; DB stores data + **references to generated files** | DB p4 |

R01–R19 in `SOURCE_TRACEABILITY.md` align with the above; **BO-3 (quantities)**, **BO-7 (departments)**, **BO-10 (full search bundle)**, and **BO-11 (PDF/Excel)** are the largest interpretive gaps versus code.

---

## 3. Complete traceability matrix (PDF → code → runtime)

Status legend: **FULL** | **PARTIAL** | **MISSING** | **BLOCKED** | **INCORRECT** | **UNVERIFIED**

| Req ID | Expected behavior (acceptance) | DB evidence | API evidence | Code evidence | Runtime evidence | Status | Gap |
|---|---|---|---|---|---|---|---|
| BO-1 / R01 | Internal LAN web app on dedicated server | N/A (deploy) | `GET /api/v1/health/*` | `apps/api/src/app.ts`, Docker compose | Health tests pass | **PARTIAL** | Backend only; no UI; prod deploy not executed |
| BO-2 / R02 | Employee CRUD, dept, contact, active | `employees.*` | `GET/POST/PATCH /employees`, `POST .../deactivate` | `employee.service.ts` | `auth-employees.test.ts` | **FULL** | “IT assignments” = via assets/movements, not separate assignment table |
| BO-3 / R03 | Unique manual `asset_code`; categories, serial, location, PO link | `assets`, `asset_categories`; unique `asset_code` | `POST/GET/PATCH /assets`, categories | `asset.service.ts` | `assets.test.ts` | **PARTIAL** | **No quantity-based stock** (BO lists quantities); one row per serialized asset only (**D09**) |
| BO-4 / R04 | Vendors, contracts, POs, attachments, expiry alerts (PO+contract) | `vendors`, `contracts`, `purchase_orders`; no PO expiry column | Vendors, contracts, PO CRUD, lines | `vendor.*`, `contract.*`, `purchase-order.*` | `procurement-flow`, `vendors.test.ts` | **PARTIAL** | PO workflow **BLOCKED**; PO expiry alerts **MISSING**; attachments weak (see BO-10) |
| BO-5 / R05 | Invoices per PO; balances; payments | `invoices`, `invoice_payments` | `POST/GET /invoices`, `POST .../payments`, `GET .../balance` | `invoice.service.ts` | `procurement-flow`, `finance-and-concurrency.test.ts` | **PARTIAL** | Links to contract/vendor/budget **via PO only**; no credit notes (**D05**); no `GET .../payments` list |
| BO-6 / R06 | Maintenance + licenses + renewals | `maintenance_records`, `software_licenses` | `/maintenance-records`, `/software-licenses` | `maintenance.service.ts`, `license.service.ts` | `extended-modules.test.ts` | **PARTIAL** | `POST .../renew` **BLOCKED** 403; subscription renewal workflow incomplete |
| BO-7 / R07 | Issue/return; multi-asset forms; history | `asset_transactions`, `asset_movement_documents`, lines | `POST /asset-issuances`, `/asset-returns`, `GET /assets/:id/history` | `asset-movement.service.ts` | `asset-issuance`, concurrency tests | **PARTIAL** | **Departments not supported** (**D10**); official forms PDF **BLOCKED** |
| BO-8 / R08 | Committed/actual/utilized/remaining + dimensional reports | `financial_years`, `budget_allocations`, `budget_transactions` | `/financial-years`, `/budget-allocations`, `/budget-ledger/entries`, `/budgets/:id/summary` | `budget.service.ts` | **None** (no budget HTTP tests) | **PARTIAL** | Only provisional `remainingProvisional`; no committed/actual split (**D06–D08**); **UNVERIFIED** calculations in CI |
| BO-9 / R09 | FK-linked data | Prisma `onDelete: Restrict`, indexes | — | `schema.prisma` | Procurement + search tests | **FULL** | — |
| BO-10 / R09 | PO search returns full bullet list on one view | Same | `GET /search/purchase-orders/:poNumber` | `search.service.ts` | `procurement-flow` (partial assert) | **PARTIAL** | Missing **supporting documents** in payload; budget **utilization/remaining** not summarized; **PO expiry** absent; result caps 50–100 rows |
| BO-11 / R10 | Org PDF/Excel downloads for listed report types | `stored_documents` (files only) | `/reports/*`, document generate | `report.service.ts`, `document.service.ts` | PDF **403** in `extended-modules.test.ts` | **MISSING** / **BLOCKED** | JSON/CSV ≠ compliance; **D12** |
| BO-12 / R03,R07 | Asset history across procurement, issue, maintenance | Columns + transactions | `GET /assets/:id/history`, maintenance by asset | `asset.repository.ts`, movements | Issuance tests | **PARTIAL** | History exists; **purchase cost** stripped without `assets.manage` (financial gating OK but narrow) |
| BO-13 / R11 | RBAC, audit, backups | `users`, `roles`, `permissions`, `audit_logs` | `/auth/*`, `/audit-events` | `auth.middleware.ts`, `audit.service.ts` | `rbac-isolation`, audit test | **PARTIAL** | No **user admin APIs**; seed roles **PROPOSED** (**D01**); backup script only (**D17**) |
| BO-14 / R13 | Modular maintainable backend | — | Module routers | `apps/api/src/modules/*` | Build/lint pass | **FULL** | Dashboard/UI not in scope |
| DB-1 | 13 baseline tables | All 13 in `schema.prisma` | Module APIs | Migrations | Integration tests touch all core areas | **FULL** | Plus extensions (lines, payments, movement docs) |
| DB-2 | PO lines, multi-invoice, append-only history | `purchase_order_lines`, `invoice_payments`, transactions | PO lines, invoices | `purchase-order.service.ts` | `po-line`, procurement tests | **FULL** | — |
| DB-3 | Document header/line for multi-asset forms | `asset_movement_documents`, lines | Issuance/return APIs | `asset-movement.service.ts` | Issuance tests | **FULL** | PDF generation **BLOCKED** |
| DB-4 | Template references for generated files | `stored_documents` only | Upload/download | `document.service.ts` | Upload test | **PARTIAL** | No `document_generations`; owner link not persisted |

---

## 4. Actual implemented API inventory

Base path: **`/api/v1`** (`apps/api/src/app.ts`). Auth: cookie `SESSION_COOKIE_NAME` (default `itdms_session`) or `Authorization: Bearer`.

| Method | Path | Permission | Service entry |
|---|---|---|---|
| GET | `/health/live` | public | `HealthController.live` |
| GET | `/health/ready` | public | `HealthController.ready` |
| POST | `/auth/login` | public (rate limited) | `AuthService.login` |
| POST | `/auth/logout` | authenticated | `AuthService.logout` |
| GET | `/auth/me` | authenticated | principal |
| GET/POST | `/employees`, GET/PATCH `/:id`, POST `/:id/deactivate` | read/write | `EmployeeService` |
| GET/POST | `/vendors`, GET/PATCH `/:id`, POST `/:id/archive` | read/manage | `VendorService` |
| GET/POST/PATCH | `/asset-categories` | read/manage | `AssetCategoryService` |
| GET/POST/PATCH | `/assets`, GET `/:id`, `/:id/history`, `/:id/current-holder`, `/:id/maintenance`, POST `/:id/retire` | read/manage/issue | `AssetService`, movements |
| GET/POST/PATCH | `/contracts`, GET `/:id`, GET `/:id/purchase-orders` | read/manage | `ContractService` |
| GET/POST/PATCH | `/purchase-orders`, GET `/:id`, GET `/by-number/:poNumber`, lines add/remove, GET `/:id/invoices` | read/manage | `PurchaseOrderService` |
| POST | `/purchase-orders/:id/submit\|approve\|cancel` | manage | **`assertWorkflowBlocked` → 403** |
| POST/GET | `/asset-issuances`, POST/GET `/asset-returns` | issue/return/read | `AssetMovementService` |
| GET/POST | `/invoices`, GET `/:id`, GET `/:id/balance`, POST `/:id/payments` | read/manage | `InvoiceService` |
| POST/GET | `/financial-years`, POST/GET `/budget-allocations`, POST `/budget-ledger/entries`, GET `/budgets/:budgetId/summary` | budgets read/manage | `BudgetService` |
| GET | `/search/purchase-orders/:poNumber` | `search.read` | `SearchService.byPurchaseOrderNumber` |
| GET/POST/PATCH/POST complete | `/maintenance-records` | maintenance read/manage | `MaintenanceService` |
| GET/POST/PATCH/POST renew | `/software-licenses` | licenses | **`renew` → 403** |
| POST | `/documents/uploads`, GET metadata/download, POST issuance/return generate | documents | `DocumentService` |
| GET/POST | `/notifications`, unread-count, mark read | notifications | `NotificationService` |
| POST | `/internal/jobs/expiry/run` | `jobs.run` | contract+license expiry only |
| GET | `/audit-events` | `audit.read` | `AuditService.list` |
| GET | `/reports/asset-register`, `/reports/budget-utilization` | `reports.read` | `ReportService` (json/csv only) |

**Not implemented (proposed in kit, absent in routers):** `/users/*`, `/invoices/:id/post`, `/invoices/:id/payments` GET, `/budgets/by-po/:id`, `/budgets/by-vendor/:id`, additional report endpoints, `/contracts/expiring` dedicated route (filter exists on list query).

---

## 5. Module-by-module functional compliance

### A. Employee management — **MOSTLY FULL**

Implemented fields match DB PDF (BO-2). Deactivate supported. No separate “IT assignment” entity beyond linking users to employees optionally in schema.

### B. IT inventory — **PARTIAL**

Serialized assets with unique codes, categories, serial, location, PO references: **verified**. BO **quantities** for consumables: **not implemented** (PO line quantity does not maintain stock levels).

### C. Procurement & contracts — **PARTIAL / BLOCKED**

CRUD, 1:N contract→PO, lines, totals: **verified**. Submit/approve/cancel: **BLOCKED (D03)**. Contract expiry notifications: **implemented** in job. **PO expiry**: **MISSING (D04)**. Supporting documents: upload exists but **not linked in DB/search**.

### D. Invoice management — **PARTIAL**

Multiple invoices, payment ledger, outstanding balance, idempotency, overpayment guard: **verified in tests**. Direct contract/vendor/budget linkage beyond PO: **not in schema**. Payment history endpoint: **missing**.

### E. Issuance & returns — **PARTIAL**

Multi-asset atomic issue/return, condition notes, holder, history, concurrency: **verified**. Department recipient: **MISSING (D10)**. Official issuance/return PDF: **BLOCKED (D12)**.

### F. Annual budget — **PARTIAL / UNVERIFIED**

Tables and manual APIs exist. Client’s committed/actual/utilized split and dimensional reporting: **not implemented**. No automated workflow tests.

### G. Maintenance & licenses — **PARTIAL**

CRUD, complete maintenance, license list redaction: **verified**. License renew POST: **BLOCKED**.

### H. Global search — **PARTIAL**

`SearchService` returns PO graph, movements, maintenance (asset-linked), licenses, budget transaction rows. **Does not meet BO-10** for vendor documents, budget utilization summary, or PO expiry date.

### I. Document generation — **NON-COMPLIANT with mandatory PDF/XLSX**

JSON/CSV exports and JSON movement document generation only. Client-required PDF/Excel: **403 or absent**.

### J. Security & administration — **PARTIAL**

Session auth, permission middleware, audit read API, financial field stripping on assets: **present**. Approved role matrix, user provisioning APIs, restore drill: **incomplete**.

---

## 6. Database compliance assessment

| Topic | Finding |
|---|---|
| 13 PDF tables | **Present** with field-level alignment; extensions documented in schema header |
| Missing PDF columns | None critical on baseline tables; **`purchase_orders` lacks expiry** (client alerts need **D04**) |
| Extra tables | Auth, PO lines, payments, movement docs, audit, notifications, stored docs — **justified** by DB p4 and BO, except **incomplete document linkage** |
| FKs & restrict | **Consistent** `onDelete: Restrict` |
| Unique constraints | `asset_code`, `po_number`, `contract_number`, `employee_number`, `invoice_number`, idempotency key |
| History retention | Asset transactions append-only; budget/invoice append patterns — **aligned with DB-2** |
| Risks | `stored_documents` without owner FK → orphaned files; budget `transaction_type` free text → reporting ambiguity until **D07** |

---

## 7. Business logic correctness assessment

| Area | Finding | Classification |
|---|---|---|
| Invoice balance / payments | Ledger sum; partial/paid status; overpayment 409; idempotency replay | **Verified** — not a defect |
| Concurrent issuance | One 201, one 409 | **Verified** |
| Multi-asset rollback | Ineligible asset rolls back entire issue | **Verified** |
| PO total recompute | Line add updates header | **Verified** (`po-line.test.ts`) |
| Budget remaining | Single subtraction ledger vs allocated | **Provisional** — may be **incorrect vs client** once D06/D07 defined |
| PO workflow | Always blocked | **Policy**, not bug |
| Search completeness | Omits documents & budget summary | **Implementation gap** |
| Document upload owner | Audit only | **Implementation gap** |

No confirmed **double-count** bug found in tested payment flows. Budget auto-posting absent, so double-count risk **untested** for future policy hooks.

---

## 8. End-to-end workflow test results (runtime)

Environment: `NODE_ENV=test`, PostgreSQL `127.0.0.1:5433`, `prepareTestDatabase()` (migrate + seed).

| # | Workflow | Client mapping | Evidence | Result |
|---|---|---|---|---|
| 1 | Vendor → contract → PO → lines → invoice → payments → search | BO-4,5,10 | `procurement-flow.test.ts` | **Pass** — search asserts invoices only |
| 2 | Employee → issue → holder → return → history | BO-7,12 | `asset-issuance.test.ts` | **Pass** |
| 3 | Concurrent dual issue same asset | BO-7 integrity | `finance-and-concurrency.test.ts` | **Pass** |
| 4 | Payments, overpay, idempotency cross-invoice | BO-5 | `finance-and-concurrency.test.ts` | **Pass** |
| 5 | Financial year → allocation → ledger → summary | BO-8 | *No test* | **UNVERIFIED** |
| 6 | PO search all related entities | BO-10 | Partial assert in procurement | **PARTIAL** — not all bullets asserted |
| 7 | License + maintenance + expiry job | BO-4,6 | `extended-modules.test.ts` | **Pass** (no PO expiry) |
| 8 | RBAC read-only vs write | BO-13 | `rbac-isolation.test.ts` | **Pass** |
| 9 | PDF/XLSX reports | BO-11 | `extended-modules` expects 403 PDF | **Expected gap** |
| 10 | Audit + rollback | BO-13, DB-2 | Concurrency + audit list tests | **Pass** |

---

## 9. Verification commands (Step 9)

Executed from repo root on **2026-10-31** (audit session):

| Command | Result |
|---|---|
| `npm run typecheck` | **PASS** |
| `npm run lint` | **PASS** |
| `npm run build` | **PASS** |
| `npm run test` | **PASS — 30 tests, 14 files** (~320s, serial) |

**Environmental notes:** Tests require local Postgres on port **5433** per `tests/setup.ts`. PDF text re-read via repository files (binary extract in IDE). No production DB used. **No new integration tests added** in this audit run (remediation phase may add budget/search assertions).

Test file index: `apps/api/tests/http/*`, `apps/api/tests/integration/*`, `apps/api/tests/unit/*`.

---

## 10. Missing client features (summary)

- Organizational **PDF/Excel** outputs (BO-11)  
- **PO expiry** reminders (BO-4)  
- **PO approval** lifecycle (BO-4, DB status without rules)  
- Budget **committed/actual/utilized** model and reports (BO-8)  
- **Quantity/consumable** inventory (BO-3)  
- **Department** issuance (BO-7)  
- **License renewal** workflow POST (BO-6)  
- Global search: **documents + budget utilization/remaining** on PO screen (BO-10)  
- **User/role admin** HTTP APIs (BO-13)  
- **Restore drill** sign-off (BO-13, R12)  
- Frontend browser application (BO-1, BO-14) — out of backend scope  

---

## 11. Incorrect implementations

| Item | Detail | Severity |
|---|---|---|
| None confirmed as **contradicting** PDF in tested financial/issuance flows | — | — |
| **Risk:** treating JSON/CSV as BO-11 compliance | Documented as gap, not labeled FULL | Process |
| **Risk:** `remainingProvisional` labeled as “remaining balance” without client accounting | Misleading for finance users until D06/D07 | Medium |

---

## 12. Partial / blocked requirements

See §3 matrix. Primary **BLOCKED** endpoints: `POST /purchase-orders/:id/submit|approve|cancel`, `POST /software-licenses/:id/renew`, report/document `format=pdf|xlsx`, automatic budget commit (`BudgetService.autoCommitFromPoBlocked`).

---

## 13. Unnecessary or unapproved additions

| Addition | Notes |
|---|---|
| `notification_events`, internal expiry job | Supports contract expiry; PO part explicitly deferred — **acceptable** |
| Auth/RBAC tables | Required for BO-13; matrix **unapproved** |
| `invoice_payments.idempotency_key` | Engineering hardening — **not in PDF** but not harmful |
| Dev seed `admin.dev` | **Not** client-approved production identity |

---

## 14. Critical defects & security findings

| ID | Finding | Severity |
|---|---|---|
| SEC-1 | Dev admin seed has broad permissions until **D01** | High for prod |
| SEC-2 | Document download authorized by `documents.read` without owner-scoped ACL | Medium (**D13**) |
| SEC-3 | No virus scan on upload (MIME allow-list only) | Medium (**D13**) |
| SEC-4 | Session cookie + bcrypt sessions — reasonable; no MFA (**D22**) | Policy |
| SEC-1..n prior | Path traversal on storage hardened in prior session | Addressed in code |

No open **P0 code defect** found in payment/idempotency/concurrency tests.

---

## 15. Required client decisions

See `requirements/reference/DECISION_REGISTER.md` **D01–D24**. Minimum to close PDF gaps: **D03, D04, D05–D08, D09, D10, D12, D13, D14, D17, D21**.

---

## 16. Prioritized remediation plan

See **`docs/CLIENT_REQUIREMENTS_GAP_FIX_PLAN.md`** (GAP-001 through GAP-015).

---

## 17. Readiness verdict for frontend integration

| Layer | Verdict |
|---|---|
| **Integrate now (with UX caveats)** | Auth, employees, vendors, categories, assets (serialized), draft PO + lines, invoices + payments, issuance/return, maintenance, licenses (no renew), notifications, audit read, CSV/JSON reports, PO search hub |
| **Do not promise in UI until backend/policy closed** | PO approve/submit, PDF/Excel downloads, budget committed/actual charts, PO expiry alerts, department issue, consumable qty stock, license renew button |
| **Production go-live** | **Not ready** — templates, RBAC sign-off, finance rules, restore drill, deployment **D17** |

**Bottom line:** The backend is a **credible partial implementation** of the PDFs with **strong integrity** in tested procurement and asset flows, but it **does not fully satisfy** the client’s stated requirements—especially **BO-10 (complete PO search)**, **BO-11 (PDF/Excel)**, **BO-8 (budget semantics)**, and **BO-4 (PO expiry + workflow)**.

---

## Appendix A — Code references (samples)

- Global search payload: `apps/api/src/modules/search/search.service.ts` — `byPurchaseOrderNumber`  
- PO workflow block: `apps/api/src/modules/purchase-orders/purchase-order.service.ts` — workflow guard  
- Payment ledger: `apps/api/src/modules/invoices/invoice.service.ts` — `recordPayment`, `getBalance`  
- Movement atomicity: `apps/api/src/modules/asset-movements/asset-movement.service.ts` — `issueAssets`  
- Document upload without owner FK: `apps/api/src/modules/documents/document.service.ts` — `upload`  
- Report format gate: `apps/api/src/modules/reports/report.service.ts` — `assertFormatAllowed`  

---

*End of audit report.*
