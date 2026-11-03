# Entity-Relationship Diagram — Provisional (P00)

Visual companion to `docs/db-schema-proposal.md`. **PROPOSED** entities shown with dashed semantics in legend.

## Legend

- Solid lines: source 13-table relationships (DB traceability).
- `(P)` suffix: PROPOSED extension not in source PDF schema.

## Core procurement and finance

```mermaid
erDiagram
    VENDORS ||--o{ CONTRACTS : has
    VENDORS ||--o{ PURCHASE_ORDERS : receives
    CONTRACTS o|--o{ PURCHASE_ORDERS : covers
    PURCHASE_ORDERS ||--o{ PURCHASE_ORDER_LINES_P : contains
    PURCHASE_ORDERS ||--o{ INVOICES : billed
    INVOICES ||--o{ INVOICE_PAYMENTS_P : settled_by
    PURCHASE_ORDERS ||--o{ ASSETS : procures
    PURCHASE_ORDER_LINES_P o|--o{ ASSETS : line_provenance
    FINANCIAL_YEARS ||--o{ BUDGET_ALLOCATIONS : defines
    BUDGET_ALLOCATIONS ||--o{ BUDGET_TRANSACTIONS : ledger
    PURCHASE_ORDERS o|--o{ BUDGET_TRANSACTIONS : commits
    INVOICES o|--o{ BUDGET_TRANSACTIONS : posts
```

## Inventory, issuance, operations

```mermaid
erDiagram
    ASSET_CATEGORIES ||--o{ ASSETS : classifies
    EMPLOYEES ||--o{ ASSET_TRANSACTIONS : involved
    ASSETS ||--o{ ASSET_TRANSACTIONS : history
    ASSET_DOCUMENT_HEADERS_P ||--|{ ASSET_DOCUMENT_LINES_P : contains
    ASSET_DOCUMENT_LINES_P }o--|| ASSETS : references
    ASSET_DOCUMENT_LINES_P }o--|| ASSET_TRANSACTIONS : links
    ASSETS o|--o{ MAINTENANCE_RECORDS : repaired
    CONTRACTS o|--o{ MAINTENANCE_RECORDS : covered
    VENDORS o|--o{ MAINTENANCE_RECORDS : services
    VENDORS o|--o{ SOFTWARE_LICENSES : supplies
    PURCHASE_ORDERS o|--o{ SOFTWARE_LICENSES : procures
```

## Security and documents (PROPOSED)

```mermaid
erDiagram
    USERS_P ||--o{ USER_ROLES_P : has
    ROLES_P ||--o{ USER_ROLES_P : assigned
    ROLES_P ||--o{ ROLE_PERMISSIONS_P : grants
    PERMISSIONS_P ||--o{ ROLE_PERMISSIONS_P : includes
    USERS_P ||--o{ SESSIONS_P : authenticates
    USERS_P o|--o{ AUDIT_LOGS_P : actor
    STORED_DOCUMENTS_P o|--o{ CONTRACTS : attachment
    STORED_DOCUMENTS_P o|--o{ PURCHASE_ORDERS : attachment
    DOCUMENT_TEMPLATES_P ||--o{ DOCUMENT_GENERATIONS_P : renders
```

## Cardinality notes

| Edge | Cardinality | Source |
|---|---|---|
| Contract → PO | 1:N | R14 / DB p4 |
| PO → Invoice | 1:N | R16 |
| PO → Line | 1:N | R15 PROPOSED |
| Asset → Transaction | 1:N | R18 |
| Issue document → Assets | N:M via lines | R17 PROPOSED |

## PO 360 read paths (logical)

For R09 search, authorized joins traverse: `purchase_orders` → `vendors`, `contracts`, `purchase_order_lines`, `invoices`, `invoice_payments`, `assets`, `asset_transactions`, `employees`, `maintenance_records`, `software_licenses`, `budget_transactions`, `stored_documents` — each section permission-filtered.

## Approval gate

ERD must be reconciled with restored PDFs and signed decisions before P02 migration SQL is applied.
