# Decision Meeting Packet — P00 (Stakeholder Review)

**Meeting purpose:** Approve provisional data model baseline for P02 and assign owners to OPEN business decisions.  
**Date prepared:** 2026-10-28  
**Backend scope only** — no UI/dashboard.

## 1. Executive summary

The ITDMS backend will be a modular monolith (`docs/adr/0001-modular-monolith.md`) on PostgreSQL, implementing client capabilities R01–R19 in phased delivery. Source PDFs in `requirements/` were audited on 2026-10-28 (BO 4 pages, DB 4 pages).

## 2. Artifacts for review

| Document | Content |
|---|---|
| `docs/requirements-coverage.md` | R01–R19 → phases, conflicts |
| `docs/domain-workflows.md` | WF-01–WF-09 scenarios |
| `docs/db-schema-proposal.md` | 13-table matrix + PROPOSED extensions |
| `docs/erd.md` | Relationship diagrams |
| `docs/api-plan.md` | DRAFT REST surface (no code yet) |

## 3. Decisions required before production behavior

### Blocks P02 schema extensions or P03+ behavior

| ID | Topic | Question for business | Suggested default (NOT approved) |
|---|---|---|---|
| D01 | Roles | List roles and permission matrix | Configurable permissions; deny default |
| D02 | Auth source | LDAP/SSO vs local accounts | Local sessions first |
| D09 | Consumables | Serialized assets vs quantity stock | Separate stock ledger |
| D10 | Issuance holder | Employee only vs department | Holder type enum |
| D05 | Payments | Partial pay / outstanding formula | Payment ledger table |
| D07 | Budget events | Commit vs actual vs release | Append-only ledger types |

### Blocks specific features (can migrate baseline 13 tables in P02)

| ID | Blocks |
|---|---|
| D03 | PO approve/cancel workflow |
| D04 | PO expiry alerts |
| D06 | When actual spend hits budget |
| D08 | Multi-currency |
| D11 | Asset status transitions |
| D12 | Official PDF/Excel templates |
| D13 | Upload limits / AV scan |
| D14 | Reminder lead times |
| D15 | Document/PO numbering rules |
| D16 | Soft delete policy |
| D21 | License key storage |
| D22 | MFA / password reset |
| D23 | Fiscal year / timezone |

### Deployment / optional

| ID | Notes |
|---|---|
| D17 | On-prem OS, TLS, backup schedule — P19 |
| D18 | Department master table |
| D19–D20, D24 | Imports, SLA, multi-company |

## 4. Recommended P02 scope if meeting approves “baseline only”

**Include in first migration:** 13 source tables, FKs, unique business codes, numeric money, timestamptz audit columns (PROPOSED), RESTRICT deletes on financial/history.

**Defer:** `invoice_payments`, PO expiry column, department holder, stock tables, auth tables until D01/D02/D05/D09/D10 answered (or implement auth skeleton only with explicit draft policy in P03).

## 5. Conflicts needing explicit business choice

1. **Quantity inventory vs unique asset codes** (D09) — affects P06 model.
2. **Department as issuance recipient** (D10) — affects P09 schema/API.
3. **PO expiry** (D04) — BO mentions alerts; DB table has no field.
4. **Payment outstanding** (D05) — needs ledger beyond invoice status column.

## 6. Sign-off sheet (fill in meeting)

| Item | Approver | Date | Notes |
|---|---|---|---|
| Baseline 13-table migration | | | |
| PROPOSED extension list | | | |
| Permission model approach (D01) | | | |
| PDF audit confirmed | | | BO + DB read 2026-10-28 |

## 7. Next engineering phase after P00

**P01 — Backend foundation:** `apps/api`, Docker PostgreSQL, health endpoints, lint/test toolchain. No business schema until P02 gate.
