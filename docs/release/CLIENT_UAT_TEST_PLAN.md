# Client UAT Test Plan (prepared — not executed)

**Version:** 2026-11-03 Phase 03  
**Executor:** Client / business users (future)  
**Environment:** Staging LAN instance with approved test data — **not production**

**Instructions:** Mark **Pass / Fail / Blocked** after execution. **Blocked** = cannot test until client decision (note ID).

---

## UAT-01 — Sign in and permissions

| Field | Content |
|---|---|
| **Objective** | Verify only authorized staff access modules |
| **Permissions** | Roles per approved matrix (D01) — until then use `admin.dev` |
| **Preconditions** | User account provisioned |
| **Steps** | 1) Open login page 2) Enter valid credentials 3) Open Employees, Budgets, Admin 4) Log out |
| **Expected** | Login succeeds; menu matches role; logout clears session |
| **Requirement** | R11 |
| **Decision** | D01, D02 |
| **Pass/Fail** | ______ |

---

## UAT-02 — Employee lifecycle

| Field | Content |
|---|---|
| **Objective** | Create and maintain employee records |
| **Permissions** | `employees.write` |
| **Preconditions** | Logged in |
| **Test data** | New employee number `UAT-E-001` |
| **Steps** | Create employee → view detail → edit department → list search |
| **Expected** | Record saved; appears in list; edits persist |
| **Requirement** | R02 |
| **Pass/Fail** | ______ |

---

## UAT-03 — Vendor and contract

| Field | Content |
|---|---|
| **Objective** | Link vendor to contract with dates |
| **Permissions** | `vendors.manage`, `contracts.manage` |
| **Steps** | Create vendor → create contract with start/expiry → attach note via documents if policy allows |
| **Expected** | Contract visible; expiry date on detail |
| **Requirement** | R04 |
| **Decision** | D13 attachments |
| **Pass/Fail** | ______ |

---

## UAT-04 — Draft purchase order with lines

| Field | Content |
|---|---|
| **Objective** | Create PO with multiple lines |
| **Permissions** | `purchaseOrders.manage` |
| **Steps** | New PO → add 2 lines → save → reopen PO |
| **Expected** | Line totals roll up; PO number unique |
| **Requirement** | R14, R15 |
| **Decision** | D03 (approval not in scope until approved) |
| **Pass/Fail** | ______ |

---

## UAT-05 — PO approval (blocked until D03)

| Field | Content |
|---|---|
| **Objective** | Submit and approve PO per policy |
| **Expected** | **Blocked** — workflow not enabled |
| **Decision** | **D03** |
| **Pass/Fail** | **Blocked** |

---

## UAT-06 — Register asset and issue to employee

| Field | Content |
|---|---|
| **Objective** | Track serialized asset assignment |
| **Permissions** | `assets.manage`, `assets.issue` |
| **Steps** | Create category → register asset with code → issue to employee → verify holder |
| **Expected** | Status assigned; history shows issuance |
| **Requirement** | R03, R07 |
| **Decision** | D10 if department issue required |
| **Pass/Fail** | ______ |

---

## UAT-07 — Return asset

| Field | Content |
|---|---|
| **Objective** | Return equipment to stock |
| **Steps** | Return previously issued asset → verify in stock → attempt duplicate return |
| **Expected** | Return succeeds once; second attempt rejected |
| **Requirement** | R07 |
| **Pass/Fail** | ______ |

---

## UAT-08 — Invoice and partial payment

| Field | Content |
|---|---|
| **Objective** | Record invoice against PO and pay partially |
| **Permissions** | `invoices.manage`, `invoices.pay` |
| **Steps** | Create invoice → post payment 40% → check balance → second payment |
| **Expected** | Outstanding decreases; overpayment rejected |
| **Requirement** | R05, R16 |
| **Decision** | D05 |
| **Pass/Fail** | ______ |

---

## UAT-09 — Budget view

| Field | Content |
|---|---|
| **Objective** | View allocation and ledger |
| **Steps** | Open budgets → review summary/ledger |
| **Expected** | Figures match agreed test data; disclaimer visible if semantics PROPOSED |
| **Requirement** | R08 |
| **Decision** | D06–D08 |
| **Pass/Fail** | ______ |

---

## UAT-10 — Global PO search hub

| Field | Content |
|---|---|
| **Objective** | Retrieve all PO-related records by PO number |
| **Steps** | Global search → enter known PO number → review linked invoices/assets/budget |
| **Expected** | Hub loads; truncated lists documented |
| **Requirement** | R09 |
| **Pass/Fail** | ______ |

---

## UAT-11 — Upload and download document

| Field | Content |
|---|---|
| **Objective** | Attach PDF to PO and download securely |
| **Steps** | Upload allowed PDF → download → attempt unauthorized user (if role available) |
| **Expected** | File round-trip; unauthorized denied |
| **Requirement** | R19 |
| **Decision** | D13 |
| **Pass/Fail** | ______ |

---

## UAT-12 — Reports export

| Field | Content |
|---|---|
| **Objective** | Export data for review |
| **Steps** | Open Reports → export CSV/JSON → read D12 disclaimer |
| **Expected** | Export downloads; **not** client official PDF until D12 |
| **Requirement** | R10 |
| **Decision** | **D12** |
| **Pass/Fail** | ______ |

---

## UAT-13 — Maintenance record

| Field | Content |
|---|---|
| **Objective** | Log repair request |
| **Steps** | Create maintenance linked to asset → complete |
| **Expected** | Record lifecycle updates |
| **Requirement** | R06 |
| **Pass/Fail** | ______ |

---

## UAT-14 — Software license register

| Field | Content |
|---|---|
| **Objective** | Track license expiry |
| **Steps** | Create license with expiry → view expiring list |
| **Expected** | Expiry visible; sensitive key field redacted |
| **Requirement** | R06 |
| **Decision** | D21 |
| **Pass/Fail** | ______ |

---

## UAT-15 — Notifications

| Field | Content |
|---|---|
| **Objective** | See upcoming expiries |
| **Steps** | Run/trigger expiry scan (IT) → open notifications → mark read |
| **Expected** | Events appear; read state updates |
| **Requirement** | R04 |
| **Decision** | D14 |
| **Pass/Fail** | ______ |

---

## UAT-16 — Audit trail review

| Field | Content |
|---|---|
| **Objective** | Auditor reads activity log |
| **Permissions** | `audit.read` |
| **Steps** | Perform mutation → open Admin → Audit → filter |
| **Expected** | Event recorded without secrets in payload |
| **Requirement** | R11 |
| **Pass/Fail** | ______ |

---

## UAT-17 — Connected procurement workflow

| Field | Content |
|---|---|
| **Objective** | End-to-end: vendor → contract → PO → invoice → budget link |
| **Steps** | Single scenario linking all entities → search PO hub |
| **Expected** | Consistent IDs and links |
| **Requirement** | R09, R14–R16 |
| **Pass/Fail** | ______ |

---

## UAT-18 — Backup restore (IT)

| Field | Content |
|---|---|
| **Objective** | Prove database + files recoverable |
| **Executor** | IT only |
| **Steps** | Run backup → restore to isolated DB → verify counts + sample document download |
| **Expected** | Restore succeeds; **all** production document keys resolve when storage included in backup |
| **Requirement** | R12 |
| **Decision** | **D17** |
| **Pass/Fail** | ______ |

---

## UAT sign-off (future)

| Role | Name | Date | Signature |
|---|---|---|---|
| Business owner | | | |
| IT lead | | | |
| Finance (if applicable) | | | |

**UAT status as of Phase 03:** **NOT STARTED**
