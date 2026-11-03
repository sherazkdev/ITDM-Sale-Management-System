# ITDMS Backend — Release & Requirements Report (2026-10-31)

**Status:** Backend implementation **complete for engineering scope P00–P19**; **NOT production-ready** until client decisions and acceptance sign-off.

## Verification evidence

| Check | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS |
| `npm run test` | **30/30 PASS** (14 files) |
| DB migrations (local dev) | Applied through `20261031084710_notification_read_at` |

## Implemented & tested (HTTP + PostgreSQL)

| Module | Phase | Notes |
|---|---|---|
| Foundation, health, tooling | P01 | Preserved |
| Core schema + migrations | P02 | Dev DB only |
| Auth, sessions, RBAC (configurable) | P03 | PROPOSED seed role (D01/D02) |
| Employees | P04 | |
| Vendors | P05 | Archive via `is_active` (D16 provisional) |
| Assets & categories | P06 | Status via movement service; PROPOSED states (D11) |
| Contracts | P07 | Renewal endpoint blocked where specified |
| Purchase orders + lines | P08 | Draft CRUD; workflow submit/approve/cancel **blocked D03** |
| Issuance / returns | P09 | Atomic multi-asset, `FOR UPDATE` |
| Invoices & payments | P10 | Ledger balance; partial payments; idempotency |
| Budget infra | P11 | Manual ledger; auto commit **blocked D06/D07** |
| Maintenance | P12 | Lifecycle + asset maintenance list |
| Software licenses | P13 | List redacts key reference; renew **blocked** |
| Documents | P14 | Private storage upload/download; movement JSON generate; **PDF blocked D12** |
| Global search | P15 | PO hub (+ maintenance in search) |
| Notifications | P16 | Contract/license expiry events; **PO expiry blocked D04**; lead days **PROPOSED D14** |
| Audit read API + mutation audit trail | P17 | `GET /audit-events`; backup script `scripts/backup-db.mjs` (local) |
| Reports | P18 | JSON/CSV exports; **PDF/XLSX blocked D12** |
| Integration test matrix | P19 | Cross-module tests in suite; runbooks below |

## Partially implemented / provisional

- **Official PDF/Excel forms** (issue/return, PO, contract, invoice, budget) — infrastructure only; blocked pending **D12** templates.
- **Budget committed vs actual semantics** — ledger append + summary; no approved commit/release rules (**D06/D07**).
- **PO approval workflow** — draft editing only (**D03**).
- **License renewal workflow** — CRUD + expiring list; renew POST returns **403**.
- **Department-based issuance** — employee holder only (**D10**).
- **Role matrix** — DB-driven permissions; seed matrix is **PROPOSED**, not client-approved (**D01**).

## Blocked (requires client decision before production behavior)

| ID | Topic |
|---|---|
| D01 | Final RBAC matrix |
| D02 | LDAP/SSO vs local auth approval |
| D03 | PO submit/approve/cancel policy |
| D04 | PO expiry source (no DB column) |
| D05–D08 | Payment posting, budget commit/actual, FX |
| D09 | Bulk/consumable inventory |
| D10 | Department issuance holder |
| D11 | Asset state machine approval |
| D12 | Official document templates |
| D13–D17 | File policy, reminders, retention, DR/RPO |
| D21 | License secret encryption store |

## Mandatory acceptance not claimed

- Restore drill on isolated DB with signed RPO/RTO (**D17**)
- Stakeholder UAT on real templates and finance rules
- Security penetration / dependency audit sign-off
- Production deployment on customer LAN (**R01**) — runbook only, not executed here

## Runbooks (on-prem)

- **Backup:** `node scripts/backup-db.mjs` (requires `pg_dump`, `DATABASE_URL`)
- **Restore:** restore SQL to isolated instance; run `npx prisma migrate deploy`; verify FK counts
- **Worker/cron:** schedule `POST /api/v1/internal/jobs/expiry/run` in non-prod; production job runner TBD with IT

## Continuation (outside backend-only scope)

- Next.js dashboards (explicitly out of scope for this run)
- Wire approved templates into P14/P18 renderers when **D12** delivered
- Replace PROPOSED notification lead time with approved **D14** config
