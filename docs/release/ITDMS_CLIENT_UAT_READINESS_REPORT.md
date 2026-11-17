# ITDMS — Client UAT Readiness Report (Prompt #27)

**Audience:** Business owner, IT sponsor, UAT participants  
**Date:** 2026-11-17  
**Application:** ITDMS (local build, not deployed)

---

## Executive summary

The application implements the **approved Prompt #25 business rules** (automatic purchase order approval, Super Admin expiry notifications, finance role matrix, official issuance/return Excel downloads). Automated regression is **actively re-running** on 2026-11-17 to refresh evidence beyond Prompt #26.

**Client UAT readiness:** **YELLOW** — suitable to **begin structured UAT** on core workflows while the final Playwright matrix and a small API re-run complete. **Not** a statement of production go-live.

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

- Complete **309-test** functional Playwright run (responsive + workflows).  
- Re-run **6 API Vitest files** that skipped during a cold database start.  
- Local commit for PO copy fixes and expanded route smoke list.

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
| **Suitable to start client UAT?** | **YES**, on isolated/staging data, for workflows listed above. |
| **Production ready?** | **NO** — deployment, migration sign-off, and refreshed full regression log required. |