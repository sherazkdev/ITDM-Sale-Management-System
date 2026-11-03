# Client Approval Questions (Pre-UAT)

**Project:** IT Department Management System (ITDMS)  
**Date:** 2026-11-03 — Phase 05  
**Purpose:** Plain-language decisions needed before production handover and final UAT sign-off  

**Important:** Options marked **(Proposal — not approved)** are engineering suggestions only. Nothing is live policy until your team records approval below.

---

## How to respond

For each item, choose an option (or write your own), then complete the approval line.

| Field | Your answer |
|---|---|
| **Approved option** | |
| **Approver name / role** | |
| **Date** | |

---

## Priority A — Release-blocking (must decide before go-live)

### A1 — D01 Who can do what? (Roles and permissions)

| | |
|---|---|
| **Question** | Which job roles should exist (for example IT administrator, procurement officer, finance clerk, read-only auditor), and for each role what may they **view**, **create**, **edit**, or **approve**? |
| **Why it matters** | The system enforces permissions on every screen and API call. Without your matrix we cannot provision production users or sign off security. |
| **Choices** | (1) Approve the proposed UAT roles as production roles. (2) Provide a new matrix (spreadsheet is fine). (3) Phase 1: small admin group + read-only viewers; expand later. |
| **Proposal (not approved)** | Start with **IT Admin** (full operational access except audit tuning) and **Read-only** (lists and reports only); add **Finance** and **Procurement** roles when PO/budget rules (D03, D06–D08) are approved. |
| **System impact** | User accounts, menu visibility, API authorization, UAT test accounts. |
| **Client approval** | _________________________________ |

---

### A2 — D03 Purchase order approval workflow

| | |
|---|---|
| **Question** | Who creates purchase orders, who approves them, and which statuses apply (for example draft → submitted → approved → closed/cancelled)? |
| **Why it matters** | Today the system supports **draft PO create/edit only**. Submit/approve/cancel endpoints stay disabled until you approve a workflow. |
| **Choices** | (1) Single approver role. (2) Multi-step approval by amount. (3) No approval in phase 1 — draft only for data entry. |
| **Proposal (not approved)** | **Draft → Approved** with one designated approver role; cancellation requires admin. |
| **System impact** | Enables PO state transitions, notifications, and budget “commit” timing (links to D06–D08). |
| **Client approval** | _________________________________ |

---

### A3 — D06–D08 Budget: committed, actual, and currency

| | |
|---|---|
| **Question** | When does budget become **committed** (PO approved? invoice received?)? When is spend **actual**? Do you use **one currency** or multiple with exchange rules? |
| **Why it matters** | Budget screens and ledger summaries use labels that are **PROPOSED** until you define rules. Finance UAT cannot sign off without this. |
| **Choices** | (1) Commit on PO approval; actual on payment. (2) Commit on invoice; actual on payment. (3) Manual ledger only for phase 1. |
| **Proposal (not approved)** | Single currency (**company default**); commit on **approved PO total**; actual on **posted invoice payments**. |
| **System impact** | Report labels, automation hooks, UAT-09 and UAT-17 expectations. |
| **Client approval** | _________________________________ |

---

### A4 — D12 Official PDF and Excel templates

| | |
|---|---|
| **Question** | Please provide approved blank forms for PO, contract, asset issue/return, invoice, and budget reports (PDF/Excel as used today in your organization). |
| **Why it matters** | Exports today are **JSON/CSV** with a clear **non-official** disclaimer. Compliance-facing documents need your artwork and field layout. |
| **Choices** | (1) Client supplies templates before go-live. (2) Use system exports temporarily with written acceptance of interim format. (3) Defer certain documents to phase 2. |
| **Proposal (not approved)** | Client supplies templates for **PO and issue/return** first; other reports remain CSV until phase 2. |
| **System impact** | Template engine, UAT-12, movement PDFs, report downloads. |
| **Client approval** | _________________________________ |

---

### A5 — D17 Backup, disaster recovery, and hosting policy

| | |
|---|---|
| **Question** | Where should backups be stored, how often, how long retained, acceptable **data loss (RPO)** and **downtime (RTO)**, and **who may perform a restore**? |
| **Why it matters** | Engineering has proven backup/restore on isolated environments. Production schedule, offsite copy, and ownership need your policy. |
| **Choices** | (1) Daily DB + file backup to IT network share; weekly restore drill. (2) Managed backup appliance (vendor TBD). (3) Custom policy (describe). |
| **Proposal (not approved)** | **Daily** logical backup including **database + document storage folder**; **30-day** retention on IT share; **RPO 24h / RTO 4h**; restore by **named IT admins only**. |
| **System impact** | Scheduled jobs, storage sizing, UAT-18, LAN deployment checklist. |
| **Client approval** | _________________________________ |

---

## Priority B — Strongly affects UAT or production policy

### B1 — D02 Sign-in method (local vs company directory)

| **Question** | Should staff sign in with **Active Directory / SSO**, or are **separate ITDMS usernames** acceptable for phase one? |
| **Why it matters** | System today uses **local username + password** and session cookies. |
| **Proposal (not approved)** | Local accounts for UAT and phase-one go-live; directory integration planned as phase two if required. |
| **Client approval** | _________________________________ |

### B2 — D05 Invoice payments and balances

| **Question** | How should partial payments, credits, and “paid in full” be determined? Any finance sign-off before recording payment? |
| **Client approval** | _________________________________ |

### B3 — D13 Attachments (types, size, retention, virus scan)

| **Question** | Allowed file types, maximum size, retention period, and whether uploads must pass antivirus scanning? |
| **Today** | PDF and common office types up to **10 MB**; private storage; no AV hook. |
| **Client approval** | _________________________________ |

### B4 — D04 PO expiry reminders

| **Question** | What date drives PO reminders (validity end, delivery deadline, other)? |
| **Client approval** | _________________________________ |

### B5 — D14 Notification lead times and channels

| **Question** | How many days before contract/license/PO dates should staff be warned? Is **email or SMS** required, or in-app only? |
| **Client approval** | _________________________________ |

### B6 — D16 Deletes and archiving

| **Question** | Soft delete vs hard delete for vendors, assets, and financial records; legal retention period? |
| **Client approval** | _________________________________ |

### B7 — D21 Software license secrets

| **Question** | Should full license keys be stored encrypted in ITDMS, or reference-only (last four characters)? |
| **Client approval** | _________________________________ |

### B8 — D22 Accounts (reset, MFA, provisioning)

| **Question** | Password reset process, MFA requirement, and who provisions new users? |
| **Client approval** | _________________________________ |

---

## Priority C — Scope and optional (confirm in or out of phase one)

| ID | Question (summary) | Blocks specific feature if “in scope” but unanswered |
|---|---|---|
| D09 | Quantity-based / consumable inventory? | Stock quantities |
| D10 | Issue assets to departments without named employee? | Department custody |
| D11 | Approved asset status list and rules? | Operational policy |
| D15 | Auto-numbering formats for PO/invoice/contract? | Number collisions |
| D18 | Normalize departments to a master list? | Data quality |
| D19 | Maintenance SLA and vendor billing links? | Maintenance module depth |
| D20 | Legacy Excel migration and data owners? | Go-live data load |
| D23 | Company timezone and fiscal year boundaries? | Scheduled finance |
| D24 | Single company vs branches? | Multi-entity scope |

---

## ORLEN branding (direction recorded — not implemented in Phase 05)

| Item | Recorded direction |
|---|---|
| Logo | **ORLEN company logo** to replace placeholder branding |
| Theme | **Red-tone** palette aligned with ORLEN corporate identity |
| Layout | **Existing CRM-derived layout must remain intact** — no structural redesign |

Branding will be implemented and **visually verified before final client UAT sign-off** (separate phase).

---

## Related documents

- Full register: [`CLIENT_DECISION_REGISTER.md`](./CLIENT_DECISION_REGISTER.md)  
- UAT plan: [`CLIENT_UAT_TEST_PLAN.md`](./CLIENT_UAT_TEST_PLAN.md)  
- Engineering gate: [`PHASE05_PRE_UAT_REPORT.md`](./PHASE05_PRE_UAT_REPORT.md)
