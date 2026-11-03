# P02 Schema Preparation Report (Draft — Approval Gate)

**Phase:** P02 preparation only (no migration execution)  
**Date:** 2026-10-31  
**Status:** **AWAITING STAKEHOLDER SIGN-OFF** — not VERIFIED  
**Prisma:** 6.8.2 | **PostgreSQL target:** 16.8 (Docker Compose)

---

## 1. Scope completed

| Action | Done |
|---|---|
| Draft baseline Prisma schema (13 PDF tables) | `apps/api/prisma/schema.prisma` |
| Proposed extensions documented separately | `apps/api/prisma/schema.proposed.prisma` (not loaded by CLI) |
| `prisma format` / `prisma validate` / `prisma generate` | Yes |
| `prisma migrate dev` / `db push` / data reset | **No** |
| CRUD APIs / frontend | **No** |

---

## 2. Baseline tables and relationships

### Tables (13)

| Prisma model | PostgreSQL table | Primary business unique key(s) |
|---|---|---|
| `Employee` | `employees` | `employee_number` |
| `AssetCategory` | `asset_categories` | `category_name` |
| `Vendor` | `vendors` | — |
| `Contract` | `contracts` | `contract_number` |
| `PurchaseOrder` | `purchase_orders` | `po_number` |
| `Invoice` | `invoices` | `invoice_number` |
| `Asset` | `assets` | `asset_code` (manual, R03) |
| `AssetTransaction` | `asset_transactions` | — (append-only history) |
| `MaintenanceRecord` | `maintenance_records` | — |
| `SoftwareLicense` | `software_licenses` | — |
| `FinancialYear` | `financial_years` | `year_name` |
| `BudgetAllocation` | `budget_allocations` | — |
| `BudgetTransaction` | `budget_transactions` | — (append-only ledger) |

### Relationship summary

| From | To | Cardinality | `onDelete` |
|---|---|---|---|
| Vendor | Contract, PurchaseOrder | 1:N | Restrict |
| Contract | PurchaseOrder | 1:N (optional FK on PO) | Restrict |
| PurchaseOrder | Invoice, Asset, SoftwareLicense | 1:N | Restrict |
| AssetCategory | Asset | 1:N | Restrict |
| Asset | AssetTransaction | 1:N | Restrict |
| Employee | AssetTransaction | 1:N (optional `employee_id`) | Restrict |
| FinancialYear | BudgetAllocation | 1:N | Restrict |
| BudgetAllocation | BudgetTransaction | 1:N | Restrict |
| PurchaseOrder / Invoice | BudgetTransaction | optional N:1 | Restrict |
| Asset / Contract / Vendor | MaintenanceRecord | optional N:1 | Restrict |

### Indexes

- Foreign key columns indexed on all major relations (PO, invoice, asset, budget, maintenance, license expiry).

### Money fields

All monetary amounts use `@db.Decimal(18, 2)` (`Decimal` in Prisma):  
`contract_value`, `total_amount`, `invoice_amount`, `purchase_cost`, `cost`, `renewal_cost`, `allocated_amount`, `amount` (budget).

### Referential integrity

- **No `onDelete: Cascade`** on history or financial links (aligns with D16 direction and P02 spec).
- **`purchase_orders.expiry_date`:** intentionally **absent** (D04 OPEN).

### Baseline design choices (documented, not PDF columns)

| Choice | Rationale |
|---|---|
| `BigInt` surrogate PKs with `@default(autoincrement())` | Engineering standard; business codes remain separate unique columns |
| `AssetTransactionType` enum (`issue` / `return`) | Matches PDF literals only; not an extended workflow enum |
| `processed_by` as `String?` | PDF field preserved; **not** a `User` FK until auth schema approved (D01/D02) |
| `status` / `payment_status` / `transaction_type` as `VarChar` | Avoids inventing approved enum policies (D03, D05, D07) |
| `document_path` on contract/PO | PDF field; future `stored_documents` FK in P14 (D12/D13) |

---

## 3. Prisma validation results (2026-10-31)

```text
npx prisma format   → Formatted prisma/schema.prisma
npx prisma validate → The schema at prisma/schema.prisma is valid
npx prisma generate → Generated Prisma Client (v6.8.2)
npx prisma migrate status → No migration found in prisma/migrations
                          → Database not managed by Prisma Migrate (unchanged)
```

**Post-schema tooling:**

```text
npm run typecheck → PASS
npm run lint      → PASS
npm run test      → PASS (8/8) — health integration still uses SELECT 1 only; no business tables required
```

**No `prisma/migrations/` directory created.**

---

## 4. Baseline vs proposed extensions

| Area | Baseline (`schema.prisma`) | Proposed (`schema.proposed.prisma`) | Blocker |
|---|---|---|---|
| 13 PDF tables | Included | — | Sign-off on baseline |
| PO line items | **Not included** | `purchase_order_lines` sketch | R15 + stakeholder approval |
| Auth / RBAC | **Not included** | `users`, `roles`, `permissions`, sessions | D01, D02, D22 |
| Invoice payments | **Not included** | `invoice_payments` ledger | D05 |
| Issuance documents | **Not included** | header/line tables | D10, R17 |
| Stock / consumables | **Not included** | `stock_items`, movements | D09 |
| Departments master | **Not included** | `departments` + FK migration | D18 |
| Documents | `document_path` strings only | `stored_documents`, templates | D12, D13 |
| Audit / notifications | **Not included** | `audit_logs`, `notification_events` | P16/P17 |
| PO expiry column | **Not included** | — | D04 |

---

## 5. Missing entities analysis (for later phases)

### Purchase order lines (critical for R15)

- Source DB p4 states a PO may contain many items/services.
- Baseline PO has `total_amount` only; **without lines**, line-level procurement and asset-to-line provenance cannot be modeled in P08.
- **Recommendation:** separate migration tranche after explicit approval to add `purchase_order_lines` and optional `assets.purchase_order_line_id`.

### Authentication

- Required for P03; employees remain separate from login users per blueprint.
- `processed_by` should become a user FK only after auth tables are approved.

### Payments

- PDF `invoices` has `payment_status` / `payment_date` but BO requires outstanding balances and partial payments.
- **Do not** treat status column as authoritative ledger; `invoice_payments` deferred (D05).

### Issuance documents

- DB p3 notes header/line tables for multi-asset forms; baseline uses `asset_transactions` only.
- Department as recipient (BO) vs employee FK only (DB) remains **D10**.

### Inventory stock

- BO mentions quantities; DB uses unique asset codes per physical item.
- Consumable/stock ledger **deferred** (D09).

---

## 6. Pending stakeholder decisions (migration blockers)

| ID | Impact on next migration step |
|---|---|
| D01–D02 | Auth extension tranche |
| D03 | PO `status` allowed values (currently varchar) |
| D04 | PO expiry column |
| D05–D06 | Payment ledger + invoice status semantics |
| D07–D08 | Budget `transaction_type` meaning + currency rules |
| D09 | Stock tables vs serialized assets only |
| D10 | Issuance holder (employee vs department) |
| D11 | Asset status vocabulary |
| D15 | Global vs scoped uniqueness for invoice/PO numbers |
| D16 | Soft delete / archive columns (not added in baseline draft) |

Sign-off sheet: `docs/decision-meeting-packet.md` §6.

---

## 7. Migration readiness

| Criterion | State |
|---|---|
| Draft baseline schema | Ready for review |
| Stakeholder baseline approval | **Pending** |
| Reviewed SQL migration | **Not started** (no migrate) |
| P02 integration tests (FK/unique) | **Blocked** until migrate in controlled test DB |
| Production / shared DB safety | **No schema changes applied** |

### Recommended migration sequence (after approval)

1. **Tranche A:** 13 baseline tables + indexes + uniques + Restrict FKs.  
2. **Tranche B (optional approval):** `purchase_order_lines`.  
3. **Tranche C+:** auth, payments, issuance docs, stock — per decision register.

Use dedicated `SHADOW_DATABASE_URL` / test DB for first `prisma migrate dev`; never against production.

### Integration test safety

- Tests default to Docker dev DB (`127.0.0.1:5433`) or `ITDMS_TEST_DATABASE_URL`.
- No migrate in test suite; health checks use `$queryRaw` only — **no business seed/mutate** until P02 migration phase with isolated DB.
- Set `ITDMS_USE_EMBEDDED_PG=true` only for local fallback.

---

## 8. Client approval required

Before marking P02 **VERIFIED**, stakeholders must confirm:

1. **Baseline 13-table draft** in `schema.prisma` matches PDF intent (including `processed_by` as text interim).  
2. Whether **Tranche B** (`purchase_order_lines`) is included in the first migration or deferred.  
3. Acceptance that **payment, budget, PO workflow, and issuance** behavior remains **blocked at application layer** until D03–D10 decisions are recorded.

---

## 9. Gate

**Stopped at P02 schema approval gate.**  
Next step after sign-off: implement reviewed `prisma migrate` + P02 constraint integration tests (still no CRUD APIs).
