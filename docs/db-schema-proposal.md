# Database Schema Proposal (Provisional — No Migrations in P00)

**Purpose:** Stakeholder review artifact for P02. **Not approved SQL.** Extensions labeled **PROPOSED**.

## Conventions (PROPOSED for P02)

| Topic | Proposal |
|---|---|
| Primary keys | `bigint` identity or UUID — pick one in P02 and apply consistently |
| Business identifiers | Unique constraints on `employee_number`, `asset_code`, `po_number`, `contract_number`, `invoice_number` (scope rules D15) |
| Money | `numeric(18,2)` in PostgreSQL; API decimal strings |
| Timestamps | `timestamptz` UTC storage; business TZ for reports (D23) |
| Deletes | No cascade on history/finance (D16); soft archive preferred |
| Employees vs users | Separate tables; `processed_by` → `users.id` PROPOSED |

---

## Source baseline — 13 tables attribute matrix

Legend: **SRC** = stated in DB PDF via traceability; **INF** = inferred nullability/typing for PostgreSQL; **?** = confirm when PDFs restored.

### `employees` (SRC: DB p1)

| Column | Type (proposal) | Null | Unique | Notes |
|---|---|---|---|---|
| employee_id | PK | N | Y | |
| employee_number | varchar | N | Y | Business ID |
| full_name | varchar | N | | |
| department | varchar | ? | | Text field until D18 |
| designation | varchar | Y | | |
| contact_number | varchar | Y | | |
| email | varchar | Y | | |
| is_active | boolean | N | | Default true |

### `asset_categories` (SRC: DB p1)

| Column | Type | Null | Unique |
|---|---|---|---|
| category_id | PK | N | Y |
| category_name | varchar | N | Y (policy) |
| description | text | Y | |

### `assets` (SRC: DB p1, p4)

| Column | Type | Null | Unique | Notes |
|---|---|---|---|---|
| asset_id | PK | N | Y | |
| asset_code | varchar | N | **Y (global)** | Manual entry R03 |
| asset_name | varchar | N | | |
| category_id | FK | N | | → asset_categories |
| serial_number | varchar | Y | | |
| purchase_order_id | FK | Y | | → purchase_orders |
| purchase_date | date | Y | | |
| purchase_cost | numeric(18,2) | Y | | ≥ 0 check |
| asset_status | varchar/enum | N | | Values D11 |
| current_location | varchar | Y | | |

**PROPOSED add:** `purchase_order_line_id` FK nullable after lines table approved.

### `vendors` (SRC: DB p1)

| Column | Type | Null | Unique |
|---|---|---|---|
| vendor_id | PK | N | Y |
| vendor_name | varchar | N | |
| registration_number | varchar | Y | ? unique if business wants |
| contact_person | varchar | Y | |
| phone | varchar | Y | |
| email | varchar | Y | |
| address | text | Y | |

### `contracts` (SRC: DB p1–2)

| Column | Type | Null | Unique |
|---|---|---|---|
| contract_id | PK | N | Y |
| contract_number | varchar | N | Y |
| vendor_id | FK | N | |
| start_date | date | N | |
| expiry_date | date | N | |
| contract_value | numeric(18,2) | Y | |
| renewal_status | varchar | Y | |
| document_path | varchar | Y | Replace with stored_documents FK in P14 |

### `purchase_orders` (SRC: DB p2, p4)

| Column | Type | Null | Unique | Notes |
|---|---|---|---|---|
| purchase_order_id | PK | N | Y | |
| po_number | varchar | N | Y | |
| vendor_id | FK | N | | |
| contract_id | FK | Y | | 1 contract : N POs R14 |
| po_date | date | N | | |
| total_amount | numeric(18,2) | N | | Matches lines sum |
| currency | char(3) | N | | D08 |
| status | varchar | N | | D03 |
| document_path | varchar | Y | | P14 migration |

**Not in DB baseline:** `expiry_date` — do not add without D04.

### `invoices` (SRC: DB p2, p4)

| Column | Type | Null | Unique |
|---|---|---|---|
| invoice_id | PK | N | Y |
| invoice_number | varchar | N | Y (scoped) |
| purchase_order_id | FK | N | | N invoices per PO R16 |
| invoice_date | date | N | |
| invoice_amount | numeric(18,2) | N | |
| payment_status | varchar | N | Derived vs authoritative D05 |
| payment_date | date | Y | Last payment? clarify D05 |

### `asset_transactions` (SRC: DB p2–3)

| Column | Type | Null | Unique | Notes |
|---|---|---|---|---|
| transaction_id | PK | N | Y | Append-only R18 |
| asset_id | FK | N | | |
| employee_id | FK | Y | | Department holder D10 |
| transaction_type | enum issue/return | N | | |
| transaction_date | timestamptz | N | | |
| condition_notes | text | Y | | |
| reference_number | varchar | Y | | |
| processed_by | FK user | Y | | PROPOSED |
| remarks | text | Y | | |

### `maintenance_records` (SRC: DB p3)

| Column | Type | Notes |
|---|---|---|
| maintenance_id | PK | |
| asset_id | FK nullable | At least one of asset/contract/vendor? validate in service |
| contract_id | FK nullable | |
| vendor_id | FK nullable | |
| maintenance_type | varchar | |
| request_date | date | |
| completion_date | date nullable | |
| cost | numeric(18,2) | |
| status | varchar | |
| remarks | text | |

### `software_licenses` (SRC: DB p3)

| Column | Type | Notes |
|---|---|---|
| license_id | PK | |
| software_name | varchar | |
| license_key_reference | varchar | Not raw key D21 |
| vendor_id | FK nullable | |
| purchase_order_id | FK nullable | |
| start_date | date | |
| expiry_date | date | |
| license_quantity | int | ≥ 1 |
| renewal_cost | numeric | |
| status | varchar | |

### `financial_years` (SRC: DB p3–4)

| Column | Type | Notes |
|---|---|---|
| financial_year_id | PK | |
| year_name | varchar | Unique |
| start_date | date | D23 boundaries |
| end_date | date | |
| status | varchar | open/closed PROPOSED |

### `budget_allocations` (SRC: DB p4)

| Column | Type | Notes |
|---|---|---|
| budget_id | PK | |
| financial_year_id | FK | |
| budget_category | varchar | |
| allocated_amount | numeric | |
| currency | char(3) | D08 |

### `budget_transactions` (SRC: DB p4)

| Column | Type | Notes |
|---|---|---|
| budget_transaction_id | PK | Append-only |
| budget_id | FK | |
| purchase_order_id | FK nullable | |
| invoice_id | FK nullable | |
| transaction_type | varchar | Semantics D07 |
| amount | numeric | |
| transaction_date | date | |
| remarks | text | |

---

## PROPOSED extensions (conditional approval)

| Group | Tables | Depends on |
|---|---|---|
| Auth | `users`, `roles`, `permissions`, `user_roles`, `role_permissions`, `sessions` | D01, D02, D22 |
| Procurement lines | `purchase_order_lines` | R15 — safe to migrate early if line shape approved |
| Payments | `invoice_payments` (+ optional reversals) | D05 |
| Issuance docs | `asset_document_headers`, `asset_document_lines` | D10, R17 |
| Files | `stored_documents`, `document_templates`, `document_generations` | D12, D13 |
| Ops | `audit_logs`, `notification_events` | P17, D14 |
| Optional masters | `departments`, `stock_items`, `stock_movements` | D09, D18 |

## P02 migration scope recommendation

**Safe first migration (baseline only):** 13 source tables + indexes/FKs + unique on codes + check constraints where non-controversial (non-negative money/qty).

**Hold until decision:** `invoice_payments`, budget event enums, PO expiry column, department holder columns, consumable stock tables, approval state side effects.

## Deletion / FK behavior (proposal)

| Relationship | ON DELETE |
|---|---|
| PO → invoices | RESTRICT |
| Asset → transactions | RESTRICT |
| Vendor → PO | RESTRICT if PO exists |
| Category → assets | RESTRICT |

## Schema review checklist (P00)

- [x] All 13 baseline tables listed with columns
- [x] Conflicts documented (quantity vs code, department issue, PO expiry, payments)
- [x] Extensions separated and tied to decision IDs
- [ ] Stakeholder sign-off recorded in `DECISION_REGISTER.md`
