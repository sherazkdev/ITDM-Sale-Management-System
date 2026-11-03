# CRM vs ITDMS — Deep Design & Layout Audit (Audit Only)

**Date:** 2026-11-03  
**Reference (read-only):** `D:\employee-management-system` (BizCRM)  
**Target:** `D:\ITDM-Sale-Management\apps\web`  
**Method:** Independent source inspection + existing repo screenshots. **No code was modified.**

---

## Executive summary

| Finding | Detail |
|---|---|
| **Shell (sidebar / topbar / main padding)** | **Structurally identical** to CRM — same Tailwind classes on `(app)/layout` and ITDMS `AuthenticatedAppShell`. |
| **Design tokens & shared primitives** | **Aligned** — `globals.css`, `tailwind.config.ts`, `KpiCard`, `DataTable`, `PageHeader`, `Input` (`h-10`), etc. match CRM copies. |
| **Why ITDMS feels smaller / narrower** | **Not** primarily the app shell. The gap is **page composition**: ITDMS list/create flows use **narrower max-width constraints** (`max-w-xl` forms, `sm:max-w-xs` list search), **omit CRM list KPI bands**, **simpler create layouts** (no `lg:grid-cols-[1fr_320px]` + multi-card forms), and a **dashboard with less vertical chart mass** (no CRM `h-72` sales area chart / funnel column). |
| **Previous “high fidelity” claims** | **Partially supported** for tokens and shell; **overstated** for holistic visual parity — UI08/responsive/axe pass ≠ layout parity; CRM fidelity report lacked authenticated CRM dashboard PNG. |
| **Honest fidelity verdict** | **Medium–low visual parity at page level** despite **high token/shell parity**. Fixing shared list/create patterns will improve most modules without redesigning the shell. |

---

## 1. Evidence sources

| Source | Used for |
|---|---|
| CRM + ITDMS TSX/CSS | Primary measurements (class-derived) |
| `docs/frontend/CRM_DESIGN_FIDELITY_REPORT.md` | Prior claims validation |
| `docs/frontend/UI00_*.md`, `UI08_FINAL_QA_REPORT.md` | Route inventory, token docs |
| `docs/frontend/screenshots/crm-fidelity/*.png` | ITDMS 1440 light/dark (login, dashboard, employees, PO) |
| `docs/frontend/screenshots/crm-fidelity/crm-login-1440-reference.png` | CRM login only |
| Live browser (this audit) | ITDMS login @ 1440×900; **authenticated ITDMS/CRM not measured live** (staging web + dev credentials mismatch) |

---

## 2. Original CRM design measurements (source-derived)

**Files:** `D:\employee-management-system\src\app\(app)\layout.tsx`, `components/layout/Sidebar.tsx`, `Topbar.tsx`, `app/globals.css`, `tailwind.config.ts`

| Property | CRM value | Source |
|---|---|---|
| Sidebar expanded | `w-[240px]` | `Sidebar.tsx` L20 |
| Sidebar collapsed | `w-[72px]` | `Sidebar.tsx` L20 |
| Logo header | `h-[64px]`, `px-5 py-4` | `Sidebar.tsx` L23 |
| Nav item | `px-3 py-2 text-sm`, icons `h-[18px] w-[18px]` | `Sidebar.tsx` L47–54 |
| Topbar height | `h-16` (64px) | `Topbar.tsx` L15 |
| Topbar padding | `px-4 md:px-6` | `Topbar.tsx` L15 |
| Topbar search cap | `flex-1 max-w-xl` | `Topbar.tsx` L38 |
| Main padding | `p-4 md:p-6 lg:p-8` | `(app)/layout.tsx` L12 |
| Main max width | `max-w-[1600px] w-full mx-auto` | `(app)/layout.tsx` L12 |
| KPI grid (dashboard) | `xl:grid-cols-5`, gap-4, skeleton `h-28` | `dashboard/page.tsx` L479–481 |
| Sales chart block | `h-72` (288px) | `dashboard/page.tsx` L256 |
| Donut container | `h-44 w-44` (176px), innerR 56 / outerR 80 | `dashboard/page.tsx` L352–362 |
| DataTable header/cell | `px-4 py-3`, `text-sm` | `DataTable.tsx` |
| Input height | `h-10`, `text-sm` | `input.tsx` |
| List page search (customers) | `Input` with `className="max-w-xl"` (576px cap) | `customers/page.tsx` L219 |
| List KPI band (customers) | `grid … xl:grid-cols-4 gap-4`, skeleton `h-[92px]` | `customers/page.tsx` L200–210 |
| Create lead form | **Full width** `grid lg:grid-cols-[1fr_320px]`, cards `md:grid-cols-2` fields | `leads/new/page.tsx` L91+ |

---

## 3. Current ITDMS measurements (source-derived)

**Files:** `apps/web/src/components/shell/AuthenticatedAppShell.tsx`, `components/layout/*`, pages under `app/(app)`.

| Property | ITDMS value | Source | vs CRM |
|---|---|---|---|
| Sidebar / topbar / main shell | Same classes as CRM | `AuthenticatedAppShell.tsx` L18–24 | **Match** |
| Dashboard KPI grid | Same `xl:grid-cols-5` | `dashboard/page.tsx` L231 | **Match** |
| Dashboard row 2 | `grid-cols-12`; cards `lg:col-span-6/4/8` | `dashboard/page.tsx` L250+ | **Different composition** (no 6+3+3 CRM row) |
| Large area chart | **Absent** (IT ops metrics only) | `dashboard/page.tsx` | **Product + layout** |
| Donut / horizontal bars | `StatusDonut`, `HorizontalBarList` | `DashboardCharts.tsx` | **Match CRM donut/bar metrics** (post–UI08 fidelity) |
| List search | `sm:max-w-xs` (**320px**) | `ListToolbar.tsx` L27 | **Narrower than CRM list `max-w-xl`** |
| Create forms (8 routes) | `mx-auto … max-w-xl` (**576px**) | `employees/new`, `vendors/new`, etc. | **Much narrower than CRM create** |
| Asset issuance forms | `max-w-2xl` | `asset-issuance/page.tsx` | Narrower than CRM multi-card create |
| Budget filters | `max-w-xs` | `budgets/page.tsx` | Extra local narrowing |
| Invoice payment block | `max-w-xl` | `invoices/[id]/page.tsx` | Narrower than full-width CRM finance panels |
| `FormStepper` | **Defined but unused** on pages | `FormStepper.tsx` only | CRM create uses step labels inline |

---

## 4. Measurable layout audit (1440 × 900 desktop, sidebar expanded)

**Legend:** *Rendered* = from DOM when authenticated; *Calculated* = from CSS box model when shell classes apply.

### 4.1 Application shell (calculated — identical CRM & ITDMS)

Assumptions: viewport **1440px**, sidebar **240px**, `md+` breakpoint active, main `lg:p-8` (32px × 2).

| Property | CRM | ITDMS | Difference | Cause |
|---|---|---|---|---|
| Sidebar width | 240px | 240px | 0 | `w-[240px]` |
| Main column width | 1200px | 1200px | 0 | `1440 − 240` |
| `<main>` box width | 1200px | 1200px | 0 | `max-w-[1600px]` not binding below 1600 |
| Content area (inside main padding) | **~1136px** | **~1136px** | 0 | `1200 − 64` padding |
| Topbar height | 64px | 64px | 0 | `h-16` |
| Page horizontal padding | 32px (lg) | 32px (lg) | 0 | `lg:p-8` |

**Conclusion:** At 1440px, **ITDMS is not shell-constrained narrower than CRM.** Any “narrow page” perception comes from **inner** `max-w-*` on page content.

### 4.2 Page-level content width (calculated at 1440)

| Property | CRM reference | ITDMS | Difference | Cause |
|---|---|---|---|---|
| List table usable width | ~1136px (full main inner) | ~1136px | ~0 | Full-width `DataTable` |
| List search field max | 576px (`max-w-xl`) | **320px** (`sm:max-w-xs`) | **−256px** | `ListToolbar.tsx` |
| Create form max | ~1136px (lead form grid) | **576px** (`max-w-xl` + `mx-auto`) | **−560px** usable | All `*/new/page.tsx` |
| KPI card height | ~112px skeleton / auto `p-5` | Same component | ~0 | Shared `KpiCard` |
| Donut box | 176×176px | 176×176px | 0 | `h-44 w-44` |
| CRM sales chart | 288px tall | **N/A** | −288px vertical mass | CRM-only widget |
| Table row (cell) | `py-3` + text-sm | Same | ~0 | Shared `DataTable` |

### 4.3 Other viewports

| Viewport | Shell note | ITDMS-specific |
|---|---|---|
| **1366×768** | Sidebar 240 → main ~1126px inner ~1062px | Same inner max-width issues on forms |
| **1280×800** | Main ~1040px inner ~976px | `xl:grid-cols-5` KPIs may wrap to 3 cols (both apps) |
| **1024×768** | Sidebar hidden → full width; `md:p-6` | Mobile sidebar `w-72` overlay |
| **390×844** | Single column | UI08 PNGs exist under `screenshots/ui08/*-390.png` |

### 4.4 Rendered measurements (this audit session)

| Attempt | Result |
|---|---|
| ITDMS @ 3012 login 1440×900 | **OK** — login layout visible |
| ITDMS authenticated DOM measure | **Blocked** — `admin.dev` not valid against API wired to `:3012` staging |
| CRM authenticated | **Blocked** — no credentials in audit scope; no auth bypass |

**Existing rendered evidence:** ITDMS 1440 PNGs in `docs/frontend/screenshots/crm-fidelity/` and `ui08/*-1440.png` show full-width tables but **visually sparse dashboard** vs CRM marketing preview on login.

---

## 5. Previous report validation

| Prior claim | Evidence | Audit verdict |
|---|---|---|
| Tokens identical (UI00 / fidelity §1–2) | Diff `globals.css` / `tailwind.config.ts` | **Supported** |
| Shell 240/72, main 1600/padding (fidelity §1) | Line-by-line match `(app)/layout` vs `AuthenticatedAppShell` | **Supported** |
| “No per-route class rewrites required” (fidelity §4) | ITDMS `max-w-xl` create pattern not compared to CRM `leads/new` | **Incorrect for create flows** |
| “High fidelity” / subjective parity (fidelity §8+) | No authenticated CRM dashboard PNG; ITDMS dashboard composition differs | **Overstated** |
| UI08 VERIFIED | Responsive overflow + axe + build | **Valid for QA gates**, **not** design parity proof |
| NotificationBell / mobile nav fixes | Source present in ITDMS | **Supported** (chrome widgets) |

---

## 6. Shared root causes (priority order)

### RC-1 — Create/edit forms capped at `max-w-xl` + centered

| | |
|---|---|
| **Affected** | `/employees/new`, `/vendors/new`, `/assets/new`, `/contracts/new`, `/purchase-orders/new`, `/invoices/new`, `/maintenance/new`, `/software-licenses/new`; payment form on `/invoices/[id]` |
| **CRM** | Multi-card, full-width grid, optional 320px sidebar column (`leads/new`) |
| **ITDMS** | Single `Card` + `mx-auto max-w-xl` (~576px) |
| **Cause** | Explicit Tailwind on `<form>` |
| **Files** | e.g. `apps/web/src/app/(app)/employees/new/page.tsx` L87–90 |
| **Fix direction** | Replace with CRM create template: `grid lg:grid-cols-[1fr_320px]` or minimum `max-w-none` + `md:grid-cols-2` inside full-width cards |
| **Regression** | Low — form validation unchanged |
| **Shared fix** | **Yes** — one create-form layout primitive |

### RC-2 — `ListToolbar` search `sm:max-w-xs`

| | |
|---|---|
| **Affected** | All list pages using `ListToolbar` (employees, vendors, assets, POs, invoices, etc.) |
| **CRM** | List pages use full-row `Input max-w-xl` (576px) |
| **ITDMS** | `sm:max-w-xs` (320px) |
| **Cause** | `ListToolbar.tsx` L27 |
| **Fix direction** | Align to `max-w-xl` or `flex-1` without cap |
| **Shared fix** | **Yes** |

### RC-3 — Missing list-page KPI bands

| | |
|---|---|
| **Affected** | Most ITDMS list modules |
| **CRM** | e.g. Customers: 4× `KpiCard` row above filters (`customers/page.tsx` L200–210) |
| **ITDMS** | PageHeader → toolbar → table only |
| **Cause** | Product choice + no port of CRM list summary pattern |
| **Fix direction** | Optional KPI row using same `KpiCard` + `xl:grid-cols-4` when API stats exist |
| **Shared fix** | Pattern reusable per module |

### RC-4 — Dashboard composition & density

| | |
|---|---|
| **Affected** | `/dashboard` |
| **CRM** | 5 KPIs + **12-col row**: 6-col area chart (`h-72`) + 3-col funnel + 3-col tasks + second row sources/donut/activities |
| **ITDMS** | Permission-filtered KPIs + 12-col cards (donut, bars, text stats); **no tall area chart**; fewer simultaneous widgets |
| **Cause** | Different metrics (intentional) + fewer/lighter sections |
| **Fix direction** | Add ITDMS-relevant **wide chart or timeline** with CRM heights (`h-72`); rebalance `col-span-*` to mirror CRM 6/3/3 rhythm |
| **Regression** | Medium — API data required |
| **Not recommended** | Fake CRM sales series |

### RC-5 — Detail pages: CRM tabs vs ITDMS stacked sections

| | |
|---|---|
| **Affected** | `/employees/[id]`, `/vendors/[id]`, `/purchase-orders/[id]`, etc. |
| **CRM** | e.g. `customers/[id]`: tabs, side panels, dense grids |
| **ITDMS** | `SectionCard` stacks, full width but **less horizontal structure** |
| **Cause** | ITDMS CRUD simplification |
| **Fix direction** | Port CRM detail grid/tabs where modules align (PO ↔ deal) |

### RC-6 — `max-w-[1600px] mx-auto` on `<main>` (shared with CRM)

| | |
|---|---|
| **Affected** | All pages both apps |
| **Behavior** | On viewports **> ~1840px**, content caps at 1600px with outer gutters |
| **User concern** | Can feel “not using full screen” on ultrawide — **same in CRM** |
| **Fix direction** | Only if client wants full-bleed: remove or raise cap in **both** designs consistently |

### RC-7 — Minor chrome differences

| Item | CRM | ITDMS |
|---|---|---|
| Sidebar footer | `UpgradeCard` | Removed (intentional) |
| ITDMS topbar search | N/A | Read-only redirect to `/search` |
| `FormStepper` | Used on CRM creates | **Unused** in ITDMS |

---

## 7. Full route audit (32 app routes + proxy)

Verified against `UI08_FINAL_QA_REPORT.md` and filesystem (`apps/web/src/app/**/page.tsx`).

| # | Module | Routes | Closest CRM analogue | Layout parity |
|---|---|---|---|---|
| 1 | Dashboard | `/dashboard` | `/dashboard` | **Medium** — RC-4 |
| 2 | Employees | `/employees`, `/new`, `/[id]` | `/customers`, `/customers/new`, `/[id]` | **Low** on new; **Medium** list |
| 3 | Vendors | `/vendors`, `/new`, `/[id]` | `/companies` | **Low** create |
| 4 | Asset categories | `/asset-categories` | (none — use list pattern) | **Medium** |
| 5 | Inventory | `/assets`, `/new`, `/[id]` | `/products` or assets metaphor | **Low** create |
| 6 | Contracts | `/contracts`, `/new`, `/[id]` | `/contracts` if present / deals | **Low–Medium** |
| 7 | Purchase orders | `/purchase-orders`, `/new`, `/[id]` | `/deals` PO-like lists | **Medium** list; **Low** new |
| 8 | Asset issuance | `/asset-issuance` | CRM issue flows (partial) | **Medium** — `max-w-2xl` forms |
| 9 | Asset returns | Same page (return tab) | — | Same as issuance |
| 10 | Invoices | `/invoices`, `/new`, `/[id]` | Invoices / quotes | **Low** new; payments `max-w-xl` |
| 11 | Payments | `/invoices/[id]` payment UI | CRM billing panels | **Low** width |
| 12 | Budgets | `/budgets` | Budget/finance CRM widgets | **Medium** — local `max-w-xs` |
| 13 | Maintenance | `/maintenance`, `/new`, `/[id]` | Tasks / service | **Low** create |
| 14 | Software licenses | `/software-licenses`, `/new`, `/[id]` | License tracking (partial) | **Low** create |
| 15 | Global search | `/search` | Global search / PO hub | **Medium** |
| 16 | Documents | `/documents` | Attachments / files | **Medium** |
| 17 | Reports | `/reports` | `/reports` | **Medium** |
| 18 | Notifications | `/notifications` | Notifications list | **Medium–High** |
| 19 | Administration | `/admin` | `/settings/*` | **Medium** |
| 20 | Audit logs | `/admin/audit` | Audit / activity | **Medium** |
| + | Asset history | `/asset-history` | Activity log | **Medium** |
| + | Auth | `/login` | `/login` | **High** (illustration copy differs) |
| + | API proxy | `/api/v1/[...path]` | — | N/A |

**Total pages audited:** **32** Next routes + **1** proxy; **20** functional modules mapped (+ asset-history, login).

---

## 8. Page-by-page notes (condensed)

### List pages (employees, vendors, assets, contracts, POs, invoices, maintenance, licenses)

- **Shared pattern:** `PageHeader` + `ListToolbar` + full-width `DataTable` — **width OK**, search **too narrow** (RC-2).
- **Missing vs CRM:** KPI summary row, `ViewToggle`, import/export menus on customers/deals.
- **CRM reference:** `customers/page.tsx`, `deals/page.tsx`.

### Create pages (all `*/new`)

- **Dominant issue:** RC-1 (`max-w-xl`).
- **CRM reference:** `leads/new/page.tsx` (full-width grid + sidebar preview).

### Detail pages

- **PO** (`purchase-orders/[id]`): Full-width `SectionCard` + table — acceptable width; less dense than CRM customer/deal detail tabs.
- **Employees/vendors/[id]`: Similar stacked cards; fewer columns than CRM `[id]` pages.

### Dashboard

See §9.

### Budgets, asset-issuance, admin, search, documents, reports, notifications

- Generally use full main width; local `max-w-xs` / `max-w-2xl` on subforms filters create **patchy** narrow zones.
- Screenshots: `docs/frontend/screenshots/ui08/<module>-1440.png`.

---

## 9. Dashboard comparison (high priority)

| Area | CRM | ITDMS | Feels different because |
|---|---|---|---|
| KPI row | Fixed 5 sales KPIs | Dynamic IT ops KPIs (count varies) | Fewer cards → more empty grid slots when permissions hide metrics |
| Row 2 layout | 6 + 3 + 3 columns | Often 6 + 6 or 4 + 4 + 8 | Less “control room” rhythm |
| Primary chart | `SalesOverviewChart` **h-72** | No equivalent | Largest single visual mass missing |
| Funnel | Colored bar funnel | PO/maintenance **horizontal bars** | Similar bar component, different column width |
| Donut | Deal status | Asset register | Same `innerRadius 56` / `outerRadius 80` |
| Activities | Recent activities column | Audit-based recent activity | Narrower content when sparse |
| Quick tip | Automation CTA | Quick links / budget notice | Different copy |

**Intentional:** No CRM leads/deals/revenue data.  
**Layout defect:** Missing **wide, tall chart row** and CRM’s **6/3/3** grid balance — not fixable by font scaling alone.

---

## 10. Shared component discrepancies

| Component | Status | Action in future phase |
|---|---|---|
| `Sidebar`, `Topbar`, `PageHeader`, `KpiCard`, `DataTable`, `Input`, `Button` | Match CRM | Maintain |
| `ListToolbar` | **Narrow search** | DESIGN-03 |
| Create form layout | **No shared CRM template** | DESIGN-03 new layout wrapper |
| `FormStepper` | Orphaned | Wire on creates or remove |
| `DashboardCharts` | Aligned to CRM bar/donut metrics | Extend with tall chart container |
| `SectionCard` | ITDMS-specific | Keep; use in full-width grids |
| `NotificationBell` | Ported | OK |
| CRM `ExportMenu` / `ImportModal` | Absent on ITDMS lists | Product optional |

---

## 11. Screenshot evidence availability

| Comparison | Available? |
|---|---|
| CRM login vs ITDMS login @ 1440 | **Yes** — `crm-login-1440-reference.png` vs `itdms-login-1440-light.png` |
| CRM dashboard vs ITDMS dashboard @ 1440 | **ITDMS only** — `itdms-dashboard-1440-light.png` |
| CRM customers vs ITDMS employees @ 1440 | **ITDMS only** — `itdms-employees-1440-light.png` |
| Side-by-side authenticated CRM | **No** — requires client credentials |
| UI08 mobile 390 | **Yes** — per-route under `screenshots/ui08/` |

**Additional CRM screenshots needed for sign-off:** Authenticated **dashboard**, **customers list**, **leads/new**, **customers/[id]** at 1440 and 1280 (light).

---

## 12. Proposed implementation plan (do not implement in this audit)

### DESIGN-01 — Application shell

**Scope:** Optional only if full-bleed desired — `AuthenticatedAppShell.tsx`, CRM `(app)/layout.tsx`.  
**Files:** 2 (+ docs).  
**Risk:** Low; affects all pages if `max-w-[1600px]` changed.

### DESIGN-02 — Dashboard

**Scope:** Re-grid `dashboard/page.tsx`; add ITDMS-relevant `h-72` chart section; normalize KPI count row.  
**Files:** ~2–3 (`dashboard/page.tsx`, `DashboardCharts.tsx`, API types).  
**Risk:** Medium (data/API).

### DESIGN-03 — Shared components

**Scope:** `ListToolbar.tsx` (`max-w-xl`); new `CreateFormLayout` (from CRM `leads/new`); optional `ListKpiBand`.  
**Files:** ~4–6 + 8 create pages.  
**Risk:** Low–medium.

### DESIGN-04 — Individual pages

**Scope:** Budgets/asset-issuance/invoices payment `max-w-*`; detail page tabs where CRM analog exists.  
**Files:** ~15–20 page files.  
**Risk:** Medium (UX flows).

### DESIGN-05 — Responsive & visual verification

**Scope:** Re-run Playwright capture spec; add CRM-side captures when credentials available; 1440/1280/390 matrix.  
**Files:** `e2e/crm-fidelity-capture.spec.ts`, screenshot dirs.  
**Risk:** Low.

---

## 13. Risks to existing functionality

- Changing main `max-w` affects horizontal scroll tests (UI08 responsive suite) — re-run required.
- Dashboard API changes must respect permission filtering.
- Widen forms without grid may hurt mobile — preserve CRM responsive breakpoints (`md:grid-cols-2`).

---

## 14. Final honest visual fidelity verdict

| Layer | Rating | Notes |
|---|---|---|
| Tokens / typography / inputs | **High** | Evidence in source |
| App shell | **High** | Byte-level class match |
| Shared data table / KPI card | **High** | Same components |
| List pages | **Medium** | Full table width; narrow search; no KPI band |
| Create / edit flows | **Low** | `max-w-xl` center column |
| Dashboard | **Medium–Low** | Missing CRM-scale chart row and column rhythm |
| Detail pages | **Medium** | Full width but less CRM tab density |
| **Overall visual parity** | **Medium–Low** | User “smaller/narrower” concern **valid for forms and dashboard density**, **not** for shell width at 1440 |

---

## 15. Priority-ranked fixes (for implementation phase)

1. **P0** — Remove/replace `max-w-xl mx-auto` on all create forms (RC-1).  
2. **P0** — Widen `ListToolbar` search to CRM `max-w-xl` (RC-2).  
3. **P1** — Dashboard: add tall primary chart + 6/3/3 grid (RC-4).  
4. **P1** — Introduce list KPI bands where stats exist (RC-3).  
5. **P2** — Detail pages: tabs/multi-column where CRM analog exists (RC-5).  
6. **P3** — Evaluate main `max-w-[1600px]` only if ultrawide full-bleed required (RC-6).

---

*End of audit — no code changes performed.*
