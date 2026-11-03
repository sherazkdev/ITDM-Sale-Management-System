# Client Decision Register (Phase 03 — client-facing)

**Purpose:** Questions for the business owner / IT sponsor. **Engineering does not assume an answer is approved until recorded here with approver and date.**

**Source of truth for IDs:** `requirements/reference/DECISION_REGISTER.md`

---

## Wave 1 classifications (2026-11-03)

**Client response:** Document1.pdf (client clarification) — **file not in repository**; classifications below follow the written Wave 1 engineering brief aligned to that response. **Approver name/date:** pending formal sign-off in PDF.

| ID | Status | Client statement (summary) | Effect on implementation |
|---|---|---|---|
| **D03** | **CONFIRMED / SUPERSEDES prior “enable PO workflow” proposals** | No ITDMS PO approval; SAP/manual external approval; ITDMS keeps PO records | Submit/approve/cancel stay **403**; UI explains SAP; **no** approval engine |
| **D04** | **PARTIALLY CONFIRMED** | 60-day reminders; PO when expiry/applicable date exists | Scan uses existing `valid_until` only — **no invented dates** |
| **D09** | **PARTIALLY CONFIRMED** | Asset vs non-asset stock; commercial units | `non_asset_stock_items` + UI entry; **no** consumption/replenishment rules |
| **D10** | **NOT ANSWERED** | (Issue/return dept holder not confirmed in Wave 1 brief) | Employee holder unchanged |
| **D12** | **PARTIALLY CONFIRMED** | Excel reports required | XLSX/CSV operational exports; **official templates still blocked** |
| **D14** | **PARTIALLY CONFIRMED** | **60 days** before expiry; in-app (email/SMS not confirmed) | `NOTIFICATION_LEAD_DAYS=60` default |
| **D01** | **PARTIALLY CONFIRMED** | One initial full-access user | RBAC kept; see `WAVE1_INITIAL_ADMIN_SETUP.md`; matrix still needed |
| **D02** | **NEEDS CLARIFICATION** | Not explicitly resolved in Wave 1 brief | Local auth unchanged |
| **D05–D08** | **NEEDS CLARIFICATION / pending** | Financial rules explicitly deferred | **No Wave 1 code changes** |
| **D17** | **NEEDS CLARIFICATION** | Backup overwrite/retention not approved | Scripts only; no production schedule |
| **D06–D08** | **NOT ANSWERED** (finance) | Pending next response | Provisional budget UI preserved |

---

## Wave 2 classifications (2026-11-03 — financial & backup)

**Client response:** Nov 3, 2026 answers (engineering brief) — treat as authoritative for Wave 2; formal PDF sign-off still pending.

| ID | Status | Client statement (summary) | Effect on implementation |
|---|---|---|---|
| **D05** | **PARTIALLY CONFIRMED** | Partial payments = amounts on invoice; actual after post | Post required before pay; partial pay supported; no credit-note workflow |
| **D06** | **CONFIRMED (committed)** | Committed with submitted/posted invoices; multiple invoices per PO | `postInvoice` → `COMMITTED_INVOICE`; one commitment per posted invoice |
| **D07** | **CONFIRMED (actual paid)** | Actual expenditure after posting; paid = sum of payments only | `ACTUAL_PAYMENT` from payments; not invoice total until paid |
| **D08** | **CONFIRMED (reporting)** | USD main currency; manual conversion; FX on payment dates | Manual rates on payments; optional rate at post for non-USD commitment USD |
| **D17** | **PARTIALLY CONFIRMED** | Weekly backups; ≥1 prior on system; older to external manually | `ITDMS_BACKUP_RETAIN_LOCAL` rotation; **no** prod schedule or RPO/RTO |

**Provisional (not fully verified):** non-USD commitment without post rate; non-USD allocation remaining USD; reversals/cancellations; search budget rollup.

Detail report: [`CLIENT_APPROVED_WAVE2_REPORT.md`](./CLIENT_APPROVED_WAVE2_REPORT.md).

---

## Wave 3 classifications (2026-11-03 — verification + inventory)

| ID | Status | Work | Effect |
|---|---|---|---|
| **D05–D08** | **Verified (core paths)** | Playwright + API cross-check | Post/pay/FX/idempotency; provisional notices remain |
| **D09** | **PARTIALLY CONFIRMED (extended)** | Asset vs non-asset entry; units; PO/type/received date; detail UI | No qty consumption/withdrawal |
| **D17** | **PARTIALLY CONFIRMED** | Rotation verify script + restore rehearsal docs | No prod schedule |

Detail report: [`CLIENT_APPROVED_WAVE3_REPORT.md`](./CLIENT_APPROVED_WAVE3_REPORT.md).

---

**Deployment (Windows standalone):** **CONFIRMED** as direction — checklist only, no client-machine deploy.

**Issue/return templates:** **CONFIRMED** manual signing + templates later — integration doc only.

Detail report: [`CLIENT_APPROVED_WAVE1_REPORT.md`](./CLIENT_APPROVED_WAVE1_REPORT.md).

---

## How to read this document

- **From PDF:** Explicit or strongly implied in BO/DB PDFs (via `SOURCE_TRACEABILITY.md`).
- **Engineering recommendation:** Suggested option for discussion only — not approved.

---

## D01 — Who can do what in the system?

| | |
|---|---|
| **PDF basis** | R11 — role-based permissions, sensitive financial access (BO p3) |
| **Today** | Permissions in database; dev seed role `it_admin_proposed` with broad access |
| **Unresolved** | Final role names, who approves POs, who sees budgets/licenses |
| **Client question** | *Please list each job role (e.g. IT admin, finance clerk, read-only auditor) and what they must be allowed to view, create, edit, or approve.* |
| **Impact if open** | Cannot sign off production authorization |
| **Blocks release?** | **Yes** |

---

## D02 — How do users sign in?

| | |
|---|---|
| **PDF basis** | R11 — authentication (BO p3) |
| **Today** | Local username/password + session cookie |
| **Unresolved** | LDAP/Active Directory or SSO required? |
| **Client question** | *Should staff log in with their existing company directory account, or is a separate ITDMS username acceptable for phase one?* |
| **Engineering recommendation** | Local accounts first, directory integration later — **not approved** |
| **Blocks release?** | **Yes** (if directory is mandatory) |

---

## D03 — Purchase order approval workflow

| | |
|---|---|
| **PDF basis** | PO lifecycle implied; not fully specified (DB p4) |
| **Today** | Draft PO create/edit; **no** submit/approve/cancel endpoints enabled |
| **Client question** | *Who creates POs, who approves them, and what statuses apply (draft → approved → closed)?* |
| **Blocks release?** | **Yes** for procurement go-live |

---

## D04 — What “PO expiry” means

| | |
|---|---|
| **PDF basis** | Expiry alerts for contracts/renewals (BO p1); PO expiry not in original 13 tables |
| **Today** | Optional `purchase_orders.valid_until` + **PROPOSED** notifications |
| **Client question** | *Should PO reminders use a validity/end date, delivery deadline, or something else? Who defines it?* |
| **Blocks release?** | **Yes** for PO expiry alerts |

---

## D05 — Invoice payments and balances

| | |
|---|---|
| **PDF basis** | R05, R16 — invoices, payment status (DB) |
| **Today** | Payment ledger, partial payments, idempotency keys |
| **Client question** | *How should partial payments, credits, and “paid in full” be determined? Any finance sign-off step before recording payment?* |
| **Blocks release?** | **Yes** for finance acceptance |

---

## D06–D08 — Budget “committed”, “actual”, and currency

| | |
|---|---|
| **PDF basis** | R08 — committed, actual, utilized, remaining (BO p1; DB p3–4) |
| **Today** | Allocations + manual ledger lines; summaries grouped by `transaction_type` text |
| **Client question** | *When does budget get “committed” (PO approved? invoice received?)? When is spend “actual”? Single currency or multi-currency with FX rules?* |
| **Blocks release?** | **Yes** for budget reporting trust |

---

## D09 — Quantity-based / consumable inventory

| | |
|---|---|
| **PDF basis** | R03 — quantities and serials mentioned together (BO p1) |
| **Today** | Serialized assets with unique `asset_code` only |
| **Client question** | *Do you need stock quantities (e.g. cables, toner) separate from serialized laptops?* |
| **Blocks release?** | **Yes** if consumables are in scope |

---

## D10 — Issue assets to departments

| | |
|---|---|
| **PDF basis** | R07 — employees/departments (BO p1) |
| **Today** | Issue/return to **employee** holder only |
| **Client question** | *Can equipment be issued to a department without naming one employee as holder?* |
| **Blocks release?** | **Yes** if department custody is required |

---

## D11 — Asset status rules

| | |
|---|---|
| **PDF basis** | R07 — condition/location (BO p3) |
| **Today** | PROPOSED statuses; movement service enforces issue/return |
| **Client question** | *Approved list of statuses and rules for repair, retire, lost, damaged?* |
| **Blocks release?** | **Yes** for operational policy |

---

## D12 — Official PDF/Excel templates

| | |
|---|---|
| **PDF basis** | R10 — organizational templates (BO p2–3) |
| **Today** | JSON/CSV exports + placeholders; movement JSON/PDF stub |
| **Client question** | *Please provide approved blank forms (PO, contract, issue/return, invoice, budget reports) for IT to implement.* |
| **Blocks release?** | **Yes** for compliance-facing documents |

---

## D13 — Attachment policy

| | |
|---|---|
| **PDF basis** | Attachments implied (BO p1) |
| **Today** | MIME allow-list, 10MB cap, private storage |
| **Client question** | *Allowed file types, max size, retention, virus scan requirement?* |
| **Blocks release?** | **Yes** for production file policy |

---

## D14 — Reminder lead times and channels

| | |
|---|---|
| **PDF basis** | Expiry alerts (BO p1) |
| **Today** | In-app notifications; `NOTIFICATION_LEAD_DAYS` default 30 (**PROPOSED**) |
| **Client question** | *How many days before contract/license/PO dates should staff be warned? Email/SMS needed?* |
| **Blocks release?** | **Yes** for reminder policy |

---

## D15 — Numbering rules

| | |
|---|---|
| **PDF basis** | Unique PO, invoice, contract numbers (DB) |
| **Today** | User-entered unique strings |
| **Client question** | *Auto-numbering formats, prefixes, fiscal-year scope?* |
| **Blocks release?** | Medium — can block go-live if collisions unacceptable |

---

## D16 — Deletes and archiving

| | |
|---|---|
| **PDF basis** | Audit / retention implied (BO p3) |
| **Today** | Vendor deactivate; restrict FK deletes |
| **Client question** | *Soft delete vs hard delete? Legal retention for financial records?* |
| **Blocks release?** | **Yes** for retention compliance |

---

## D17 — Backup, restore, RPO/RTO, hosting

| | |
|---|---|
| **PDF basis** | R12 — backups and recovery (BO p3); R01 LAN server |
| **Today** | `backup-itdms.mjs`, restore rehearsal on isolated DB; **no** production schedule |
| **Client question** | *Where should backups be stored, how often, how long kept, and what maximum data loss / downtime is acceptable (RPO/RTO)? Who may perform a restore?* |
| **Engineering recommendation** | Daily logical backup + weekly restore drill on staging — **not approved** |
| **Blocks release?** | **Yes** |

---

## D18–D24 — Additional items

| ID | Client question (summary) | Blocks release? |
|---|---|---|
| D18 | Normalize `department` to a master list? | Optional |
| D19 | Maintenance SLA and vendor billing links? | Optional |
| D20 | Initial Excel migration and data owners? | **Yes** if legacy data required |
| D21 | Store encrypted license secrets or reference only? | **Yes** for secrets policy |
| D22 | Password reset, MFA, account provisioning? | **Yes** for account policy |
| D23 | Company timezone and fiscal year boundaries? | **Yes** for scheduled finance |
| D24 | Single company vs branches? | Scope |

---

## After approval checklist (per decision)

1. Record approver name, date, and chosen option in `DECISION_REGISTER.md`.  
2. Implement or enable endpoints/workflows.  
3. Add/adjust automated tests.  
4. Update traceability matrix status to VERIFIED.
