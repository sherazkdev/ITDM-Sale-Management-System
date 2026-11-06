# ITDMS — Premium UI Improvement Roadmap

**Companion to:** `docs/release/FINAL_UI_UX_AUDIT.md`  
**Date:** 2026-11-06  
**Status:** Phase A + Phase B **IMPLEMENTED & VERIFIED** (2026-11-06); Phases C–E remain proposal-only until approved  
**Constraints:** Preserve Wave 2 finance semantics, D03 SAP PO policy, D09 non-consumption stock, D12 non-official export disclaimer, Windows offline standalone, no unofficial ORLEN artwork

---

## 1. Executive direction

Modernize interaction quality and operational insight **without** rewriting the CRM-derived shell or inventing financial rules.

**North star:** A premium IT operations console — fast tables, honest search, actionable dashboard, clear finance provisional states, offline-safe dependencies.

---

## 2. Proposed premium dashboard structure

### Layout (top → bottom)

| Zone | Content | Data source | Approval |
|---|---|---|---|
| A. Hero | Greeting, refresh, primary CTA | Session | None |
| B. Action KPIs | In stock, issued, under maintenance, unread alerts, expiring contracts+licenses | Extend `/dashboard/summary` filters/links | None for counts |
| C. Inventory split | Serialized vs non-asset counts (+ qty on hand sum if defined) | New summary fields from existing tables | Confirm qty aggregation display |
| D. Ops charts | PO status + maintenance (click → filtered lists) | Existing summary | None |
| E. Finance strip | USD allocation count/total + committed/payment ledger **line counts** (Phase B) | Extended `/dashboard/summary` `budgetOverview` | **Provisional**; does **not** present `remainingUsd` as approved Nov 2026 formula |
| F. Expiry watchlist | Top N contracts & licenses by expiry date | Extend summary or reuse list APIs | None |
| G. Activity | Recent audit with deep links | Existing | None |
| H. Quick actions | Issue, stock entry, new invoice, reports | Nav permissions | None |

### Explicitly deferred / blocked

- Monthly spend trend until expenditure recognition definition confirmed  
- Remaining budget without provisional label until client closes remaining formula  
- Decorative charts with no drill path  

---

## 3. Phased modernization plan

### Phase A — Honesty & friction (1–2 weeks) — P1 — **IMPLEMENTED (2026-11-06)**

1. ~~Fix topbar search labeling; implement `⌘/Ctrl+K` → `/search`~~ **Done** (`Topbar.tsx`; skips when focus is in form fields)  
2. ~~Rename “Global search” → “PO search”~~ **Done** (nav + `/search` page)  
3. ~~Invoice list: search + payment-status filter~~ **Done** (UI + `GET /invoices?search&paymentStatus`)  
4. ~~Issuance Step 2: search/filter eligible assets~~ **Done** (issue + return; selection retained across filters)  
5. ~~Wire Help button~~ **Done** → `/help` operational tips page  

**Risk:** Low. Mostly front-end (+ list filter API).  
**Regression:** Search copy, invoice list query params, issuance selection, workflows E2E.  
**Out of scope (preserved):** budget formulas, stock consumption, CSV import, unofficial logos.

### Phase B — Dashboard usefulness (2–3 weeks) — P1/P2 — **IMPLEMENTED (2026-11-06)**

1. ~~Always show asset distribution + clickable slices → `/assets?status=`~~ **Done**  
2. ~~Add non-asset summary section to dashboard API + UI~~ **Done** (item counts only; no cross-UOM qty sum)  
3. ~~Expiry watchlist (contracts/licenses)~~ **Done** (60-day window; record links)  
4. ~~Permissioned finance strip with **PROVISIONAL** styling (no formula change)~~ **Done** (`budgetOverview`; no approved `remainingUsd`)  
5. ~~Deep links from recent activity where target routes exist~~ **Done** (`dashboard-links.ts`)  
6. ~~Permission-aware quick actions~~ **Done** (asset / non-asset / issue / invoice / reports)  
7. ~~Issuance/return document counts + PO/maintenance drill charts~~ **Done**  

**Risk:** Medium API surface.  
**Regression:** Dashboard permission sectioning; budget notice must remain.  
**Verified on `itdms_e2e`:** API typecheck + `dashboard.test.ts` 3/3; web typecheck/lint/vitest 49/49; Playwright `dashboard-phase-b` 2/2, a11y 5/5, responsive 162/162; screenshots `dashboard-phase-b-*-loaded.png`.  
**Out of scope (preserved):** budget formula services, Non-Asset consumption, CSV import, unofficial logos, commits/pushes.

### Phase C — Enterprise tables (2–4 weeks) — P1/P2

1. Sticky table headers  
2. Optional column visibility (localStorage; non-mutating)  
3. Server-side sort where APIs already accept sort params (add only if present or approved)  
4. Persist filters in URL query for shareable views  
5. Table “Export current view” → existing report endpoints with documented filters  
6. Either **wire** unused `DataTableToolbar` (replace CRM “score” options with ITDMS sorts) on 1–2 directory pages, or **remove** the dead CRM leftover to reduce confusion  

**Risk:** Medium. Avoid virtual DnD mutation.  
**Regression:** List pages, pagination meta.

### Phase D — Form craft (1–2 weeks) — P2

1. Unsaved-change guards on create/edit  
2. Searchable employee/vendor/asset selects for large datasets  
3. Stronger required-field indicators  
4. Budget page IA: tabs (Years | Allocations | Lookups | Ledger) without changing calculations  

**Risk:** Low–medium.  
**Regression:** Form submit flows.

### Phase E — Optional / approval-gated — P3

1. CSV/Excel **import** wizard (employees/vendors/stock) with preview, duplicates, audit, rollback  
2. Personal column reorder (preferences only)  
3. Official logo drop-in when client supplies files  
4. True cross-entity global search  
5. Motion polish (keep Framer Motion minimal)  

---

## 4. Detailed finding cards

### UX-001 — Misleading search affordances

| Field | Value |
|---|---|
| Page/module | Topbar + Global search |
| Current | Placeholder “Search purchase orders…”, `⌘K` shown; no keydown handler; page titled Global search but exact PO only |
| Expected | Accurate labeling; working shortcut; scope tip retained |
| Evidence | `Topbar.tsx`; `search/page.tsx`; `PO_SEARCH_SCOPE_NOTE`; screenshots `search-1440-loaded.png` |
| Severity | **P1** |
| Client req | Search usefulness (ops); not D12 |
| Client approval | No for copy/shortcut; **Yes** for expanding beyond PO hub |
| Backend impact | None for shortcut; new APIs if true global search |
| DB impact | None |
| Complexity | S |
| Regression | Topbar, search empty states |
| Solution | Bind Ctrl/Meta+K; rename nav label; or implement approved multi-entity search |

### UX-002 — Dashboard analytics shallow → **Closed (Phase B)**

| Field | Value |
|---|---|
| Page/module | `/dashboard` |
| Current | Premium analytics console: drill-down KPIs/charts, non-asset item counts, movements, 60d watchlist, activity links, permissioned quick actions, provisional USD `budgetOverview` |
| Expected | Met for Phase B scope; remaining-budget formula UI awaits backend |
| Evidence | `dashboard/page.tsx`; `dashboard.service.ts`; `dashboard-phase-b-*-loaded.png` |
| Severity | **P1 → Closed** |
| Client req | Operational overview |
| Approval | Finance visuals stay provisional until remaining formula closed |
| Backend | Summary extended (`nonAssetStock`, `movements`, `expiryWatchlist`, `budgetOverview`) |
| DB | Read-only aggregations |
| Complexity | M |
| Regression | Permission-section inclusion; Playwright dashboard-phase-b + a11y + responsive |
| Solution | Implemented Phase B structure above |

### UX-003 — Invoices list lacks filters

| Field | Value |
|---|---|
| Page/module | `/invoices` |
| Current | Pagination only; no search/status filter |
| Expected | Search by invoice/PO #; filter Unpaid/Partial/Paid |
| Evidence | `invoices/page.tsx`; `invoices-1440-loaded.png` |
| Severity | **P1** |
| Approval | No |
| Backend | Confirm list query supports filters; add if missing |
| Complexity | S–M |
| Regression | Invoice list E2E |
| Solution | ListToolbar + FilterSelect; wire API |

### UX-004 — Advanced table capabilities missing

| Field | Value |
|---|---|
| Page/module | Shared `DataTable` |
| Current | Client sort, overflow, optional hideOnMobile |
| Expected | Sticky header, column visibility, better keyboard row open |
| Evidence | `DataTable.tsx` |
| Severity | **P1** |
| Approval | No for UX; Yes if server sort contract changes |
| Backend | Optional sort params |
| Complexity | M |
| Regression | All list pages |
| Solution | Enhance `DataTable` carefully; no DnD mutation |

### UX-005 — Issuance asset picker scalability

| Field | Value |
|---|---|
| Page/module | `/asset-issuance` |
| Current | Full eligible list as checkboxes |
| Expected | Search/filter within Step 2; keep atomic submit |
| Evidence | `asset-issuance/page.tsx`; `asset-issuance-1440-loaded.png`; historical long-list UI08 shot |
| Severity | **P1** |
| Approval | No |
| Backend | May already page assets — use search params |
| Complexity | S |
| Regression | Issue/return E2E |
| Solution | Debounced filter over loaded set or server search |

### UX-006 — Budgets operator UX without visualization

| Field | Value |
|---|---|
| Page/module | `/budgets` |
| Current | Multi-form page; provisional banner; ID lookups |
| Expected | Tabbed IA + utilization bars from existing summary fields; searchable PO/vendor pickers |
| Evidence | `budgets/page.tsx`; `budget.service.ts` remainingUsd; `budgets-1440-loaded.png` |
| Severity | **P1** (UX) / finance formula remains provisional |
| Approval | **Yes** to change remaining formula; **No** for display of existing fields with badge |
| Backend | Reuse summary |
| Complexity | M |
| Regression | Wave 2 finance tests |
| Solution | Visualize `committedUsd`, `actualPaidUsd`, `remainingUsd`, `utilizationPercent` with provisional notice |

### UX-007 — Inert Help control

| Field | Value |
|---|---|
| Page/module | Topbar |
| Current | Button with no action |
| Expected | Open docs/help route or remove |
| Evidence | `Topbar.tsx` |
| Severity | **P2** |
| Complexity | S |
| Solution | Link to internal runbook or hide until content exists |

### UX-008 — No unsaved-change warnings

| Field | Value |
|---|---|
| Page/module | Create/edit forms |
| Current | Navigate away loses input |
| Expected | Dirty-state confirm |
| Evidence | No `beforeunload` / dirty guards in web src |
| Severity | **P2** |
| Complexity | S–M |
| Solution | Shared `useUnsavedWarning` on RHF `isDirty` |

### UX-009 — Export limits / column glossary opaque

| Field | Value |
|---|---|
| Page/module | `/reports` |
| Current | Strong format buttons; weak limit/column docs |
| Expected | Per-report column list + max rows messaging |
| Evidence | `reports/page.tsx`; `reports-1440.png` |
| Severity | **P2** |
| Client req | D12 Excel operational (confirmed); official templates blocked |
| Approval | No for UX copy; Yes for official templates |
| Complexity | S |
| Solution | Static column glossary + API-provided limit header if exists |

### UX-010 — Documents not browsable

| Field | Value |
|---|---|
| Page/module | `/documents` |
| Current | Upload + metadata lookup by id |
| Expected | Optional filtered list by owner type |
| Evidence | `documents/page.tsx` |
| Severity | **P2** |
| Approval | Confirm if library view required |
| Backend | List endpoint if missing |
| Complexity | M |

### UX-011 — Go-live branding / RBAC blockers

| Field | Value |
|---|---|
| Page/module | Brand + Admin |
| Current | Typographic logo fallback; provisional admin role naming |
| Expected | Client logo files; final D01 matrix |
| Evidence | `ORLEN_FINAL_BRANDING_REPORT.md`; Decision Register D01 |
| Severity | **P0 (release)** / not a runtime crash |
| Approval | **Yes** |
| Solution | Drop files in `public/brand/`; apply approved roles — no invented logo |

### UX-012 — Bulk import (optional)

| Field | Value |
|---|---|
| Page/module | Employees / Assets / Vendors |
| Current | Manual create only |
| Expected | If approved: preview, validate, dedupe, permissions, audit, rollback |
| Evidence | No import code; EMS has CRM ImportModal (pattern only) |
| Severity | **P3** |
| Approval | **Required** |
| Backend/DB | New import jobs/tables likely |
| Complexity | L |
| Solution | Do **not** implement until signed requirement |

---

## 5. Table capability matrix (target)

| Capability | Now | Phase | Notes |
|---|---|---|---|
| Sort | Client page | C | Prefer server sort when API ready |
| Search/filter | Uneven | A | Invoices first |
| Column visibility | No | C | localStorage |
| Column width resize | No | E | Optional |
| Sticky header | No | C | CSS sticky |
| Row selection bulk | No | E | Only safe domains (e.g., mark notifications read) |
| Export filtered | Via `/reports` | C | Pass FY/filters |
| DnD reorder columns | No | E | Preferences only |
| DnD mutate records | No | — | **Forbidden** for finance/stock |

---

## 6. Import / export recommendations

### Export (proceed)

- Keep `/reports` as hub  
- Add column glossary + row-limit callouts  
- Allow “export with current list filters” where APIs support query parity  
- Retain NON-OFFICIAL-D12 disclaimer until official templates arrive  

### Import (hold)

- Proposal only for employees, vendors, asset/non-asset registration  
- Must include: permissions, validation, duplicates, preview, audit, rollback  
- Explicitly **out of scope** until client approval  

---

## 7. Best improvements shortlist

### Best dashboard improvements

1. Clickable asset status distribution  
2. Non-asset inventory KPIs  
3. Expiry watchlist  
4. Provisional finance utilization strip (no formula change)  
5. Activity deep links  

### Best table improvements

1. Invoice search/status filters  
2. Sticky headers  
3. Column visibility  
4. URL-persisted filters  
5. Keyboard-open row details  

### Best workflow improvements

1. Issuance asset search  
2. Searchable selects for employees/vendors  
3. Unsaved guards  
4. Budget page tabs  

---

## 8. Reference-project adaptation rules

From `D:\employee-management-system` (read-only):

| Adapt | Do not adapt |
|---|---|
| Denser dashboard composition | Lead/deal/revenue KPIs |
| List meta toolbars | Kanban DnD for stage mutation |
| Clear empty states | CRM import without ITDMS controls |
| Period filter **UI** only if backed by real ITDMS series | Fake “Last 7 days” with no API |

---

## 9. Complexity & risk legend

| Size | Meaning |
|---|---|
| S | ≤2 days, localized UI |
| M | 3–8 days, API + multiple pages |
| L | Multi-week, new workflows/approvals |

**Regression anchors:** Playwright UI08 routes, wave3 finance/inventory, a11y sample, dashboard permission sections, report disclaimer headers.

---

## 10. Decision gates

1. ~~Confirm whether nav “Global search” may be renamed without a true multi-entity search epic.~~ **Phase A done** (PO search).  
2. ~~Dashboard provisional finance strip without treating `remainingUsd` as approved.~~ **Phase B done** (USD allocations + ledger line counts only).  
3. Confirm import is unwanted for go-live (recommended default: **defer**).  
4. Supply official ORLEN logo files when ready.  
5. ~~Explicit approval to start **Phase A**.~~ Done.  
6. ~~Explicit approval to start **Phase B**.~~ Done.  
7. Explicit approval required before **Phase C** (enterprise tables).

---

## 11. Stop condition

**STOP after Phase B (2026-11-06):** Phase A + B code verified on `itdms_e2e`. Do **not** start Phase C until approved. No production deployment; no commits/pushes from this phase.
