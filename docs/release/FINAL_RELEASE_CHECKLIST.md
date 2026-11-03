# Final Release Checklist (Pre-UAT → Production)

**Project:** ITDMS  
**Date:** 2026-11-03 — Phase 05  
**Use:** Internal IT + client sponsor — **not** a deployment authorization  

---

## Legend

| Symbol | Meaning |
|---|---|
| ✅ | Verified in engineering/staging (local) |
| ⏳ | Prepared but awaiting client action |
| 🚫 | Blocked — do not proceed without decision |
| — | Out of scope for current phase |

---

## 1. Engineering readiness (local staging)

| # | Item | Status | Evidence |
|---|---|---|---|
| E1 | API modules P00–P19 implemented | ✅ | API tests, phase reports |
| E2 | Frontend UI00–UI08 | ✅ | UI reports, Playwright UI08 |
| E3 | Security Phase 01 (CSRF, session, rate limits) | ✅ | `SECURITY_HARDENING_REPORT.md` |
| E4 | Performance / backup Phase 02 | ✅ | `PERFORMANCE_RELIABILITY_REPORT.md`, restore rehearsal |
| E5 | Requirements audit Phase 03 | ✅ | `PHASE03_READINESS_REPORT.md` |
| E6 | Local staging stack Phase 04 / 04B | ✅ | `STAGING_FINAL_VERIFICATION.md` |
| E7 | Read-only UI route guard (write URLs) | ✅ | Phase 05 — `route-write-permissions.ts`, `RouteAccessGuard` |
| E8 | Staging DB persistence (Postgres restart) | ✅ | `staging-persistence.mjs` |
| E9 | Staging document persistence | ✅ | `staging-document-persistence.mjs` — verified 2026-11-03 |
| E10 | Penetration / dependency audit | 🚫 | Not performed |
| E11 | ORLEN branding | — | Recorded only; implement before final UAT sign-off |

---

## 2. Client decisions (must be recorded before production)

| # | Decision | Status | Document |
|---|---|---|---|
| C1 | D01 Roles and permissions | 🚫 | `CLIENT_APPROVAL_QUESTIONS.md` A1 |
| C2 | D03 PO approval workflow | 🚫 | A2 |
| C3 | D06–D08 Budget rules | 🚫 | A3 |
| C4 | D12 Official templates | 🚫 | A4 |
| C5 | D17 Backup / DR policy | 🚫 | A5 |
| C6 | D02 Directory / SSO (if mandatory) | ⏳ | B1 |
| C7 | D05, D13, D14, D16, D21, D22 | ⏳ | Priority B |
| C8 | D09–D11, D15, D18–D20, D23–D24 | ⏳ | Priority C |

---

## 3. UAT gate

| # | Item | Status |
|---|---|---|
| U1 | UAT test plan prepared (18 cases) | ✅ `CLIENT_UAT_TEST_PLAN.md` |
| U2 | UAT environment on client LAN | 🚫 Not deployed |
| U3 | UAT accounts per **approved** D01 matrix | 🚫 PROPOSED `uat.admin` / `uat.reader` only |
| U4 | UAT execution and sign-off | 🚫 **NOT STARTED** |
| U5 | UAT execution checklist | ✅ `UAT_EXECUTION_CHECKLIST.md` |

---

## 4. LAN deployment prerequisites (information required from client)

Collect before scheduling on-premises staging or production:

| # | Information needed | Owner |
|---|---|---|
| L1 | **Server OS** and hardware specs (CPU, RAM, disk) | Client IT |
| L2 | **LAN hostname or IP** for browser access | Client IT |
| L3 | **HTTPS/TLS** — internal CA, public cert, or TLS-terminated reverse proxy | Client IT |
| L4 | **Named system administrator** for install, patches, and service restarts | Client IT |
| L5 | **Storage capacity** for PostgreSQL + `STORAGE_ROOT` document tree (growth estimate) | Client IT |
| L6 | **Backup destination** and retention per approved **D17** | Client IT |
| L7 | **Approved user/role list** per **D01** | Business + IT |
| L8 | **UAT schedule** and participants | Business owner |
| L9 | Firewall rules: browser → web tier → API → Postgres (ports documented in runbook) | Client IT |
| L10 | Separate **production database** — never shared with developer or test databases | Client IT |

**Runbook:** [`STAGING_DEPLOYMENT_RUNBOOK.md`](./STAGING_DEPLOYMENT_RUNBOOK.md) (adapt for client hostnames and secrets).

**Explicitly not done in Phase 05:** automatic LAN or production deployment.

---

## 5. Production operations (after decisions + UAT)

| # | Item | Status |
|---|---|---|
| O1 | Production `SESSION_SECRET` and credential rotation | ⏳ |
| O2 | `STORAGE_ROOT` on dedicated disk; included in backup job | ⏳ D17 |
| O3 | Scheduled backup + offsite copy | ⏳ D17 |
| O4 | Expiry notification job on scheduler | ⏳ D14 |
| O5 | Monitoring and PostgreSQL capacity | ⏳ |
| O6 | Official PDF/Excel templates deployed | 🚫 D12 |

---

## 6. Pre-UAT release gate verdict

| Gate | Result |
|---|---|
| **Engineering (local staging)** | **PASS with conditions** — UI authorization gap closed; document persistence script ready; no LAN deploy |
| **Client decisions** | **FAIL** — D01, D03, D06–D08, D12, D17 open |
| **UAT** | **NOT STARTED** |
| **Production go-live** | **NOT AUTHORIZED** |

**Next steps (recommended order):**  
1) Client completes Priority A questions in `CLIENT_APPROVAL_QUESTIONS.md`.  
2) IT provisions LAN staging using runbook + prerequisite list.  
3) Execute UAT plan with approved roles.  
4) ORLEN branding phase + visual sign-off.  
5) Production cutover after UAT sign-off and D17 operational schedule.

---

## 7. Sign-off (future)

| Role | Name | Date | Signature |
|---|---|---|---|
| Engineering lead | | | |
| Client IT sponsor | | | |
| Business owner | | | |
