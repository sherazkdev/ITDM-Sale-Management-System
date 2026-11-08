# Client UAT Execution Package

**Version:** 2026-11-08 (Stage 5)  
**Source checkpoint:** commit `5b9cf2b` · tag `itdms-pre-client-uat-2026-11-08`  
**Executor:** Authorized client / business testers only — **engineering must not mark Pass without tester evidence**

---

## A. Environment and access

| Item | Engineering guidance | Client fills |
|------|---------------------|--------------|
| UAT URL (web) | `http://127.0.0.1:<web-port>/` on standalone PC, or IT staging URL | __________ |
| API base (if direct) | Loopback only for standalone | __________ |
| Database | Dedicated UAT DB — **not** `itdms_dev` / production | __________ |
| Admin user | Initial full-access admin per seed/handover — **rotate password** | Username: __________ |
| Reader / clerk (optional) | For denial scenarios — D01 matrix when signed | Username: __________ |
| Credentials delivery | Secure channel only — never email plain text | __________ |
| Pre-UAT backup | DB + `STORAGE_ROOT` per `WINDOWS_BACKUP_RESTORE_RUNBOOK.md` | Date: __________ |

**Pre-flight (IT):** `preflight-check.ps1` · `prisma migrate deploy` · `health/ready` · one XLSX export smoke.

**Out of scope until client files:** Official D12 issuance/return PDF layouts (operational exports with `NON-OFFICIAL-D12` disclaimer only).

---

## B. How to record results

For each case:

| Field | Use |
|-------|-----|
| **Actual result** | What the tester observed |
| **Pass / Fail / Blocked** | **Blocked** = missing data, policy, or template |
| **Defect ID** | e.g. `UAT-DEF-001` |
| **Tester** | Name |
| **Date** | Execution date |

Detailed cases **UAT-01 … UAT-18:** `CLIENT_UAT_TEST_PLAN.md`  
Execution grid: `UAT_EXECUTION_CHECKLIST.md`

---

## C. Extended workflow cases (Stage 5)

*All rows below default to **Pass/Fail: ______** until client execution.*

### C.01 — Login and session

| | |
|--|--|
| **Preconditions** | UAT stack running; credentials issued |
| **Steps** | Open `/login` → sign in → refresh page → use back button → sign out |
| **Expected** | ITDMS branding; dashboard after login; session cleared on logout; no access when logged out |
| **Actual** | |
| **Pass/Fail/Blocked** | |
| **Defect** | |
| **Tester / Date** | |

### C.02 — Dashboard and analytics

| **Steps** | Open dashboard; confirm charts load; open notifications bell |
| **Expected** | No console errors; sections match role; counts load |
| **Actual / Result / Tester** | |

### C.03 — Employees and vendors

| **Steps** | Create employee → list search → create vendor → archive vendor |
| **Expected** | CRUD persists; validation on required fields |
| **Actual / Result / Tester** | |

### C.04 — Serialized asset registration

| **Steps** | Register asset with unique code → duplicate code rejected |
| **Expected** | Asset detail; status AVAILABLE (per policy) |
| **Actual / Result / Tester** | |

### C.05 — Non-Asset registration

| **Steps** | Register non-asset item with decimal quantity and unit |
| **Expected** | Detail page; ledger empty |
| **Actual / Result / Tester** | |

### C.06 — D09 stock issue / return / replenish / write-off

| **Steps** | Issue to employee (decimal qty) → return partial → replenish → write-off remainder |
| **Expected** | Quantities match ledger; insufficient stock blocked; employee/department on movements |
| **Actual / Result / Tester** | |

### C.07 — D10 custody (department snapshot)

| **Steps** | Issue serialized asset to employee with department → change employee master department → view asset history |
| **Expected** | History shows **historical** department at issuance; master change does not rewrite history |
| **Actual / Result / Tester** | |

### C.08 — Multi-asset issuance and return

| **Steps** | Issue two assets to one employee → return both |
| **Expected** | Atomic success; both ISSUE/RETURN rows in history |
| **Actual / Result / Tester** | |

### C.09 — Purchase Orders and contracts

| **Steps** | Create vendor → contract → PO with lines → search hub |
| **Expected** | No in-app SAP approval; external approval messaging only |
| **Actual / Result / Tester** | |

### C.10 — Invoice draft, post, partial pay, full pay

| **Steps** | Draft invoice → post → partial payment → verify budget → full payment |
| **Expected** | Post increases utilized; payment increases actual; remaining = allocated − utilized |
| **Actual / Result / Tester** | |

### C.11 — Manual FX (non-USD)

| **Steps** | Non-USD invoice post with manual rate → payment with manual rate |
| **Expected** | USD reporting consistent with entered rates |
| **Actual / Result / Tester** | |

### C.12 — Admin financial corrections

| **Steps** | As admin: correct draft invoice; adjust allocation; append admin ledger with reason |
| **Expected** | Success; audit `financial.correction` entries; finance user without `financial.corrections` denied |
| **Actual / Result / Tester** | |

### C.13 — Audit history

| **Steps** | Admin → Audit → filter financial corrections |
| **Expected** | Before/after metadata visible; non-admin denied if applicable |
| **Actual / Result / Tester** | |

### C.14 — Maintenance and software licenses

| **Steps** | Create maintenance record → create license with expiry |
| **Expected** | Records persist; license secrets redacted in API where designed |
| **Actual / Result / Tester** | |

### C.15 — Expiry notifications (60-day lead)

| **Steps** | Contract/license inside window → run notification job or wait for schedule → open notifications |
| **Expected** | In-app notification; no duplicate for same event |
| **Actual / Result / Tester** | |

### C.16 — Excel reporting

| **Steps** | Reports → download employees, asset movements, invoices XLSX |
| **Expected** | Files open; disclaimer `NON-OFFICIAL-D12` where applicable; finance columns match UI |
| **Actual / Result / Tester** | |

### C.17 — Document upload and download

| **Steps** | Upload PDF to PO → global search → download |
| **Expected** | File stored; permission-gated download |
| **Actual / Result / Tester** | |

### C.18 — Backup and restore (IT)

| **Steps** | Run weekly backup script → verify latest + one prior local generation → copy to external drive → isolated restore drill |
| **Expected** | Manifest + SQL; rotation; restore to **test** DB only per runbook |
| **Actual / Result / Tester** | |

### C.19 — Windows restart persistence

| **Steps** | Reboot PC → confirm PostgreSQL + services start → login → verify prior UAT data |
| **Expected** | Data persists; no dev credentials in production config |
| **Actual / Result / Tester** | |

---

## D. Engineering reference (not client sign-off)

| Evidence | Location |
|----------|----------|
| Full regression | `FINAL_FULL_REGRESSION_CLOSURE_REPORT.md` |
| Requirements matrix | `FINAL_CLIENT_REQUIREMENTS_CLOSURE_REPORT.md` |
| Windows install | `docs/deployment/WINDOWS_STANDALONE_INSTALLATION.md` |
| Template integration (D12) | `ASSET_MOVEMENT_TEMPLATE_INTEGRATION.md` |

**Client acceptance signature:** __________________ **Date:** __________
