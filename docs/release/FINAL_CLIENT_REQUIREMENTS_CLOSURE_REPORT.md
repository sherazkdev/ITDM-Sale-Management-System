# Final Client Requirements Closure Report (Business Phase 5)

**Date:** 2026-11-08  
**Project:** `D:\ITDM-Sale-Management`  
**Method:** Source-code reconciliation against decision register, phase reports, and automated tests — not assumption of stale gap lists.

---

## A. Requirements matrix (client-confirmed vs current state)

| ID / area | Client-confirmed rule | Status | Evidence |
|-----------|------------------------|--------|----------|
| **D03** SAP PO approval | No in-app PO approval; SAP/external | **VERIFIED** | PO submit/approve **403**; UI messaging |
| **D04** PO expiry reminders | When `valid_until` set | **VERIFIED** | `NOTIFICATION_LEAD_DAYS=60`; expiry job tests |
| **D05–D07** Finance posting | Post → commit; pay → actual; partial pay | **VERIFIED** | Phase 2 + `wave2-finance`, `wave3-finance` |
| **D06–D08** Budget remaining | Remaining = allocated − utilized (Phase 2) | **VERIFIED** | `budget-phase2-acceptance` **5/5** |
| **D08** USD allocations | Annual allocation USD only | **VERIFIED** | `createAllocation` rejects non-USD |
| **D09** Non-asset movements | Issue/return/replenish/write-off, decimals, employee/dept | **VERIFIED** | D09 report; API **76/76** + concurrency; Playwright **11/11** |
| **D10** Serialized custody | Employee + historical department on issuance | **VERIFIED** | Migration D10; `asset-custody-d10` API + Playwright |
| **D14** 60-day reminders | Contracts/licenses (in-app) | **VERIFIED** | `notification-expiry.test.ts` |
| **D17** Weekly backup / retain 1 prior | Script rotation; no prod schedule | **PARTIAL** | `ITDMS_BACKUP_RETAIN_LOCAL`; client PC schedule **BLOCKED** |
| **Financial corrections** | Admin-only + audited | **VERIFIED (scoped)** | `financial.corrections` permission; Phase 4/5 tests **6/6** |
| **D12** Official issuance/return forms | Client files | **BLOCKED** | Operational exports only; field hooks doc exists |
| **D01** Final role matrix | Sign-off | **BLOCKED** | Seed `it_admin_proposed` + `financial.corrections` |
| **D02** LDAP/SSO | Unresolved | **BLOCKED** | Local auth only |
| **Reversals / credit notes** | Not approved | **BLOCKED** | No APIs; posted correction **403** |
| **D18** Department master table | Optional | **NOT REQUIRED** | Text `employees.department` + D10 snapshot |
| **Department Mgmt / Dynamic RBAC** | Deferred | **NOT IN SCOPE** | — |
| **UAT / staging** | Authorized accounts | **BLOCKED** | `staging-verification` excluded locally |
| **Production-ready** | Full gates | **NO** | See §D |

*Full historical matrix:* `FINAL_CLIENT_REQUIREMENTS_MATRIX.md` (Wave 5 baseline); this report supersedes stale rows for D09, D10, budget remaining, and corrections.*

---

## B. Implemented this phase (Phase 5)

| Change | Purpose |
|--------|---------|
| Permission `financial.corrections` | Separates financial correction authority from `users.manage` (user admin UI) |
| `requireFinancialCorrections()` | Invoice/budget correction + admin ledger routes |
| Web UI gates | `financialCorrections` on invoice/budget correction surfaces |
| Test | Delegate role with `users.manage` only → **403** on corrections |
| Documentation | This report; gap list refresh; register/status updates |

**No** business-rule changes to D09, D10, Phase 2 formulas, or Phase 4 correction semantics.

---

## C. Still incomplete

### Approved functionality still missing
- Posted invoice reversal / unpost; payment edit/delete; credit notes (**policy BLOCKED**)
- Official D12 PDF/XLSX layouts (**client files BLOCKED**)

### Client documents / sign-off
- `Document1.pdf` not in repo; formal D01/D02/D17 sign-off

### Client-PC / IT dependency
- Native Windows PostgreSQL offline package rehearsal (partial Docker only)
- Task Scheduler production backup schedule
- Staging UAT credentials and stack

### UAT
- `staging-verification.spec.ts` — **BLOCKED** without authorized accounts

### Optional (explicitly out of scope)
- Profile, Settings, Theme, Avatar, Department Management, Dynamic RBAC, CSV import

---

## D. Production readiness

| Gate | Result |
|------|--------|
| Client UAT executed | **NO** |
| D01 signed RBAC matrix | **NO** |
| D12 official templates | **NO** |
| Financial reversal policy | **NO** |
| Native Windows prod deploy verified | **NO** |
| Engineering regression (API) | **YES** — see §F |
| Isolated E2E (`itdms_e2e`) | **YES** — prior full-suite + targeted reruns (Phase 3–4) |
| **Production-ready overall** | **NO** |

---

## E. Client demo checklist (engineering machine, `itdms_e2e`)

| Workflow | Ready? |
|----------|--------|
| Vendor → contract → PO → invoice post → partial pay | **YES** |
| Budget FY, allocation, utilized/remaining dashboard | **YES** |
| Serialized asset issue/return with department snapshot | **YES** |
| Non-asset stock D09 full movement UI | **YES** |
| Admin draft invoice + allocation correction + audit | **YES** |
| PO search hub + operational Excel exports | **YES** |
| Official signed issuance/return PDF | **NO** (D12) |
| Staging UAT script | **NO** |

**Stack:** `prepare-e2e-database.ps1`; API **:3020** `NODE_ENV=development`; Web **:3021** `ITDMS_API_URL=http://127.0.0.1:3020`.

---

## F. Regression evidence (Phase 5 closure)

| Suite | Environment | Result (this session) |
|-------|-------------|------------------------|
| Prisma validate | schema | **PASS** |
| API Vitest | `itdms_test` | **91/91 PASS** (incl. financial-corrections **6/6**) |
| Web Vitest | — | **50/50 PASS** (prior run; unchanged validators) |
| Typecheck / lint | monorepo | **PASS** (after permission split) |
| Full Playwright local | — | **Not re-executed end-to-end in Phase 5** |

**Prior isolated E2E (still valid unless code drift):** lifecycle **13/13**, wave3 **6/6**, D09 **11/11**, D10 **3/3** on `itdms_e2e` (2026-11-08).

**Authorization finding (closed in Phase 5):** `users.manage` alone does **not** grant corrections; requires `financial.corrections` (seeded on full admin role). No API exists to mutate role-permission mappings at runtime — only role assignment to predefined roles.

---

## G. Next implementation plan (approved work only, by priority)

1. **Client:** D12 template files → wire official export layouts (no invented artwork).
2. **Client:** D01 sign-off → rename roles; production permission matrix (still static DB roles, not dynamic RBAC).
3. **Client:** Reversal/credit-note policy → only then implement ledger reversal APIs.
4. **Client IT:** Windows native install + Task Scheduler backup on target PC.
5. **Client UAT:** Staging accounts → `staging-verification.spec.ts`.

---

**Phase 5 engineering status:** **COMPLETE** — reconciliation, privilege-boundary hardening, docs, and API regression. **Overall product release:** **NOT COMPLETE** (§D).
