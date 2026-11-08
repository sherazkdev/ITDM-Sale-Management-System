# ITDMS — Final UI/UX & Functional Design Audit

**Project:** IT Department Management System (ITDMS) / ORLEN  
**Workspace:** `D:\ITDM-Sale-Management`  
**Reference (read-only):** `D:\employee-management-system`  
**Audit date:** 2026-11-06  
**Mode:** READ-ONLY — no application, schema, or branding changes were implemented  
**Evidence:** Source inspection + Playwright captures against isolated `itdms_e2e` (API `:3020`, web `:3021`)

---

## 1. Executive summary

ITDMS already has a **credible enterprise shell**: ORLEN-red branding, permission-aware sidebar, consistent list/detail patterns, Wave 2 finance notices, Excel/CSV/PDF operational exports, and solid loading/empty/error scaffolding. Automated UI08 gates previously verified responsive overflow and sample axe serious/critical (with color-contrast excluded).

The product is **not yet a premium analytics / high-efficiency operations console**. The largest gaps are:

1. **Dashboard depth** — ~~shallow KPIs / no drill-down~~ **Phase B closed** (clickable KPIs/charts, non-asset item counts, 60-day expiry watchlist, provisional USD budget strip without treating `remainingUsd` as approved). Remaining: true remaining-budget formula + non-USD strip after backend finance rules land; no fabricated trends.
2. **Table power** — **Phase C complete (scoped)**: sticky headers, column prefs, keyboard rows, server sort + URL state on employees, vendors, POs, invoices, assets, maintenance, licenses; contracts list optional follow-up.
3. **Navigation honesty** — ~~misleading Global Search / dead `⌘K`~~ **Phase A fixed** (PO search labeling + Ctrl/Cmd+K). Remaining: not a free-text multi-entity search.
4. **Workflow friction** — Phase A issuance search + Help **done**. **Phase D complete** on mandatory creates, payment confirm, document upload confirm.
5. **Optional vs required** — CSV/bulk import is **not** a confirmed client requirement; Excel operational export **is** confirmed (D12 partial). Remaining budget formula remains provisional pending Nov 2026 client-rule backend work.

**Overall UI maturity (post–Phase D closure, 2026-11-08):** **A / “Premium dashboard + enterprise tables + consistent operator forms.”**

---

## 2. Overall UI maturity assessment

| Dimension | Score (1–5) | Verdict |
|---|---:|---|
| Visual polish & ORLEN branding | 4 | Red theme + typographic logo fallback; official logo files still optional |
| Information architecture | 4 | Clear nav sections; Departments is field-level, not a module |
| Dashboard analytics | 4 | Phase B: drill-down KPIs/charts, watchlist, provisional budget strip |
| Data tables | 4 | Server sort + URL on core lists; column prefs; contracts/notifications lighter |
| Forms & workflows | 4.5 | Searchable links, unsaved guards, confirm dialogs on payment/upload |
| Import / export | 3.5 | Strong export surface; no approved import product |
| Accessibility | 3 | Axe sample gates pass (contrast excluded); chart a11y incomplete |
| Responsive | 4 | Mobile drawer + hideOnMobile columns; prior overflow gates green |
| Offline / standalone fit | 4 | Self-hosted Inter via `@fontsource`; Recharts bundled; no CDN fonts |
| Client-rule honesty | 5 | Provisional notices preserved; no invented budget formulas |

---

## 3. Evidence basis (observed vs inspected)

### Directly observed (this audit)

- Live stack: Postgres `itdms-postgres` healthy; API verified on `itdms_e2e`; web on `:3021`.
- Screenshots under `docs/release/audit-screenshots/` (desktop 1440 + mobile 390; `*-loaded` variants after network idle).
- First capture pass often hit **skeleton loaders** (performance / wait sensitivity finding). Loaded recapture succeeded for major modules.

### Source-code inspection (this audit)

- Routes under `apps/web/src/app/(app)/**` and `apps/web/src/app/(auth)/login`.
- Shared UI: `components/common/DataTable.tsx`, `ListToolbar.tsx`, `dashboard/*`, `layout/*`.
- APIs: `apps/web/src/lib/api/*`, `apps/api/src/modules/dashboard/dashboard.service.ts`.
- Client decisions: `docs/release/CLIENT_DECISION_REGISTER.md`, Wave 1–3 reports, `budget-ui.ts`, `docs/production/FINANCIAL_RULES_VERIFICATION.md`.

### Prior artifacts (not re-run as gates)

- `docs/frontend/UI08_REMAINING_ISSUES.md`, Wave 4 / ORLEN branding reports, historical PNG sets under `docs/frontend/screenshots/`.

**Disclaimer:** Screenshots prove visual layout and labels; they do **not** alone prove mutation correctness. Functional correctness for finance/stock remains covered by existing API/Playwright suites, not re-executed in full here.

---

## 4. Module-by-module audit

Route map source: `apps/web/src/config/itdms-navigation.ts`.

| Module | Route | Primary files | Visual / UX | Functional notes | Severity highlights |
|---|---|---|---|---|---|
| Login | `/login` | `app/(auth)/login/page.tsx`, `components/auth/AuthShell.tsx` | Split layout, ORLEN-red CTA, password toggle, session messaging | Zod validation; service-unavailable banner | Helpful; showcase is decorative |
| Dashboard / Overview | `/dashboard` | `app/(app)/dashboard/page.tsx`, `DashboardCharts.tsx`, `DashboardHero.tsx`, `dashboard-links.ts` | Phase B analytics console: inventory/people KPI grids, clickable donut/bars, expiry watchlist, activity links, permissioned quick actions, provisional USD budget strip | Extended `GET /dashboard/summary` (`nonAssetStock`, `movements`, `expiryWatchlist`, `budgetOverview`); **no** `remainingUsd` as approved formula | **Closed (Phase B)**; finance formula still provisional |
| Employees | `/employees`, `/new`, `/[id]` | `employees/**` | Premium header, KPI band, search + status filter, sortable columns | Pagination + row click | Strong list pattern |
| Departments | *(no route)* | Employee `department` field | N/A as module | Directory attribute only — not a CRUD module | Gap only if client expects org chart |
| Assets | `/assets`, `/new`, `/[id]` | `assets/**` | Tabs: serialized vs non-asset; filters; status pills | Dual inventory model per D09 partial | Strong; location often empty |
| Non-asset inventory | `/assets?view=non-asset`, `/assets/non-asset/[id]`, new entry toggle | `non-asset-stock` API + assets pages | Shared stock-entry UX | Quantity registration; **no consumption (D09)** | Expected provisional |
| Asset categories | `/asset-categories` | `asset-categories/page.tsx` | Simple CRUD table/forms | Master data | Adequate |
| Asset issuance / returns | `/asset-issuance` | `asset-issuance/page.tsx`, `WorkflowSection` | Step 1–3, Issue/Return tabs | Atomic movements; checkbox list | **P1** list search/scalability |
| Asset history | `/asset-history` | `asset-history/page.tsx` | Search-first empty state | History lives on asset detail | Adequate but indirect |
| Vendors | `/vendors` | `vendors/**` | Standard list + create | Sortable name | Adequate |
| Contracts | `/contracts` | `contracts/**` | List + create/detail | Expiry used by dashboard | Adequate |
| Purchase orders | `/purchase-orders` | `purchase-orders/**` | List search; detail lines; SAP policy notice | Approval blocked (D03) | Correct per client |
| Invoices & payments | `/invoices`, `/[id]` | `invoices/**` | Combined register; payment status pills | Post + payments on detail; **list search + status filter (Phase A)** | Closed list UX gap |
| Payments | *(no separate route)* | Invoice detail payments | Nested workflow | Intentional consolidation | OK if labeled clearly |
| Budgets | `/budgets` | `budgets/page.tsx`, `BudgetProvisionalNotice` | Dense multi-section operator UI; **no charts** | `remainingUsd = allocatedUsd − actualPaidUsd` provisional | **P1** clarity/charts gated |
| Maintenance | `/maintenance` | `maintenance/**` | Standard list/create | Status pipeline on dashboard | Adequate |
| Software licenses | `/software-licenses` | `software-licenses/**` | Standard list | Expiry KPIs on dashboard | Adequate |
| Notifications | `/notifications` | `notifications/page.tsx`, `NotificationBell` | Unread filter, mark read | Lead days = 60 (D14) | Adequate |
| PO search | `/search` | `search/page.tsx`, `Topbar.tsx` | Labeled PO search; Ctrl/Cmd+K | Exact PO hub (honest labeling after Phase A) | Closed naming issue |
| Excel reports | `/reports` | `reports/page.tsx`, `lib/api/reports.ts` | Card grid CSV/PDF/XLSX + JSON preview | D12 disclaimer; FY filter for budget only | Strong export UX |
| Documents | `/documents` | `documents/page.tsx` | Upload + lookup by id | Not a document browser/library | **P2** discoverability |
| Administration | `/admin` | `admin/page.tsx` | User create/edit/roles dialogs | Single-role picker vs multi-role backend note | **P2** |
| User permissions | `/admin` (roles) | same + `lib/permissions.ts` | Role assignment UI | Final RBAC matrix D01 open | Client-blocked |
| Audit logs | `/admin/audit` | `admin/audit/page.tsx` | Paginated audit table | Feeds dashboard recent activity | Adequate |

### Cross-cutting shell

| Element | File | Finding |
|---|---|---|
| Sidebar | `components/layout/Sidebar.tsx` | Sticky, collapsible, permission-filtered |
| Mobile nav | `MobileSidebar.tsx` | Present; focus-order not fully audited |
| Topbar | `Topbar.tsx` | Misleading PO placeholder; Help button has **no handler**; `⌘K` visual only |
| Theme | `globals.css`, `ThemeProvider` | ORLEN red tokens; dark mode supported |
| Access | `RouteAccessGuard`, `AccessDeniedView` | Permission gating |

---

## 5. Dashboard visualization audit

### Phase B (2026-11-06) — implemented & verified

Source: `apps/api/src/modules/dashboard/dashboard.service.ts` → `GET /dashboard/summary`.

| Widget | Data | Interactive? |
|---|---|---|
| Asset KPIs (registered / in stock / issued / maintenance) | Asset status groupBy | KPI → `/assets?status=` |
| Non-asset stock items | `nonAssetStockItem.count` only | KPI → `/assets?view=non-asset`; **no cross-UOM qty sum** |
| Active employees | Employee counts | → `/employees` |
| Open maintenance / unread notifications | Counts | Module links |
| Contracts / licenses expiring (60d window) | Date window counts | → list `?expiringWithin=` |
| Asset distribution donut | Status slices | Click slice → filtered assets |
| PO / maintenance / issuance-return bars | groupBy counts | Click → module lists |
| Inventory & expiry summary | Section aggregates | Read-only panel |
| Expiry watchlist (60d) | Top contracts + licenses with days remaining | Row → record detail |
| Recent activity | Last audit rows | Safe target deep links via `dashboard-links.ts` |
| Budget overview (provisional) | USD allocation count/total + committed/payment **line counts** | Provisional notice; **does not expose `remainingUsd` as approved** |
| Quick actions | Permission-gated | Register asset / non-asset, issue, invoice, reports |

### Remaining (explicitly out of Phase B)

| Visualization | Status |
|---|---|
| Approved remaining-budget / utilization formula (Nov 2026 client rules) | Backend not fully implemented — keep provisional |
| Non-USD allocation rollups | Not shown as approved totals |
| Monthly expenditure trend | Deferred (definition + API) |
| Non-asset consumption movements | D09 not implemented — do not fake |
| Date / category dashboard filters | Deferred |

**Do not invent:** remaining-budget formulas; automatic FX; consumption stock math; official D12 templates; fake trends.

---

## 6. Tables and interactions audit

Shared component: `apps/web/src/components/common/DataTable.tsx` + `ListToolbar.tsx` + `Pagination.tsx`.

| Capability | Status | Notes |
|---|---|---|
| Column sorting | **Partial** | Client-side only on current page; opt-in per column |
| Search | **Partial** | Present on many lists; **missing on invoices list** |
| Multi-column filtering | **Partial** | Status/category on assets/employees; weak elsewhere |
| Pagination | **Yes** | Server meta + page size |
| Column visibility | **No** | — |
| Adjustable column widths | **No** | — |
| Row selection / bulk ops | **No** | Issuance uses custom checkboxes (good for that workflow) |
| Sticky headers | **No** | Header in scroll container only |
| Expandable rows | **No** | Detail pages instead |
| Status indicators | **Yes** | `StatusPill` |
| Row detail preview | **Partial** | Row click → detail (no drawer preview) |
| Contextual action menus | **Rare** | `rowActions` supported but seldom used |
| Keyboard a11y | **Partial** | Sort buttons labeled; row click not keyboard-equivalent |
| Export from table | **No** | Centralized `/reports` instead |
| Empty / loading | **Yes** | Skeleton + EmptyState |
| Responsive overflow | **Yes** | `overflow-x-auto` + `hideOnMobile` |

**Drag-and-drop / column reorder:** **Not recommended** for finance, stock balances, approvals, or issuance quantities. Optional **P3** only for personal column order persisted in local preferences (never mutating records). EMS Deal Kanban DnD is CRM-specific and should **not** be copied onto ITDMS financial entities.

### Existing vs missing (summary)

- **Existing:** search+filter on core directories, pagination, status pills, row navigation, skeletons.
- **Ported but unused:** `DataTableToolbar` (list meta + optional list/grid toggle) — present in repo, **not imported by any page** ([ITDMS frontend audit](b58e639a-790a-40b9-a980-fa6b996cfc91) + code grep).
- **Missing for premium ops:** invoice filters, server-side sort, sticky header, column picker, bulk mark-read (notifications), table-local export with current filters.

---

## 7. Import / export audit

### Exports (client-confirmed direction: Excel operational)

| Aspect | Assessment |
|---|---|
| Discoverability | Good via `/reports` + sidebar |
| Formats | JSON preview, CSV, PDF, XLSX (`lib/api/reports.ts`) |
| Filter before export | Financial year for budget utilization only |
| Column clarity | Descriptions on cards; PO lines explicitly out of scope pending client |
| Download UX | Toasts; `X-ITDMS-Export-Disclaimer` for provisional |
| Row limits | Not surfaced in UI — **gap** |
| Official templates (D12) | Still blocked; disclaimer correct |

### Imports (optional proposals — **require client approval**)

**Not implemented. Not assumed required.**

If later approved for master data (employees, inventory registration, vendors):

1. Permission-gated upload  
2. Schema validation + decimal quantity rules  
3. Duplicate detection (codes / employee numbers)  
4. Preview grid with error rows  
5. Explicit commit  
6. Audit log of import batch  
7. Rollback strategy (batch id / compensating reverse)  
8. No silent overwrite of financial ledgers  

Classify as **P3 / optional**.

---

## 8. Forms and workflows audit

| Pattern | Status | Evidence |
|---|---|---|
| RHF + Zod | Strong | create pages, admin, budgets |
| Required indicators | Partial | Labels inconsistently mark required |
| Inline validation | Good | Field errors on many creates |
| Confirm dialogs | Partial | Used on some destructive/state actions (`ConfirmDialog`) |
| Duplicate prevention | Backend-dependent | UI does not always pre-check codes |
| Multi-step | Good on issuance; FormStepper available | `FormStepper.tsx` underused on long creates |
| Searchable dropdowns | Weak | Mostly `FilterSelect` / native select — poor at scale |
| Success toasts | Good | Sonner |
| Unsaved-change warnings | **Missing** | No `beforeunload` / dirty guard |
| Date / currency | Adequate | ISO dates; `formatCurrency` |
| Decimal quantities | Supported via coerce number | Non-asset registration |

### Workflow friction hotspots

1. **Issuance** — eligible assets as long checkbox list; needs search/filter inside Step 2.  
2. **Invoices list → payment** — must open detail; list cannot filter Unpaid/Partial.  
3. **Budgets** — year/allocation/ledger/lookups on one scrolling page; IDs used for PO/vendor lookup (not searchable pickers).  
4. **Documents** — upload/lookup by id; not browsable library.  
5. **PO approval** — correctly blocked with SAP messaging (D03); do not “simplify” into fake approvals.

---

## 9. Design system & branding

| Topic | Assessment |
|---|---|
| ORLEN red | Implemented (`globals.css` primary ≈ `#E30613`) |
| Official logo files | Slot exists; typographic fallback when assets absent — **do not invent artwork** |
| Consistency | High across shell after Wave 4 / ORLEN pass |
| Typography | Inter via `@fontsource` (offline-safe); **not** a distinctive brand type — acceptable enterprise |
| Icons | Lucide consistent |
| Cards / tables / buttons | Shared shadcn-style primitives |
| Charts | Recharts donut + custom horizontal bars |
| Dark mode | Supported; historical captures exist |

**Recommendation:** Keep approved shell; refine density and interaction, not a rebrand. Client logo drop-in remains the only branding blocker.

---

## 10. Responsive & accessibility findings

| ID | Finding | Severity | Evidence |
|---|---|---|---|
| A11Y-01 | Color-contrast rule disabled in axe gates | P2 | `e2e/a11y.spec.ts` |
| A11Y-02 | `⌘K` advertised but not bound | P1 | `Topbar.tsx`; `uiStore.commandPaletteOpen` unused |
| A11Y-03 | Help icon button non-functional | P2 | `Topbar.tsx` |
| A11Y-04 | Chart/KPI text alternatives incomplete | P2 | Recharts + KPI cards |
| A11Y-05 | Row-click tables lack keyboard activation | P2 | `DataTable` |
| RWD-01 | Prior UI08 responsive overflow gates passed | Info | `UI08_REMAINING_ISSUES.md` |
| RWD-02 | Mobile 390 captures usable; density still desktop-first | P2 | `audit-screenshots/*-390-loaded.png` |
| PERF-01 | Slow first paint / skeletons common without long waits | P2 | First vs loaded screenshot passes |

---

## 11. Reference project comparison (`employee-management-system`)

Treated **read-only**. ITDMS was explicitly ported from this CRM shell (`navigation.ts` comment, shared `DataTable` shape).

| Area | EMS | ITDMS | Better for ITDMS? |
|---|---|---|---|
| Dashboard charts | Richer: sales overview, funnel, sources, period labels | Ops KPIs + simple bars; honest provisional finance | Adopt **layout richness**, not CRM metrics |
| KPI deltas (“vs last week”) | Present | Absent | Optional if API can support real deltas |
| Tables | `DataTable` + `DataTableToolbar` + `ViewToggle` on lists; leads also have bulk select + `ExportMenu` | Same `DataTable`; pages use `ListToolbar`. **`DataTableToolbar` exists at `components/common/DataTableToolbar.tsx` but is unused** (still carries CRM defaults like “score” sort) | Wire or delete dead toolbar; borrow EMS list/grid + export-selection only where safe |
| DnD | Deal Kanban stage moves | None | **Do not** copy onto finance/stock |
| Import | CRM `ImportModal` (drag file) | None | Optional proposal only |
| Navigation / shell | Very similar | Permission-aware ITDMS IA + ORLEN | ITDMS better domain fit |
| Offline fonts | Comparable patterns | `@fontsource/inter` explicit | ITDMS aligned to standalone |
| Domain honesty | Marketing CRM tone | Strong provisional/policy notices | **ITDMS better** |

**Adapt:** denser dashboard composition, list toolbars, optional list/grid where it helps directories.  
**Do not copy:** email bulk, deal pipeline DnD, lead scoring, CRM import semantics.

---

## 12. Performance & offline compatibility

| Topic | Finding |
|---|---|
| Dashboard load | Multiple parallel counts — acceptable; UI feels slow if network idle delayed |
| Bundle | Next 15 + Recharts + Framer Motion — suitable if kept lean; avoid heavy BI suites |
| Tables | Client sort on page only — fine at pageSize 20; dangerous if pageSize raised without server sort |
| Fonts/icons | Local Inter + Lucide — **good for offline Windows** |
| CDN | No Google Fonts CDN dependency observed |
| Target hardware | Prefer virtualized lists only if issuance/asset lists grow large |

---

## 13. Screenshot evidence locations

### This audit (primary)

`docs/release/audit-screenshots/`

Notable files:

- `login-1440.png`
- `dashboard-1440-loaded.png`, `dashboard-390-loaded.png` (pre–Phase B baseline)
- `dashboard-phase-b-1440-loaded.png`, `dashboard-phase-b-390-loaded.png` (Phase B loaded console)
- `employees-1440-loaded.png`, `assets-1440-loaded.png`
- `asset-issuance-1440-loaded.png`
- `invoices-1440-loaded.png`, `budgets-1440-loaded.png`
- `reports-1440.png`, `reports-390-loaded.png`
- `search-1440-loaded.png`
- Plus vendors, contracts, POs, maintenance, licenses, notifications, documents, admin, audit, categories, history (`*-1440-loaded.png`)

Environment: **`itdms_e2e` only** (not `itdms_dev` / staging writes).

### Historical (secondary)

`docs/frontend/screenshots/ui08/`, `wave4b-premium-ui/`, `orlen-branding/` — useful for branding evolution; some predate latest copy.

---

## 14. Prioritized findings register (summary)

Full solution cards live in `PREMIUM_UI_IMPROVEMENT_ROADMAP.md`. Top confirmed issues:

| ID | Severity | Module | Finding |
|---|---|---|---|
| UX-001 | P1 → **Closed (Phase A)** | Topbar / Search | Relabeled PO search; Ctrl/Cmd+K wired (skips form fields) |
| UX-002 | P1 → **Closed (Phase B)** | Dashboard | Premium analytics console; provisional budget strip only |
| UX-003 | P1 → **Closed (Phase A)** | Invoices | Search + Unpaid/Partial/Paid filters (API-backed) |
| UX-004 | P1 | DataTable | Missing sticky header, column visibility, server sort |
| UX-005 | P1 → **Closed (Phase A)** | Issuance | Asset search/filter on issue & return |
| UX-006 | P1 | Budgets | Dense forms; no utilization visualization (keep provisional rules) |
| UX-007 | P2 → **Closed (Phase A)** | Topbar | Help → `/help` |
| UX-008 | P2 | Forms | No unsaved-change protection |
| UX-009 | P2 | Reports | Export row limits / column glossary not user-visible |
| UX-010 | P2 | Documents | ID-centric UX, not browsable |
| UX-011 | P0* | Branding/RBAC | *Client blockers (official logo, D01 matrix) — not code defects |
| UX-012 | P3 | Import | Bulk CSV import optional, approval required |

\*P0 in release sense if client mandates logo/RBAC before go-live; not a runtime UI crash.

---

## 15. Missing functionality vs optional enhancements

### Missing / weak relative to a premium ops console (recommended)

- Table sticky headers / column visibility / filter persistence (Phase C)  
- Unsaved form guards (Phase D)  
- Export limit messaging  
- Approved remaining-budget formula UI once backend lands  

### Closed in Premium UI Phase A (2026-11-06)

- PO search labeling + Ctrl/Cmd+K  
- Invoice list search / payment-status filters  
- Issuance asset search/filter  
- Help control → `/help`  

### Closed in Premium UI Phase B (2026-11-06)

- Interactive KPI cards + chart drill-downs (real API data only)  
- Non-asset **item count** KPI (no cross-UOM quantity totals)  
- Issuance/return document counts  
- 60-day expiry watchlist with record links  
- Provisional USD budget overview (**no** approved `remainingUsd` reuse)  
- Recent activity deep links + permission-aware quick actions  
- Evidence: `docs/release/audit-screenshots/dashboard-phase-b-1440-loaded.png`, `dashboard-phase-b-390-loaded.png`  

### Optional (needs approval)

- CSV/Excel **import**  
- Column drag-reorder preferences  
- Advanced animations  
- True free-text global search across all entities  
- Official D12 templates  
- Changing remaining-budget formula  

### Correctly absent / blocked (do not implement as “UI polish”)

- In-app PO approval engine (D03)  
- Non-asset consumption (D09 open)  
- Invented FX / remaining budget rules  
- Unofficial ORLEN logo artwork  

---

## 16. Conclusion

ITDMS UI is **production-credible for structured CRUD and compliant messaging**, with a professional ORLEN-red shell. **Phase A + Phase B** deliver search honesty and a premium IT operations analytics dashboard without changing finance/stock business rules.

**Premium UI path (engineering):** Phases A–D **complete** on 2026-11-08; Phase E remains approval-gated.

### Accessibility — color contrast exception

- **Component:** Global secondary text (`--muted-foreground` on `QuickTip`, form hints, table metadata).
- **Mitigation (2026-11-08):** Light theme muted foreground darkened slightly in `globals.css`.
- **Remaining:** Playwright axe still disables `color-contrast` (`a11y.spec.ts`) because ORLEN primary-on-soft backgrounds are not fully signed off for WCAG AA. **Full contrast compliance is not claimed.**

**Production UI sign-off** still requires staging UAT; no production deploy from UI closure work.
