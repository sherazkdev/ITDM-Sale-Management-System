# Pre-Deployment Gap List (Wave 5)

**Project:** ITDMS  
**Date:** 2026-11-03  
**Purpose:** Exact blockers before Windows standalone deployment and client UAT — **no deploy in Wave 5**

---

## Release blockers (must close before production readiness)

| # | Gap | Owner | Evidence / reference |
|---|-----|--------|----------------------|
| B1 | **Client UAT not executed** | Client + IT | `UAT_EXECUTION_CHECKLIST.md` — plan only |
| B2 | **D01 final RBAC matrix** — role names and permissions not signed | Client | Seed `it_admin_proposed` only; `CLIENT_DECISION_REGISTER.md` D01 |
| B3 | **D02 authentication method** — LDAP/AD vs local accounts | Client | Blocks if directory mandatory |
| B4 | **`remainingUsd` / budget utilization formula** — committed vs actual in “remaining” not client-approved | Client + Finance | `budget.service.ts`; provisional notices in UI |
| B5 | **Non-USD allocation remaining USD** — no cross-rate at allocation level | Client | Wave 2 report §8 |
| B6 | **Invoice reversals / credit notes** — not implemented | Client | D05 partial; no workflow |
| B7 | **D12 official PDF/Excel layouts** — operational exports only (`NON-OFFICIAL-D12`) | Client | Blank forms not in repo |
| B8 | **D10 department issuance holder** — employee holder only | Client | `asset-movement.service.ts` |
| B9 | **D09 consumption / withdrawal / replenishment** for non-asset qty | Client | Entry + detail only; no qty ledger |
| B10 | **D11 asset status policy** — full lifecycle list not approved | Client | `asset-status.ts` PROPOSED set |
| B11 | **D17 production backup schedule, RPO/RTO, restore authority** | Client + IT | Scripts exist; no Task Scheduler on client PC |
| B12 | **D13 attachment retention / AV scan policy** | Client | 10MB allow-list only |
| B13 | **D16 archival / legal retention** | Client | Vendor deactivate only |
| B14 | **Document1.pdf** (client clarification) **not in repository** — formal sign-off trail | Client | Referenced in Wave 1–3 reports |
| B15 | **Production-ready flag** | Engineering | `IMPLEMENTATION_STATUS.md` — **NO** |

---

## High-priority gaps (go-live risk, not always hard blockers)

| # | Gap | Notes |
|---|-----|--------|
| H1 | PO export **header-only** (no line detail in XLSX) | UI copy mentions lines; API `report.service.ts` `purchaseOrders` |
| H2 | Report **filters** (date range, vendor, category) — P18 scope largely unbuilt | JSON exports cap at 5000 rows |
| H3 | Global **search budget rollup** — legacy fields, not Wave 2 summary | Wave 2 report §8 |
| H4 | **Software license renewal** workflow external; in-app renew not approved | D21 |
| H5 | **Shared dev DB document integrity** | Phase 03 DR notes |
| H6 | **UI08 optional PNG matrix** | Remaining issues doc |

---

## Windows standalone prerequisites (checklist only — see Wave 5 report §8)

| Item | Status |
|------|--------|
| Node 20+ LTS on target PC | Documented |
| PostgreSQL 15+ local install | Documented (dev example port 5433) |
| API + Web env files | `.env.example` in repo |
| File storage path backup with DB | Script `backup-itdms.mjs`; policy **B11** |
| NSSM / Task Scheduler startup | Recommended in `WINDOWS_STANDALONE_DEPLOYMENT_CHECKLIST.md` — **not installed** |
| TLS for LAN phase | Later |
| Antivirus exclusions | Client IT |

---

## Wave 5 engineering actions (closed in this wave)

| Action | Status |
|--------|--------|
| Requirements traceability audit | `FINAL_CLIENT_REQUIREMENTS_MATRIX.md` |
| Invoice export Wave 2 columns | **Done** — `report.service.ts` |
| Operational **asset-movements** + **employees** XLSX/CSV | **Done** — new report routes |
| Issuance template hooks doc | Existing `ASSET_MOVEMENT_TEMPLATE_INTEGRATION.md` |
| Regression on changed reports | API extended-modules + full suite (see Wave 5 report) |

---

## What is **not** a blocker (explicit)

- ORLEN / Wave 4 UI — **complete**; no further redesign in Wave 5
- In-app SAP PO approval — **out of scope** (D03 confirmed external)
- Automatic FX APIs — **not required** (manual rates confirmed)
- Database reset — **forbidden**

---

**Next step for client:** Review `WAVE5_BUSINESS_CLOSURE_REPORT.md` and `FINAL_CLIENT_REQUIREMENTS_MATRIX.md`; supply D12 templates and sign decision register items **B2–B14** as applicable.
