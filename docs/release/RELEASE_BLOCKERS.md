# Release Blockers & Gap Audit (Phase 03)

**Date:** 2026-11-03  
**Production deployment:** **NOT APPROVED**

---

## Classification key

| Class | Meaning |
|---|---|
| **CRITICAL** | Must resolve before any production handover |
| **HIGH** | Major defect or missing verified capability |
| **CLIENT** | Requires documented business approval |
| **OPS** | Infrastructure/configuration before go-live |
| **OPTIONAL** | Enhancement; not required for MVP if client agrees |

---

## Critical release blockers

| ID | Issue | Evidence |
|---|---|---|
| RB-01 | **Client RBAC matrix not approved** (D01) | Seed role only; `CLIENT_DECISION_REGISTER.md` |
| RB-02 | **PO approval workflow disabled** (D03) | Approve/cancel routes blocked by design |
| RB-03 | **Official report/templates not delivered** (D12) | JSON/CSV + disclaimers only |
| RB-04 | **Budget commit/actual rules undefined** (D06–D08) | Ledger without approved semantics |
| RB-05 | **Production DR policy unsigned** (D17) | Phase 02 drill ≠ production RPO/RTO approval |
| RB-06 | **Client UAT not executed** | Plan prepared; no acceptance sign-off |
| RB-07 | **Production LAN deployment not performed** (R01, D17) | Runbooks only |

---

## High-priority defects / gaps

| ID | Issue | Evidence |
|---|---|---|
| HG-01 | **Document file recovery PARTIAL on shared dev database** | 30/37 DB rows missing files under `apps/api/storage`; files often in `storage-test` (see Phase 03 investigation) |
| HG-02 | **Historical test pollution of `itdms_dev`** | Vitest previously used `itdms_dev` + `storage-test` — fixed forward to `itdms_test` (Phase 03) |
| HG-03 | **Report API unbounded reads** | `ReportService` full-table exports — risk at scale (`PERFORMANCE_RELIABILITY_REPORT.md`) |
| HG-04 | **Penetration / dependency audit** | Not in Phase 01/02 scope; no sign-off |

---

## Client approval required (not blockers if scope reduced)

| ID | Topic | Decision |
|---|---|---|
| CA-01 | LDAP/SSO (D02) | Auth integration |
| CA-02 | PO expiry source (D04) | Notifications |
| CA-03 | Consumable inventory (D09) | Scope |
| CA-04 | Department issuance (D10) | Schema/workflow |
| CA-05 | License secret storage (D21) | Security |
| CA-06 | Attachment/retention (D13, D16) | Compliance |
| CA-07 | Reminder policy (D14) | Notifications |
| CA-08 | Data migration (D20) | Go-live data |

---

## Operational configuration needed

| ID | Item |
|---|---|
| OPS-01 | Production `SESSION_SECRET`, HTTPS, reverse proxy trust |
| OPS-02 | Private `STORAGE_ROOT` on server disk with backup inclusion |
| OPS-03 | Scheduled backup job + offsite copy (after D17) |
| OPS-04 | Expiry scan job (`POST /api/v1/internal/jobs/expiry/run`) on scheduler |
| OPS-05 | PostgreSQL connection limits and monitoring |
| OPS-06 | Separate production DB — never share with dev/test |

---

## Optional enhancements

| ID | Item |
|---|---|
| OPT-01 | `pg_trgm` for faster PO/asset text search at scale |
| OPT-02 | Dashboard response caching post-UAT |
| OPT-03 | ORLEN branding phase (logo + red palette, layout unchanged) |

---

## Security & accessibility (remaining)

| Item | Status |
|---|---|
| CSRF / session / rate limits | Phase 01 **VERIFIED** |
| axe / responsive / dark UI | UI08 **VERIFIED** |
| Formal pen test | **NOT DONE** |

---

## Safe to hand over today?

**No.** Engineering phases P00–P19, UI00–UI08, security Phase 01, and performance/backup Phase 02 are substantially complete, but **client decisions, UAT, DR policy, template delivery, and production ops** block release.
