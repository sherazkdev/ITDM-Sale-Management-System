# BizCRM source -> ITDMS: inspected design audit

## Scope and evidence
Source examined from uploaded `crm-managment.zip` (572 archive entries, ~11.7 MiB uncompressed). Read existing Next.js source, styles, navigation, shared layout, login, dashboard, and UI components. The actual UI was **not launched**, because dependencies were unavailable in this environment; offline `npm ci` failed `ENOTCACHED`, and an online attempt failed with an npm exit-handler error. Therefore visual appearance and responsive behavior are **source-inspected, not screenshot-verified**.

The archive includes `figma-manifest.txt` listing 104 PNG IDs, but does **not** include those original 104 mockup PNGs. Only seven PNG/JPG files appear, under `public/uploads/`. Do not assume those uploaded images are authorized or appropriate ITDMS assets. There is also a `.env` in the archive; do not copy it or expose its contents.

## Observed design system
- `src/app/globals.css`: HSL tokens, light/dark themes, violet primary (~`#5B4FE9`), cool off-white background (~`#F7F8FB`), white cards, muted borders, 12px radius, brand gradient.
- `tailwind.config.ts`: token extensions, color semantics, typography, shadow system.
- `src/app/layout.tsx`: local Inter via `@fontsource/inter` and provider hierarchy.
- `src/app/(app)/layout.tsx`: two-column app shell, shared `Sidebar`, `MobileSidebar`, `Topbar`, max-width main area with responsive padding.
- `src/components/layout/Sidebar.tsx`: desktop 240px / collapsed 72px, sticky, gradient active item.
- `src/components/layout/MobileSidebar.tsx`: drawer for narrow widths with Framer Motion, close-on-navigation.
- `src/components/layout/Topbar.tsx`: mobile menu, collapse, search, notifications and user menu.
- `src/components/common/`: `KpiCard`, `DataTable`, `PageHeader`, `StatusPill`, `EmptyState`, `Pagination`, `DataTableToolbar`, etc.
- `src/components/ui/`: buttons, cards, inputs, badges, dialogs, tabs, dropdowns, skeletons and related primitives.
- `src/app/(app)/dashboard/page.tsx`: KPI cards, Recharts visualizations, recent activity and derived view data.
- `src/app/(auth)/login/page.tsx`: split auth experience, form layout and illustrations.
- `src/components/providers/`: theme, query, auth and brand theme.
- `src/config/navigation.ts`: CRM-specific link list requiring full ITDMS replacement.

## Design reuse suitability
**Strong candidate for reuse of the interface foundation.** Preserve styling, CSS tokens, visual composition and responsive patterns. Adapt copy, icons, fields, columns, workflows and sections for ITDMS client requirements. Preserve the look of identical shared primitives; do not promise pixels will be identical where the content/layout must change for a new module.

## Do NOT port as functional code
- `src/app/api/`, `src/server/models/`, `src/lib/db.ts`, `mongoose`, old CRM authentication middleware/session implementation, CRM JWT or OAuth workflows.
- Business modules for leads, deals, SaaS billing, marketing pages, onboarding/CRM workspaces, CRM upgrades, sales funnels.
- CRM-specific API hooks, server-derived metrics, and mock/synthetic dashboard trend algorithms. Example: `buildSalesSeries()` synthesizes daily charts using weights from aggregate KPIs; ITDMS must use real interval data from verified APIs.
- Existing `src/components/layout/UpgradeCard.tsx` and CRM marketing calls-to-action.
- Existing public uploads, `.env`, production keys, cookies, databases, user records.

## Reuse carefully (style and markup yes, business logic no)
- `Topbar`: CRM `NotificationBell` and `UserMenu` depend on old API/auth; replace with ITDMS equivalents while preserving markup/styles.
- `Sidebar`, `MobileSidebar`: rebuild navigation from ITDMS API-granted permissions, preserving appearance and responsive behavior; badges must be real counts.
- `AuthShell`: reuse visual shell, replace auth submission with the existing Express cookie/session APIs and CSRF requirements.
- `DataTable`: audit sorting/pagination; client-side sorting only the current page can mislead when backend has many pages. Use server sorting for large datasets.
- `Dashboard`: use ITDMS summary API or independently authorized aggregate endpoints; no client-side invented budget or expenditure figures.
- `BrandThemeProvider`: inspect old workspace/API dependency, decouple before porting.

## Target frontend architecture
One Next.js frontend (`apps/web`) talking to the existing Express (`apps/api`) and PostgreSQL backend. One common layout, permission-aware navigation, role-specific dashboard content only where supported by confirmed permissions. Server/API authorization is authoritative; UI checks are not security boundaries.

## Scope warning
Original client PDFs require browser-based use on an internal server, a user-friendly dashboard, role-based access and operational modules. They do **not** specify separately built Admin/Software Manager/Finance applications, nor do they specify exact dashboard mockups. Those are design recommendations subject to client approval.
