# UAT Execution Checklist (client — not executed by engineering)

**Reference:** `CLIENT_UAT_TEST_PLAN.md` (18 cases)  
**Environment:** Staging LAN URL (IT-provided)  
**Accounts:** PROPOSED fixtures — rotate before UAT (`uat.admin`, `uat.reader`)

---

## Before UAT starts

| # | Item | Owner | Done |
|---|---|---|---|
| P-01 | Client signed off staging URL and test window | IT / sponsor | ☐ |
| P-02 | D01 role matrix draft agreed for test users | Business | ☐ |
| P-03 | Staging DB is **not** production/dev (`itdms_staging`) | IT | ☐ |
| P-04 | `storage-staging` (or server path) backed up with DB | IT | ☐ |
| P-05 | UAT passwords set via env (see `STAGING_CREDENTIAL_ROTATION.md`) — not committed | IT | ☐ |
| P-06 | Issue log template shared (see below) | PM | ☐ |
| P-07 | Official templates (D12) marked **out of scope** if not delivered | Sponsor | ☐ |

---

## Test accounts (PROPOSED — D01)

| Username | Intended use | Password delivery |
|---|---|---|
| `uat.admin` (or env override) | Full workflow scenarios | Secure channel / local env only |
| `uat.reader` (or env override) | Read-only / denial scenarios | Secure channel / local env only |

See **`STAGING_CREDENTIAL_ROTATION.md`** — do not record live passwords in this checklist.

---

## Execution log

For each case **UAT-01 … UAT-18** in `CLIENT_UAT_TEST_PLAN.md`:

| Case | Tester | Date | Pass / Fail / Blocked | Notes |
|---|---|---|---|---|
| UAT-01 | | | | |
| UAT-02 | | | | |
| … | | | | |

---

## Issue reporting

| Field | Description |
|---|---|
| ID | UAT-### |
| Case | UAT-## reference |
| Severity | Blocker / Major / Minor |
| Steps | Reproduction |
| Expected vs actual | |
| Decision link | D## if policy question |
| Owner | |

---

## Sign-off template

**UAT outcome:** ☐ Accepted with notes ☐ Rejected ☐ Incomplete (blocked on decisions)

| Role | Name | Date | Signature |
|---|---|---|---|
| Business sponsor | | | |
| IT lead | | | |
| Finance representative (if in scope) | | | |

**Engineering note:** Empty sign-off table — **client acceptance not claimed** until completed by client.

---

## Post-UAT

- Export issue log to release tracker
- Re-run blocked cases after D## decisions implemented
- Do not promote to production without D17 backup policy approval
