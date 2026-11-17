# ITDMS — Client UAT Readiness Report (Prompt #28)

**Audience:** Business owner, IT sponsor, UAT participants  
**Date:** 2026-11-17  
**Application:** ITDMS (local build, not deployed)

---

## Executive summary

The application implements the **approved Prompt #25 business rules** (automatic purchase order approval, Super Admin expiry notifications, finance role matrix, official issuance/return Excel downloads). Prompt #28 completed full automated regression on isolated `itdms_test` / `itdms_e2e` databases.

**Client UAT readiness (engineering gate):** **GREEN** — API **109/109**, Web **73/73**, functional Playwright **309/309** (includes responsive matrix + a11y sample). Optional visual-capture Playwright (256 additional screenshot tests) remains **out of UAT gate** (`npm run test:e2e:visual-capture`). **Not** production go-live.

---

## What is complete and verified

- **Procurement:** Vendors, contracts, purchase orders (created **Approved**), line items, attachments, linked invoices.
- **Finance (admin):** Invoices, posting, partial payments, budget utilization (per approved formulas).
- **Finance (roles):** Managers read-only; IT Staff blocked from finance modules and redacted search.
- **Inventory:** Serialized assets; non-asset stock with decimal quantities and movement history (100 → issue 20 → 80 scenario).
- **Custody:** Issuance and return with department snapshot (D10).
- **Documents:** Official **Issuance** Excel download from the UI and API (client template on server). **Return** template present; return export uses the same mechanism.
- **Alerts:** Expiry reminders at 60, 30, 15, 7, 5, 4, 3, 2, 1, and 0 days to **Super Admin** accounts only.
- **Search:** Purchase order number hub linking vendor, contract, finance, assets, and stock (role-aware redaction).
- **Quality gates:** TypeScript, ESLint, and Web unit tests **pass** on this audit date; production **Next.js build succeeds**.

---

## What the client should test in UAT

1. End-to-end procurement with **your** vendors and contracts.  
2. Confirm **new POs show Approved** without a separate approval step.  
3. Finance scenarios with **Manager** and **IT Staff** test users (read-only vs no access).  
4. Receive expiry **in-app notifications** on Super Admin accounts only.  
5. Download **official Issuance and Return** forms and confirm layout matches supplied templates.  
6. Non-asset stock issue/return/write-off with realistic quantities.  
7. Global Search from a known PO number.

---

## Known limitations

- **Client templates** must exist on each environment (`storage/client-templates/` or environment variables).  
- **Database migration** `20261113153000_prompt25_notification_recipient` required on client databases.  
- Original **PDF requirement documents** were not in the repository; UAT should still validate against your signed decision register.  
- **Visual capture tests** (hundreds of screenshot permutations) are optional engineering assets, not a UAT gate.  
- **Production deployment, backup policy, and SAP** remain out of scope.

---

## Pending engineering items (not UAT blockers)

- Optional **visual capture** Playwright permutations for marketing archives only.  
- Client manual walkthrough on staging data (see § “What the client should test”).  
- Production hosting, backup, and deployment runbooks (out of scope).

---

## Client-dependent items

1. Place `Issuance.xlsx` and `Return.xlsx` on the API host.  
2. Approve notification migration on staging/production.  
3. Provide named **Super Admin** users for notification UAT.  
4. Confirm financial year and budget seed data for your organization.

---

## Suitability for client UAT

| Question | Answer |
|---|---|
| **Suitable to start client UAT?** | **YES** — engineering regression **GREEN** (2026-11-17 Prompt #28). |
| **Production ready?** | **NO** — deployment, migration sign-off, and client ops prerequisites required. |