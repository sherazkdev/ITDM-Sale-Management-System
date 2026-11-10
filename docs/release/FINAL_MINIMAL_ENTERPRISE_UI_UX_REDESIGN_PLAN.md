# ITDMS — Final minimal enterprise UI/UX redesign plan

**Status:** Planning only. No application source was changed.  
**Date:** 2026-11-10  
**Stack inspected:** `@itdms/web` Tailwind **3.4.17** (`apps/web/package.json`), Lucide icons, existing shadcn-style primitives (`components/ui/*`). No new UI library is recommended.  
**Git reviewed:** branch `main`, commit `b86ed97` (`feat(web): finalize premium detail flows and enterprise UX verification`). Local `main` is ahead of `origin/main` by 7 commits. Screenshot binaries under `docs/frontend/screenshots/` are dirty in the working tree; they were not treated as the current live UI.

## Evidence rules used

| Class | Meaning |
| --- | --- |
| CONFIRMED-SOURCE | Read in current `apps/web` source at `b86ed97`. |
| CONFIRMED-SCREENSHOT | `C:\Users\shera\OneDrive\Desktop\ITDMS_UI_AUDIT` (Prompt #18, 2026-11-09). Employees list is a real table, not a crash. |
| INVALID-SCREENSHOT | `C:\Users\shera\OneDrive\Desktop\ITDMS_UI_AUDIT_AFTER_PROMPT20\employees-1440.png` renders a client-side exception. Not used as current design evidence. |
| LIVE | Not captured. `http://127.0.0.1:3021` was down during this audit. Default web port in `package.json` is **3011**. Live browser coverage is **incomplete**. |
| HYPOTHESIS | Inferred from component reuse, not a fresh render. |

---

## A. Executive design direction

ITDMS should look like a daily operations console: Inter (already loaded), neutral surfaces, one brand accent for primary actions and the active nav item, and almost no decoration on repeating rows.

| Topic | Direction |
| --- | --- |
| Typography | Page title `text-xl font-semibold`. Description `text-sm text-muted-foreground`. Table body `text-sm`. Meta `text-xs text-muted-foreground`. Numbers `tabular-nums`. |
| Color | Keep existing CSS variables in `globals.css` (background, border, primary, success/warning/destructive). Color is for status, destructive actions, and the current nav item. Not for ordinary icons. |
| Icons | Lucide outline, `h-4 w-4`, `strokeWidth={1.75}`, `text-muted-foreground`. No tile, ring, or tint behind list icons. |
| Tables | Semantic `<table>`, header `text-xs uppercase tracking-wide text-muted-foreground`, row divider `border-b`, hover `bg-muted/40`. Outer `border` + `rounded-lg` once. No per-row cards. |
| Forms | One column on mobile, two columns from `md` when fields are short. Label + required star + one hint line + error under the field. |
| Filters | One toolbar row: search, 2–3 selects, More filters, Reset. Drop the full-width bordered panel (`list-toolbar-panel` shadow card) unless the page has no table. |
| Cards | Dashboard KPIs only, and only metrics the API already returns. Icon optional, plain, no tinted disc. No sparklines unless data exists. |
| Spacing | Page stack `gap-5`. Toolbar to table `gap-3`. Cell padding `px-3 py-2.5`. |
| Responsive | 390: stack filters, horizontal table scroll. 768: two-column forms. 1024+: sidebar + table. 1440/1920: same layout, max content width so tables do not stretch into unreadably wide columns. |
| Themes | Light and dark stay on existing tokens. Do not add gradients (`bg-brand-gradient` on the active page number is the main exception to remove). |

---

## B. Current UI problems

### 1. Decorative icon tiles on every identity cell — P0

- **Route:** Every list that uses `employeeListCell`, `vendorListCell`, `assetListCell`, and the rest of `apps/web/src/lib/list-entity-cells.tsx`.
- **Component:** `apps/web/src/components/common/EntityIdentityCell.tsx`.
- **Observed:** CONFIRMED-SOURCE. Default `tone="brand"` wraps the icon in `h-9 w-9 rounded-lg ring-1` plus tinted `bg-*/10`. Tones: brand, blue, green, amber, violet, neutral.
- **Harm:** Every row looks like a mini card. Color does not mean status; status already has `StatusPill`.
- **Redesign:** Plain icon + title + optional subtitle. Remove `TONE_STYLES` from the default path. Keep `tone` unused or delete it after callers stop passing it.

### 2. Identity cells also embed extra chips — P0

- **Component:** `list-entity-cells.tsx` + `.entity-chip` in `globals.css` (bordered muted pill).
- **Observed:** CONFIRMED-SOURCE. Employee department and designation, vendor email, asset location, and assignee render as chips inside the name cell.
- **Harm:** Duplicates columns that already exist (department, designation) and makes the first column tall and noisy.
- **Redesign:** Name + identifier only. Department, designation, location stay in their own columns as plain text.

### 3. Filter toolbars are boxed cards — P1

- **Component:** `ListToolbar` uses `list-toolbar-panel` → `rounded-xl border bg-card p-4 shadow-card`.
- **Observed:** CONFIRMED-SOURCE. CONFIRMED-SCREENSHOT on employees shows a cleaner single-line filter; current source is heavier than that screenshot.
- **Harm:** A second card between the page header and the table. Filters feel like a widget, not a toolbar.
- **Redesign:** Transparent row, `gap-2`, inputs `h-9`, no shadow. Chips only when a filter is active (`ActiveFilterChips` already exists).

### 4. KPI icon discs and optional fake trend chrome — P1

- **Component:** `apps/web/src/components/common/KpiCard.tsx`. Comment still says “BizCRM tinted-disc”. Tones map to colored backgrounds. Optional `change` and `sparkline`.
- **Observed:** CONFIRMED-SOURCE. CONFIRMED-SCREENSHOT employees page shows three KPI cards with tinted icon circles (Total / Active / Inactive).
- **Harm:** List pages do not need three summary cards that repeat the table. Colored discs add decoration without a decision.
- **Redesign:** Remove list-page KPI strips unless a module owner confirms the number changes a decision. On the dashboard, keep real API metrics, drop tinted discs and any change arrow that is not backed by a real period comparison.

### 5. Gradient pagination — P2

- **Component:** `apps/web/src/components/common/Pagination.tsx` active page uses `bg-brand-gradient shadow-pop`.
- **Observed:** CONFIRMED-SOURCE. CONFIRMED-SCREENSHOT shows a solid red active page, which is acceptable if it matches the brand button, but the gradient + shadow is heavier than the rest of a data table.
- **Redesign:** Active page = `bg-primary text-primary-foreground`, no shadow.

### 6. Header icon tiles on dashboard and notifications — P2

- **Files:** `DashboardFilterBar.tsx`, `NotificationFilterBar.tsx` (`h-9 w-9 rounded-lg bg-primary/10`).
- **Observed:** CONFIRMED-SOURCE.
- **Redesign:** Plain `Filter` / `Bell` icon, `text-muted-foreground`.

### 7. Notification rows use colored circles — P2

- **File:** `NotificationBell.tsx` maps entity types to `bg-primary/10` and `rounded-full` avatars.
- **Observed:** CONFIRMED-SOURCE.
- **Redesign:** Plain type icon. Unread state = font weight or a 6px dot, not a filled circle behind the icon.

### 8. Empty states and tips use large discs — P3

- **Files:** `EmptyState.tsx` (`h-14 w-14 rounded-full bg-primary/10`), `QuickTip.tsx`.
- **Redesign:** Smaller plain icon. Keep the message.

### 9. Prompt #20 screenshot pack is not evidence — note

- **File:** `ITDMS_UI_AUDIT_AFTER_PROMPT20\employees-1440.png`.
- **Observed:** INVALID-SCREENSHOT. Full-page “Application error: a client-side exception has occurred.”
- **Action:** Do not redesign from that pack. Recapture after implementation from a healthy build.

### 10. Live visual QA was not possible in this pass — coverage gap

- Web was not listening on `127.0.0.1:3021`.
- HYPOTHESIS: sidebar active state, topbar density, and form dialogs still match Prompt #18 captures plus later source. Confirm on a running build before implementation sign-off.

---

## C. Shared component redesign plan

Do these first. They cover most routes.

| File | Planned change | Keep |
| --- | --- | --- |
| `apps/web/src/components/common/EntityIdentityCell.tsx` | Remove ring, rounded tile, and tint map. Icon `h-4 w-4 text-muted-foreground`. Title truncates. Subtitle optional. | Accessible text, truncation |
| `apps/web/src/lib/list-entity-cells.tsx` | Stop passing `tone`. Stop rendering `entity-chip` meta that duplicates columns. Map icons: Users, Laptop, Package, Building2, FolderTree, FileText, Receipt, Handshake, Wrench, KeyRound, Bell. | Links and labels |
| `apps/web/src/app/globals.css` | `.list-toolbar-panel` loses border, shadow, and card fill. `.entity-chip` removed from tables (class can stay unused). | Tokens, `.enterprise-table` hover |
| `apps/web/src/components/crud/ListToolbar.tsx` | Single compact row. Search max width ~320px. Filters inline. “More filters” slot stays `filters` children; pages decide what is primary. | Search callback, chips, reset |
| `apps/web/src/components/common/FilterSelect.tsx` | Height `h-9`, no extra color. | Options and query wiring |
| `apps/web/src/components/common/DataTable.tsx` | Confirm header/row classes stay table-like (`enterprise-table`). Right-align via existing `align`. Row actions stay in the last column, icon size `h-8 w-8` hit area with a plain icon. | Sorting, column menu, skeleton, `onRowClick` |
| `apps/web/src/components/common/KpiCard.tsx` | Remove tinted disc. No `change` UI unless the prop is fed by a real API field. No sparkline slot on list pages. | `href`, value formatting |
| `apps/web/src/components/common/Pagination.tsx` | Solid primary active state. | Page size and range text |
| `apps/web/src/components/common/StatusPill.tsx` | Keep semantic badge. Prefer `dot` for compact rows. Do not enlarge. | Status map |
| `apps/web/src/components/forms/FormField.tsx` | No visual rebuild. Use it consistently: label, `*`, hint, error. | Validation display |
| `apps/web/src/components/crud/DetailRecordLayout.tsx` | Flatten nested cards. One header, then sections with `border-b`, not stacked shadowed cards. | Data sections |
| `apps/web/src/components/dashboard/DashboardFilterBar.tsx` | Drop header icon tile. Collapse rare filters behind More. | Existing query params |
| `apps/web/src/components/notifications/NotificationFilterBar.tsx` | Same as dashboard filter. | Filter semantics |
| `apps/web/src/components/common/EmptyState.tsx` | Plain icon. | Copy |
| `apps/web/src/components/layout/NotificationBell.tsx` | Plain icons in the menu. | Unread count badge (functional) |

**Do not change:** API clients, Zod schemas, RBAC checks, table sort query keys, pagination query keys.

---

## D. Page-by-page matrix

Priority: P0 shared visual debt, P1 daily-use density, P2 polish. Complexity: S/M/L. Risk is regression of filters, sort, or money fields — not of layout alone.

| Route | Current UX | Problem | Proposed improvement | Priority | Complexity | Risk |
| --- | --- | --- | --- | --- | --- | --- |
| `/login` | Auth shell | Marketing-style panels are acceptable once. | Leave structure. Do not add more illustration. | Preserve | S | Low |
| `/` | Redirect | — | Preserve | Preserve | S | Low |
| `/dashboard` | KPI groups + charts + filters | Tinted KPI icons; filter bar icon tile; many sections. | Keep only API-backed KPIs. Plain icons. Compact filter. Charts unchanged if they plot real series. | P1 | M | Medium (filter query) |
| `/employees` | Table + toolbar + KPIs (screenshot) | Identity tiles + chips in source; KPI row repeats Active/Inactive. | Drop list KPIs. Plain user icon + name + number. Dept/designation as columns. | P0 | M | Medium |
| `/employees/new` | Form | Length, not decoration. | Group identity / org / contact. Hints on employee number. | P1 | S | Low |
| `/employees/[id]` | Detail | Nested record cards likely. | `DetailRecordLayout` flatten. | P1 | M | Low |
| `/departments` | List + dialog | Identity tile. | Plain building icon. Dialog labels stay. | P0 | S | Low |
| `/asset-categories` | List | Amber tile. | Plain folder icon. | P0 | S | Low |
| `/assets` | Serialized / non-asset | Laptop/package tiles + location chips. | Plain icon. Location column text. | P0 | M | Medium |
| `/assets/new` | Long create | Easy to overwhelm. | Sections: identity, classification, custody. No extra wizard. | P1 | M | Medium |
| `/assets/[id]` | Detail + history | Card nesting. | Section headers, table for history. | P1 | M | Medium |
| `/assets/non-asset/[id]` | Stock detail | Same. | Same as asset detail. | P1 | M | Medium |
| `/asset-history` | Movement list | Toolbar card. | Compact toolbar. | P1 | S | Low |
| `/asset-issuance` | Issue / return workflow | Custom filters, not only `ListToolbar`. | Align control height. Do not restyle the workflow steps into cards. | P1 | M | High (issue/return) |
| `/vendors` | List | Blue tile + email chip. | Plain building icon. Email column. | P0 | S | Low |
| `/vendors/new` | Form | — | Short helper on tax/contact fields already present; don’t add sections that aren’t in the API. | P2 | S | Low |
| `/vendors/[id]` | Detail | Cards. | Flatten. | P2 | S | Low |
| `/purchase-orders` | List | File icon tile. | Plain icon. Amounts right-aligned. | P0 | M | Medium (money) |
| `/purchase-orders/new` | Form | Line items. | Keep line-item table; don’t card each line. | P1 | M | High |
| `/purchase-orders/[id]` | Detail | — | Flatten header. Lines stay a table. | P1 | M | Medium |
| `/contracts` | List | Handshake tile. | Plain icon. | P0 | S | Low |
| `/contracts/new` | Form | Dates. | Label start/end in local date format already used. | P2 | S | Low |
| `/contracts/[id]` | Detail | — | Flatten. | P2 | S | Low |
| `/invoices` | List | Receipt tile. | Plain icon. Currency right-aligned. | P0 | M | High (money) |
| `/invoices/new` | Form | — | Totals read-only and right-aligned. | P1 | M | High |
| `/invoices/[id]` | Detail + payments | Payments are not a separate route. | Keep payment panel. Don’t add a fake payments KPI. | P1 | M | High |
| `/budgets` | FY + allocations | Dense filters. | Primary: year + department. Rest behind More. Numbers right-aligned. | P1 | M | High |
| `/maintenance` | List | Wrench tile. | Plain icon. Status pill stays. | P0 | S | Low |
| `/maintenance/new` | Form | — | Asset picker stays searchable. | P2 | S | Medium |
| `/software-licenses` | List | Key tile. | Plain icon. | P0 | S | Low |
| `/software-licenses/new` | Form | — | Seat count helper one line. | P2 | S | Low |
| `/software-licenses/[id]` | Detail | — | Flatten. | P2 | S | Low |
| `/documents` | List | Own filters. | Match compact toolbar. | P2 | S | Low |
| `/reports` | Exports | Don’t turn into a dashboard. | List of reports, one primary export. | P2 | S | Low |
| `/notifications` | List + filter tile | Colored header icon. | Plain bell. Rows: title, time, small status. | P1 | S | Low |
| `/search` | PO search | — | Preserve. Compact. | Preserve | S | Low |
| `/admin` | Users | Filter selects. | Plain table. Role as text + status pill. | P1 | S | Medium (RBAC) |
| `/admin/audit` | Log | — | Monospace optional for ids only. No cards. | P2 | S | Low |
| `/settings` | Redirect to profile | — | Preserve | Preserve | S | Low |
| `/settings/profile` | Form | — | Preserve structure. | Preserve | S | Low |
| `/settings/security` | Form | — | Preserve. | Preserve | S | Low |
| `/settings/theme` | Theme | — | Preserve token switch. | Preserve | S | Low |
| `/settings/preferences` | Form | — | Preserve. | Preserve | S | Low |
| `/settings/roles` | Matrix | Dense but functional. | Don’t card each permission. Keep search. | P2 | M | High (RBAC) |
| `/help` | Static | — | Preserve. | Preserve | S | Low |
| `/maintenance/[id]` | Detail | — | Flatten. | P2 | S | Low |

**Routes reviewed:** 46 `page.tsx` files under `apps/web/src/app`.

---

## E. Icon and table specification (proposed classes only)

List identity (proposed, not applied):

```tsx
<span className="flex min-w-0 items-center gap-2">
  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden />
  <span className="min-w-0">
    <span className="block truncate text-sm font-medium text-foreground">{title}</span>
    {subtitle ? <span className="block truncate text-xs text-muted-foreground">{subtitle}</span> : null}
  </span>
</span>
```

Table shell (proposed):

```tsx
<div className="overflow-x-auto rounded-lg border border-border bg-background">
  <table className="w-full text-sm">
    <thead className="border-b bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
    <tbody className="divide-y divide-border">
    <tr className="hover:bg-muted/40">
```

Money cells: `text-right tabular-nums`. Status: existing `StatusPill` with `dot`. Row action: `Button variant="ghost" size="icon" className="h-8 w-8"` plus `aria-label`.

**Preserve backgrounds for:** active nav item, primary button, destructive confirm, unread count badge, focus ring, semantic status badge.

---

## F. Forms usability

`FormField` already supports label, required, hint, error, and counter. The work is copy and grouping, not a new control library.

| Form | Guidance |
| --- | --- |
| Employee create/edit | Order: name, number, department, designation, status, contact. Hint: “Employee number is the ID printed on records.” |
| Asset create | Tabs for serialized vs non-asset stay. Required serial only when serialized. Category before location. |
| Issuance | Employee and asset must stay searchable. Show current custodian as read-only text, not a chip cloud. |
| Vendor | Contact name, email, phone in one group. |
| Purchase order | Header fields, then a real line table. Totals right-aligned, computed, not retyped. |
| Invoice | Same as PO. Payment status is a pill, not a colored icon. |
| Contract | Start, end, vendor, value. Date labels say the calendar meaning (“End date”). |
| Maintenance | Asset, type, scheduled date, status. |
| License | Product, seats, expiry. Hint seats: “How many people may use this license.” |
| Budget | Fiscal year first. Allocation lines as a table. |
| Roles | Permission search stays. Don’t wrap each checkbox in a card. |
| Settings profile/security | Leave field behavior. No extra marketing copy. |

Validation stays server-driven. Show the API message under the field. Do not add wizards.

---

## G. Responsive specification

| Width | Layout |
| --- | --- |
| 390 | Sidebar becomes the existing drawer. Page title + one primary button stack. Search full width. Extra filters behind More. Table `overflow-x-auto`; first column sticky only if it does not cover actions. |
| 768 | Filters can sit on two rows. Forms two columns for short fields. |
| 1024 | Persistent sidebar. Toolbar one row when ≤3 filters. |
| 1440 | Same as 1024. Cap page content so the table is the focus. |
| 1920 | Do not add a third decorative column. Optional max width `max-w-screen-2xl` centered. |

---

## H. Implementation sequence

1. **Tokens and icons** — `EntityIdentityCell`, `list-entity-cells`, `globals.css` chips and toolbar panel, `KpiCard` disc, `Pagination` gradient.
2. **DataTable** — padding, alignment, hover, action column. No behavior change.
3. **Toolbars** — `ListToolbar`, `FilterSelect`, dashboard and notification bars. Primary vs More is a per-page choice using the existing `filters` slot.
4. **Page headers** — remove list-page KPI rows that only repeat status counts.
5. **Forms** — helper text and section order only.
6. **Page pass** — employees, assets, POs, invoices, budgets first (daily use + money).
7. **Details** — `DetailRecordLayout` and `[id]` pages.
8. **QA** — light/dark, 390–1920, sort, filter, pagination, issuance, RBAC.

**Dependencies:** Step 1 must land before page passes, or every page will be edited twice.  
**Regression risk:** issuance, invoice totals, budget allocations, role matrix, server sort keys.

---

## I. Visual acceptance criteria

- Ordinary row icons have no background, ring, or shadow.
- Tables use one header and horizontal dividers, not row cards.
- List pages do not show KPI cards that only restate the table.
- Search and current filters still hit the same API parameters.
- Forms show label, required marker, and error text.
- Dialogs and selects are not clipped at 390px.
- Topbar controls do not overlap.
- Light and dark text contrast stays readable.
- No API, schema, or permission behavior changes.

---

## J. Test matrix (after approval, not now)

| Check | Why |
| --- | --- |
| `apps/web` `npm test` | Component regressions |
| `npm run typecheck` | Prop removal (`tone`, chips) |
| Playwright list sort/filter/pagination | Query strings |
| Asset issue and return | High-risk workflow |
| Invoice and budget amounts | Right-align must not change values |
| Roles: user without permission | RBAC unchanged |
| 390 and 1440 screenshots | Layout only |

---

## K. Decisions that need approval

1. **Remove list-page KPI strips** (employees total/active/inactive and similar) vs keep one plain text line (“61 employees”). Recommendation: remove the cards.
2. **Drop colored identity tones entirely** vs keep a single neutral icon color. Recommendation: neutral only.
3. **Active pagination** solid brand vs quiet outline. Recommendation: solid `bg-primary`, no gradient.
4. **Dashboard chart count** — keep current charts that plot API series; do not add new ones. Confirm none should be removed.
5. **Recapture** — Prompt #20 PNGs are invalid. After implementation, capture from the running app on port 3011 (or the port you actually use).

---

## Appendix — Tailwind references (not dependencies)

Patterns aligned with Tailwind application UI tables (header, divide-y, right-aligned numbers), shadcn data table (toolbar + table + pagination), and Carbon content-first density. Installed Tailwind is v3 utility classes already in the repo. Do not add Tailwind Plus, shadcn CLI, or Carbon packages.
