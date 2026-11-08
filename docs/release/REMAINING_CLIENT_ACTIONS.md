# Remaining Client Actions (Release Dependencies)

**Date:** 2026-11-08 · **Stage 5**  
**Purpose:** Items only the client / client IT can complete — **not** application defects.

---

## 1. Official documents (D12)

| Item | Status | Action required |
|------|--------|-----------------|
| Asset Issuance Form (official layout) | **NOT SUPPLIED** | Provide PDF/XLSX artwork |
| Asset Return Form (official layout) | **NOT SUPPLIED** | Provide PDF/XLSX artwork |
| Engineering hook readiness | **READY** | `ASSET_MOVEMENT_TEMPLATE_INTEGRATION.md` |

*Operational Excel/CSV exports remain available with non-official disclaimer.*

---

## 2. Financial policy (not approved for build)

| Topic | Status | Action required |
|-------|--------|-----------------|
| Posted invoice reversal / unpost | **BLOCKED** | Written policy approval |
| Credit notes / refunds | **BLOCKED** | Written policy approval |
| Payment edit/delete after post | **BLOCKED** | Business rule sign-off |

*Approved scope: draft invoice correction, allocation correction, admin ledger with audit only.*

---

## 3. Access and authentication

| Topic | Status | Action required |
|-------|--------|-----------------|
| D01 final RBAC matrix | **BLOCKED** | Sign role ↔ permission names |
| D02 LDAP/AD vs local accounts | **UNRESOLVED** | Confirm standalone local auth for phase 1 |
| Initial admin provisioning | **CONFIRMED** (engineering) | Client rotates production password |
| UAT test accounts | **BLOCKED** | Names + secure password delivery |

*No requirement to implement Dynamic RBAC UI for standalone release.*

---

## 4. Client deployment and IT

| Topic | Status | Action required |
|-------|--------|-----------------|
| Native Windows PostgreSQL install | **NOT VERIFIED** | IT install + service on client PC |
| Installation privileges | **CLIENT** | Admin rights for Node, PG, paths |
| Offline install media | **CLIENT** | Node + PG installers + ITDMS package |
| Production secrets | **CLIENT** | Replace all dev/demo passwords |
| Weekly backup Task Scheduler | **BLOCKED (D17)** | Schedule + owner |
| External backup drive | **CLIENT** | USB path + copy procedure |
| Client IT contact | **CLIENT** | Named owner for install/UAT |
| Authorized UAT participants | **BLOCKED** | Sponsor + testers assigned |
| Formal acceptance sign-off | **BLOCKED** | Executive/sponsor signature |

---

## 5. UAT and acceptance

| Item | Status |
|------|--------|
| Execute `CLIENT_UAT_EXECUTION_PACKAGE.md` | **NOT STARTED** |
| Log defects in `UAT_EXECUTION_CHECKLIST.md` | **PENDING** |
| Document1.pdf / formal requirements trail | **NOT IN REPO** |

---

## 6. What is **not** a client action (engineering complete)

- Business Phases 2–5 approved scope (finance, D09, D10, corrections)
- Premium UI Phases A–D
- Git checkpoint `5b9cf2b` / tag `itdms-pre-client-uat-2026-11-08`
- Automated regression evidence (Prompt 2) when Postgres available

---

**Next client meeting agenda:** D12 file handover · D01/D02/D17 sign-off · UAT window · backup owner · acceptance criteria.
