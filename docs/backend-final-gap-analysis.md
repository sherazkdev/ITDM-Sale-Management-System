# ITDMS Backend — Final Gap Analysis & Production Readiness Audit

**Audit date:** 2026-10-31  
**Scope:** P00–P19 backend vs `requirements/Background and Objective.pdf`, `requirements/Database structure.pdf`, phase kits, and `requirements/reference/DECISION_REGISTER.md`.  
**Verdict:** Engineering delivery for scoped APIs is **substantially complete** on a **development database**. The system is **NOT production-ready** until client decisions (especially D01–D08, D12, D17) and formal acceptance are completed.

---

## 1. Executive summary

| Dimension | Status |
|---|---|
| Core CRUD + relational schema (13 PDF tables) | Implemented, migrated, exercised |
| Cross-module workflows (procurement, issuance, billing) | Implemented + automated tests |
| Blocked business policies | Correctly return `403 POLICY_NOT_APPROVED` or omit schema |
| Official PDF/XLSX outputs | **Not implemented** (D12); JSON/CSV only |
| RBAC matrix | DB-driven; seed is **PROPOSED** (D01) |
| Production deploy / restore sign-off | Runbooks only; **D17** open |

**This audit pass also:** fixed session cookie env alignment, payment idempotency cross-invoice guard, storage path traversal hardening, and expanded the test suite from **23 → 30** tests across **14** files.

---

## 2. Requirement compliance matrix

Legend: **OK** = implemented & tested | **PART** = partial / provisional | **BLK** = blocked by decision | **GAP** = not implemented

| ID | Requirement (PDF / phase) | Status | Implementation evidence | Test evidence |
|---|---|---|---|---|
| R01 | On-prem / LAN deployment | PART | Docker Postgres 5433, Compose docs | Health ready probe |
| R02 | Employee management | OK | `modules/employees`, RBAC | `auth-employees.test.ts`, `rbac-isolation.test.ts` |
| R03 | Asset inventory, manual codes | OK | `modules/assets`, unique `asset_code` | `assets.test.ts`, issuance tests |
| R04 | Vendors, contracts, POs, expiry | PART | CRUD + contract expiry notifications | `procurement-flow`, `extended-modules`; PO expiry **BLK D04** |
| R05 | Invoices, balances, payments | PART | Ledger + `FOR UPDATE`; idempotency | `procurement-flow`, `finance-and-concurrency` |
| R06 | Maintenance & licenses | OK | P12/P13 modules | `extended-modules.test.ts` |
| R07 | Issue/return + history | OK | Movement docs, atomic multi-asset | `asset-issuance`, concurrency test |
| R08 | Budget allocated/utilized/remaining | PART | Manual ledger API | Limited HTTP coverage; **D06/D07** |
| R09 | Relational DB + PO search | OK | Prisma FKs, `/search/purchase-orders/:poNumber` | `procurement-flow.test.ts` |
| R10 | Org PDF/Excel reports | PART | CSV/JSON reports | PDF/XLSX **403**; **BLK D12** |
| R11 | Auth, RBAC, audit | PART | Sessions, permissions, `GET /audit-events` | Auth + audit tests; matrix **D01** |
| R12 | Backup & recovery | PART | `scripts/backup-db.mjs` | No automated restore drill (**D17**) |
| R13 | Modular backend | OK | Phase modules under `apps/api/src/modules` | Build + lint |
| R14 | Contract 1:N PO | OK | Nullable `contract_id` on PO | Procurement flow |
| R15 | PO line items | OK | Lines + total recompute | `po-line.test.ts`, procurement |
| R16 | Multiple invoices per PO | OK | Invoice API | Procurement flow |
| R17 | Multi-asset issue documents | OK | P09 movement service | Issuance + rollback test |
| R18 | Financial vs asset history | OK | Separate transaction tables | Procurement + movements |
| R19 | Document references / attachments | PART | `stored_documents`, private storage | Upload + MIME rejection tests |

### Phase P00–P19 (engineering checklist)

| Phase | Status | Notes |
|---|---|---|
| P00–P01 | OK | Foundation preserved |
| P02 | OK | Migrations through `20261031084710_notification_read_at` |
| P03–P05 | OK | Auth, employees, vendors |
| P06–P11 | OK/PART | Assets through budget; budget semantics PART |
| P12–P13 | OK | Maintenance, licenses (renew blocked) |
| P14 | PART | Upload/download; official PDF **BLK D12** |
| P15 | OK | Search hub |
| P16 | PART | Expiry job; PO expiry **BLK D04** |
| P17 | PART | Audit API + backup script |
| P18 | PART | JSON/CSV reports |
| P19 | OK | Expanded integration matrix (this audit) |

---

## 3. Implemented functionality (verified in code)

- **HTTP API** under `/api/v1/*` with Zod validation, centralized errors, request IDs, audit hooks on mutations.
- **Auth:** Cookie + Bearer session resolution; permissions loaded per user; dev seed `admin.dev` (not client-approved roles).
- **Procurement chain:** vendor → contract → PO (draft) → lines → invoices → payments → balance → PO search.
- **Assets:** Categories, status via movements only, current holder endpoint, maintenance list by asset.
- **Issuance/return:** Row-level locks (`FOR UPDATE`), sorted lock order, duplicate payload rejection, transactional rollback on partial failure.
- **Invoices:** Payment ledger, partial status derivation, idempotency keys (global unique), overpayment rejection.
- **Documents:** Base64 upload, MIME allow-list, 10MB cap, SHA-256, path-safe storage keys.
- **Notifications:** Contract/license expiry generation via internal job (disabled semantics in production env).
- **Reports:** Asset register + PO summary as JSON/CSV.
- **Operations:** Health/live/ready, `backup-db.mjs` for `pg_dump`.

---

## 4. Missing or insufficient functionality

| Item | Severity | Notes |
|---|---|---|
| Official PDF/XLSX templates | High (compliance) | **D12** — placeholders must not be marketed as compliant |
| PO submit/approve/receive/cancel | High | **D03** — endpoints return policy block |
| PO expiry alerts | Medium | **D04** — no `expiry_date` column |
| Budget auto-commit on PO/invoice events | High | **D06/D07** — manual ledger only |
| License renewal workflow | Low | POST renew → **403** |
| LDAP/SSO | Medium | **D02** |
| Consumable/bulk stock | Medium | **D09** — no quantity stock ledger |
| Department as issuance holder | Medium | **D10** — employee only |
| Credit notes / FX / multi-currency rules | High | **D05/D08** |
| Virus scan / retention enforcement | Medium | **D13** — allow-list only |
| Password reset / MFA | Medium | **D22** |
| Data migration import pipeline | High | **D20** |
| Frontend dashboards | Out of scope | Not started (by instruction) |

---

## 5. Blocked workflows (explicit policy gates)

| Workflow | API behavior | Decision |
|---|---|---|
| PO workflow transitions | `403 POLICY_NOT_APPROVED` on submit/approve/etc. | D03 |
| PO expiry notifications | Not generated | D04 |
| Budget commit/release automation | Not implemented | D06, D07 |
| Contract/license renew side effects | Renew blocked where specified | D03/D19 |
| Report/movement PDF generation | `403` / policy | D12 |
| Report XLSX | `403` / policy | D12 |
| Production expiry cron | Job route restricted; prod guard | D14, D17 |

---

## 6. Automated test evidence (actual run)

**Command:** `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test`  
**Last run:** 2026-10-31 — **30/30 tests PASS**, **14 files**, duration ~258s (serial DB tests).

| File | Scenarios covered |
|---|---|
| `integration/finance-and-concurrency.test.ts` | Overpayment 409; idempotency wrong invoice 409; idempotent replay balance; multi-asset rollback; concurrent dual issue |
| `http/procurement-flow.test.ts` | End-to-end procurement + payments + search; D03 block |
| `http/asset-issuance.test.ts` | Multi issue/return; re-issue 409 |
| `http/extended-modules.test.ts` | Maintenance, license redaction, documents, reports block, expiry job, audit 401 |
| `http/rbac-isolation.test.ts` | Read-only role: GET ok, POST employee 403 |
| `http/document-security.test.ts` | Disallowed MIME 422 |
| `unit/file-storage.test.ts` | MIME reject; path traversal 403 |
| `integration/po-line.test.ts` | PO line totals |
| `http/auth-employees.test.ts` | Login + create employee |
| `http/assets.test.ts`, `vendors.test.ts` | Core CRUD negatives |
| `integration/health-ready.test.ts` | DB up/down |
| `http/app.test.ts`, `unit/app-error.test.ts` | App shell / errors |

**Not yet automated (recommended):** full budget ledger scenarios; restore-from-backup script on throwaway DB; per-permission matrix for every route; load/concurrency beyond dual issue.

---

## 7. Security findings

| Finding | Severity | Status |
|---|---|---|
| Session cookie name ignored env (`itdms_session` hardcoded) | Medium | **Fixed** — uses `SESSION_COOKIE_NAME` |
| Payment idempotency key reusable on different invoice | Medium | **Fixed** — 409 if invoice mismatch |
| Storage read path `..` segments | Medium | **Fixed** — reject `..` path segments |
| License key reference in list responses | Low | Mitigated — stripped on list |
| Document upload MIME allow-list only (no AV) | Medium | Open — **D13** |
| PROPOSED RBAC seed grants broad admin in dev | High for prod | Mitigate with **D01** + prod seed process |
| Internal job route in non-prod | Low | Requires auth + `jobsRun`; review before prod |
| Secrets in `.env` | Ops | Not committed; rotate for prod |

Sensitive data: payment amounts and employee PII returned to authorized callers only; audit metadata may contain business ids — review retention (**D16**).

---

## 8. Database, API, and permissions audit (summary)

- **Migrations:** Immutable history under `apps/api/prisma/migrations/`; do not squash for prod.
- **Relationships:** PO→vendor/contract, PO→lines, PO→invoices, invoice→payments, assets→transactions→movement docs — match PDF intent.
- **Validators:** Zod at route boundary; business rules in services (status enums, decimal math).
- **Permissions:** Each module route uses `authenticate` + `requirePermission(PermissionKeys.*)`; see `shared/auth/permissions.ts` for keys. Final role→permission mapping is **not client-approved**.

---

## 9. Backup and restore

| Step | Status |
|---|---|
| Backup script | `node scripts/backup-db.mjs` (needs `pg_dump`, `DATABASE_URL`) |
| Restore procedure (documented) | Restore SQL to **isolated** instance → `npx prisma migrate deploy` → smoke tests |
| Automated restore drill | **Not run** in CI — requires local Postgres + IT sign-off (**D17**) |

---

## 10. Required client decisions (production blockers)

Priority order for stakeholder workshops:

1. **D01** — Final RBAC matrix  
2. **D03** — PO lifecycle and approvers  
3. **D05–D08** — Finance posting, budget, currency  
4. **D12** — Official document templates (PDF/XLSX)  
5. **D04, D14** — Expiry definitions and reminder policy  
6. **D13, D16, D17** — Files, retention, DR/RPO/RTO  
7. **D02, D10, D11, D21, D22** — Auth integration, issuance rules, asset states, license secrets, accounts  

Full register: `requirements/reference/DECISION_REGISTER.md`.

---

## 11. Production-readiness checklist

| Gate | Done? |
|---|---|
| All P00–P19 engineering stories delivered | Yes (with documented PART/BLK) |
| Automated test suite green on CI/dev DB | Yes (30 tests) |
| Client RBAC approved and seeded for prod | **No (D01)** |
| Finance rules approved and tested | **No (D05–D08)** |
| Official exports approved | **No (D12)** |
| Restore drill + RPO/RTO signed | **No (D17)** |
| Security review / pen test | **Not claimed** |
| Production deployment on customer LAN | **Not executed (R01)** |
| Stakeholder UAT | **Pending** |

**Production-ready claim:** **NO** — engineering complete ≠ operational acceptance.

---

## 12. Recommended frontend integration order

1. **Auth shell** — login/logout, session handling, permission-aware nav (**D01** gating UI labels).  
2. **Master data** — employees, vendors, asset categories.  
3. **Assets + issuance** — register, issue/return wizards, holder views.  
4. **Procurement** — PO draft editor, lines, invoice list (read-only workflow until **D03**).  
5. **Billing** — invoice capture, payment entry, balance display.  
6. **Search hub** — PO number lookup.  
7. **Maintenance & licenses** — ops views; hide renew until approved.  
8. **Documents** — upload/list/download on PO/contract/invoice.  
9. **Notifications & audit** — inbox, audit viewer for admins.  
10. **Reports** — CSV download first; PDF/XLSX when **D12** templates exist.

---

## 13. Technical fixes applied in this audit

1. `createAuthenticate` reads `SESSION_COOKIE_NAME` from env.  
2. `requirePermission` returns `UNAUTHORIZED` (401) when principal missing.  
3. `InvoiceService.recordPayment` rejects idempotency key reuse on a different invoice.  
4. `FileStorageService.resolveKey` rejects `..` path segments and NUL bytes.  
5. New tests: finance/concurrency, RBAC isolation, document MIME, file storage unit tests.

---

## 14. References

- `docs/release-report.md`  
- `docs/requirements-coverage-final-audit.md`  
- `requirements/IMPLEMENTATION_STATUS.md`  
- `requirements/reference/DECISION_REGISTER.md`  
- Test root: `apps/api/tests/`  
