# Pre-Deployment Gap List (Wave 5)

**Project:** ITDMS  
**Date:** 2026-11-03 (refreshed **2026-11-08** — Phase 5)  
**Purpose:** Exact blockers before Windows standalone deployment and client UAT — **no deploy in Wave 5**

---

## Release blockers (must close before production readiness)

| # | Gap | Owner | Evidence / reference |
|---|-----|--------|----------------------|
| B1 | **Client UAT not executed** | Client + IT | `UAT_EXECUTION_CHECKLIST.md` — plan only |
| B2 | **D01 final RBAC matrix** — role names and permissions not signed | Client | Seed `it_admin_proposed` only; `CLIENT_DECISION_REGISTER.md` D01 |
| B3 | **D02 authentication method** — LDAP/AD vs local accounts | Client | Blocks if directory mandatory |
| B4 | ~~`remainingUsd` formula~~ | — | **CLOSED Phase 2:** Remaining = allocated − utilized — `budget-phase2-acceptance` |
| B5 | **Non-USD allocation remaining USD** — no cross-rate at allocation level | Client | Wave 2 report §8 |
| B6 | **Invoice reversals / credit notes** — not implemented | Client | D05 partial; no workflow |
| B7 | **D12 official PDF/Excel layouts** — operational exports only (`NON-OFFICIAL-D12`) | Client | Blank forms not in repo |
| B8 | ~~D10 department on issuance~~ | — | **CLOSED Phase 3:** `receivingDepartment` snapshot — D10 report |
| B9 | ~~D09 non-asset movements~~ | — | **CLOSED Phase D09:** full ledger + UI — D09 report |
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

**Phase 5 addendum:** See `FINAL_CLIENT_REQUIREMENTS_CLOSURE_REPORT.md`. Remaining blockers: **B1–B3, B6–B7, B11–B15** (UAT, D01/D02, reversals, D12, prod backup, formal PDF).

**Prompt 2 addendum (2026-11-08):** Full local regression **green** — API Vitest **91/91**, Web **50/50**, Playwright **315/0/216** on `itdms_e2e` (see `FINAL_FULL_REGRESSION_CLOSURE_REPORT.md`). **No new application defect blockers**; release blockers unchanged.

**Stage 4 addendum (2026-11-08):** Offline manifest **1084** files; backup/rotation + isolated restore **VERIFIED**; D09/D10 migrations applied on `itdms_deploy_rehearsal`; **`start-itdms-production.ps1`** web launcher fixed (wrong `npx` app on port). **Native Windows PostgreSQL**, client Task Scheduler, and packaged web re-smoke **NOT VERIFIED** (Docker stopped late session). See `docs/deployment/FINAL_WINDOWS_STANDALONE_READINESS.md`. **Production-ready: NO.**

**Stage 5 addendum (2026-11-08):** **`ENGINEERING READY — CLIENT ACCEPTANCE PENDING`**. UAT execution package published; client UAT **NOT RUN**; full packaged API+DB rehearsal **BLOCKED** (Docker engine pipe). Client actions: `REMAINING_CLIENT_ACTIONS.md`. Handover: `FINAL_HANDOVER_READINESS_REPORT.md`.

**Next step for client:** Supply D12 templates; sign D01/D02/D17; authorize staging UAT; confirm reversal policy before B6 work.
