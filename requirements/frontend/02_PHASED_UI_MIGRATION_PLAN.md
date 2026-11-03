# ITDMS frontend visual reuse — phased implementation plan

## Key principles
- Source CRM is a **read-only visual reference**; ITDMS repo is the only application to modify.
- **Copy actual reusable source**, not imitate screenshots or regenerate a new style from scratch.
- Keep original visual tokens, spacing, font, radius, controls, mobile drawer, hover/active/focus states, skeleton/empty/error states.
- Do not copy old CRM backend, MongoDB/Mongoose, auth, business records or `.env`/secrets.
- Keep existing ITDMS Express API, DB, migrations, permissions, sessions and backend untouched unless a confirmed compatibility defect is approved for repair.
- Use no invented endpoints, data, business approvals, calculations, charts or fake successes.
- Verify every phase before proceeding. Do not mask visual regressions or test failures.

## Phase UI00 — Source and target inventory (no feature coding)
1. Open source CRM root and ITDMS root from absolute local paths provided by user; confirm both are readable.
2. List source route groups, component dependencies, design tokens, images, assets and providers.
3. List actual ITDMS Express endpoints and their required permissions + request/response/CSRF/session contracts.
4. Mark reusable UI primitives vs CRM-only logic with a file-by-file migration manifest.
5. Run CRM source *if safely possible* with a disposable development environment. Capture reference screenshots; avoid live user data.
6. Check missing 104 Figma PNGs; request their folder only if exact Figma-to-implementation comparison is required. Preserve code reference meanwhile.
7. Create `docs/frontend/ui-reference-inventory.md`, `docs/frontend/api-capability-map.md`, `docs/frontend/visual-baseline.md`, and `docs/frontend/ui-implementation-status.md`.
**Gate**: Layout/component inventory and backend capability map approved; no guessing.

## Phase UI01 — Lock design tokens and shared shell
1. Copy supported styles and UI primitives into `apps/web` from source code with minimal version-compatible changes.
2. Preserve `globals.css`, Tailwind colors, Inter font, light/dark styling, card radius/shadows, button/field variants.
3. Recreate shared desktop shell from `Sidebar`, `Topbar`, `MobileSidebar` and `AppLayout` with identical HTML/CSS behavior.
4. Replace brand string/content with ITDMS terminology without changing unrelated visuals.
5. Remove SaaS upgrade card, CRM navigation, marketing and sales-only items.
6. Capture comparative desktop/mobile screenshots and test collapse/menu/focus/scroll.
**Gate**: Visual shell accepted on 1440, 1024, 768, 390 and 375 px widths; no horizontal overflow.

## Phase UI02 — Auth, API adapter and permissions
1. Use the **existing ITDMS backend** session-cookie auth; do not copy CRM JWT/OAuth.
2. Implement API client matching actual Express envelopes, error contracts, `credentials: include`, CSRF requirements, status handling, and allowed origin proxy strategy.
3. Render protected routes; derive UI permissions from backend /me or equivalent verified API; server remains authoritative.
4. Adapt `AuthShell` visual layout and all auth states to ITDMS endpoints actually implemented.
5. Implement 401, 403, `POLICY_NOT_APPROVED`, offline, timeout, validation and session-expired states.
**Gate**: Real login/logout/session refresh/restricted routes verified with representative permitted and denied users.

## Phase UI03 — Dashboard overview, one shared design
1. Build **one app shell** with permission-aware dashboard summary cards, recent activity and reminders.
2. Reuse `KpiCard`, SectionCard, PageHeader, charts and StatusPill styling.
3. Data must come from real ITDMS API aggregations; if summary/trend endpoints are absent, mark missing and agree on contract, don't synthesize history.
4. Hide unauthorized financial KPIs and respect API permissions.
5. Show loading/empty/error states in same design language.
**Gate**: All cards and charts mapped to proven data sources; no fabricated metrics.

## Phase UI04 — Foundational master data
- Employees: list, create, detail, edit, deactivate, search/filter/pagination.
- Vendors: list, create, detail, edit, archive, relation counts.
- Assets: categories, register, detail/history, manual code, maintenance links, permitted cost visibility.
- Reuse source DataTable, PageHeader, form styling, detail-card patterns, confirm dialogs.
- Backend-owned validations and statuses; no client-side invented rules.
**Gate**: CRUD/update/permission/empty/loading/responsive and API integration tests.

## Phase UI05 — Procurement and asset movement
- Contracts, expiry lists, linked POs.
- Purchase orders with multiple line items, totals, attachments, detail view.
- Issuance/returns with multi-asset selection, condition notes, current holder, history.
- Blocked PO approvals visible only as clearly disabled/explained, not fake buttons.
- Carefully handle concurrent/invalid returns based on API errors.
**Gate**: E2E real DB flows, no hidden changes to PO totals or asset state.

## Phase UI06 — Financial and supporting modules
- Invoices and payment ledger, budgets/year/allocation/reports, maintenance, licenses, documents, notifications.
- Display `NON-OFFICIAL-D12` export disclaimer where applicable.
- Distinguish manual budget ledger vs unapproved auto posting; do not imply figures are client-approved if policies aren't.
- License renewal, department issue, consumable quantities as gated according to verified backend capability.
**Gate**: Permission tests, response format tests, sensitive fields not exposed, blocked-workflow UX.

## Phase UI07 — Search, reports, administration
- Full PO-related global search UI mapped to actual search response.
- Reports with supported formats and official-template status.
- User administration, audit logs, settings/notifications restricted by API permission.
- Hide CRM-only integrations, marketing billing, leads/deals terminology.
**Gate**: Every route/button/action points to a real backend contract and has observable results.

## Phase UI08 — Visual QA, responsive regression, accessibility, integration
- Route-by-route screenshot comparison using original runnable CRM baseline where layout matches; compare 1440/1024/768/390/375 widths.
- Preserve design tokens; any intentional divergence logged.
- Verify scroll behavior, tables on narrow screens, dialogs, form errors, disabled states, keyboard navigation and focus.
- Run frontend lint/typecheck/build/tests; full API E2E with isolated PostgreSQL; unauthorized/expired sessions; refresh and navigation.
- Verify file/document download flows, uploads, real data reconciliation.
- Produce `docs/frontend/visual-diff-report.md`, `docs/frontend/integration-report.md`, `docs/frontend/acceptance-matrix.md`.
**Gate**: No critical visual regressions, authorization bypasses, fake endpoints or unapproved business workflows.

## Route coverage target
| ITDMS module | Design patterns reused from CRM | ITDMS source of truth |
|---|---|---|
| Overview | dashboard cards/charts/activity | authorized real aggregates |
| Employees | customers/contacts list-detail forms | Employees API |
| Vendors | companies list-detail forms | Vendors API |
| Assets | customers table/detail, status cards | Assets/Categories APIs |
| Contracts | deals list/detail, documents | Contracts API |
| Purchase Orders | deals detail + line/table | POs/PO lines API |
| Issuance & Returns | multi-step forms, activities | Issue/Return APIs |
| Invoices & Payments | data tables, detail cards | Invoices/Payments API |
| Budgets | reports KPI/charts | Budget APIs |
| Maintenance | activity tables/records | Maintenance API |
| Licenses | lists, expiry statuses | Licenses API |
| Documents | attachment panels | Documents API |
| Notifications | bell + center | Notifications API |
| Search | search pages/results | PO Search API |
| Reports | reports charts/exports | Reports API |
| Administration | team/settings pages | Users/RBAC/Audit APIs |

## Definition of 'same to same'
Pixel-accurate **source style and common layout** when compared at matching viewport sizes. New domain sections necessarily differ in label length, column counts, fields and content. Don't pretend new ITDMS pages are literal duplicates of CRM business screens. Keep component DNA and spacing intact; document any change needed for ITDMS content/accessibility.
