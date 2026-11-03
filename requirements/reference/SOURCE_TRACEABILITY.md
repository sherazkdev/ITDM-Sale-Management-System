# Requirements Traceability — Supplied PDF Sources

Source shorthand: **BO** = `Background and Objective.pdf` (4 pages), **DB** = `Database structure.pdf` (4 pages). Page references refer to the supplied PDFs. Derived technical design is labeled **PROPOSED** and is not client-confirmed.

| ID | Exact requirement / decision in source (paraphrased) | Source page(s) | Implementation phases |
|---|---|---|---|
| R01 | Browser-based internal IT department software hosted on dedicated in-house server and LAN | BO p1, p3 | P01, P19 |
| R02 | Employee records, department, contact information, IT assignments | BO p1; DB p1 | P04 |
| R03 | Central IT inventory with categories, quantities, serials, location; manually assigned unique asset code | BO p1, p3; DB p1, p4 | P06, P09 |
| R04 | Vendors, contracts, POs, values, attachments, dates, renewals and expiry alerts | BO p1; DB p1–p2,p4 | P05, P07, P08, P14, P16 |
| R05 | Invoices associated with POs/financial context, balances and payment status | BO p1; DB p2,p4 | P10, P11 |
| R06 | Software licenses, subscription renewal and asset repair/maintenance/agreements | BO p1; DB p3 | P12, P13 |
| R07 | Issue/return assets to employees/departments; movement history and current condition/location | BO p1,p3; DB p2–p3 | P09 |
| R08 | Annual budget allocation, committed, actual, utilized, remaining by year/PO/contract/vendor/category | BO p1; DB p3–p4 | P11, P18 |
| R09 | Unified relational DB, links not redundant records; PO-number global linked retrieval | BO p2; DB p1 | P02, P15 |
| R10 | Organizational templates for PO, contract, issue/return, invoice, expenditure, budget and asset reports; PDF/Excel | BO p2–p3; DB p4 | P14, P18 |
| R11 | Authentication, role-based permissions, sensitive financial access control, audit logs | BO p3 | P03, P17 |
| R12 | Regular DB backups and recovery | BO p3 | P17, P19 |
| R13 | Modular, maintainable, dashboard-friendly but backend first in this plan | BO p3–p4 | P00–P19, frontend later |
| R14 | PO and contract are separate; 1 contract may have multiple POs | DB p4 | P07, P08 |
| R15 | POs contain multiple product/service lines | DB p4 | P08 |
| R16 | POs can have multiple, partial invoices | DB p4 | P10 |
| R17 | Issuance documents can cover multiple assets; header/line tables to be designed | DB p3 | P09, P14 |
| R18 | Keep asset transactions rather than overwriting; separate budgets and financial transactions to prevent double counting | DB p4 | P09, P11 |
| R19 | Store references to generated documents using controlled templates | DB p4 | P14 |

## Confirmed baseline tables (13)
`employees`, `assets`, `asset_categories`, `vendors`, `purchase_orders`, `contracts`, `invoices`, `asset_transactions`, `maintenance_records`, `software_licenses`, `financial_years`, `budget_allocations`, `budget_transactions` (DB pp1–4).

## PROPOSED additions (NOT defined as finished schema by PDF)
`users`, `roles`, `permissions`, join tables, `purchase_order_lines`, `invoice_payments`, `asset_document_headers`, `asset_document_lines`, `audit_logs`, `stored_documents`, `notification_events`, optional `departments`, `stock_items`, `license_assignments` and renewal records. Confirm normalization and workflows before migrating.

## Gaps: do not invent source authority
- Source does **not** prescribe Express, Next.js, Prisma, PostgreSQL version, JWT vs sessions, user roles, or exact REST endpoints.
- Source does **not** specify exact PO lifecycle, approval authority, partial payment behavior, settlement calculation, expiry lead times, Excel layouts, or asset-department issue representation.
- Source gives no real existing blank forms, server topology, backup schedule, currency policy, initial users, or sample data.
- Source lists quantity-based inventory and per-physical-asset codes simultaneously; consumables vs trackable assets is unresolved.

## Phase sign-off rule
A feature can be called compliant only after source ID mapping, accepted business interpretation, implementation, tests and evidence are recorded.
