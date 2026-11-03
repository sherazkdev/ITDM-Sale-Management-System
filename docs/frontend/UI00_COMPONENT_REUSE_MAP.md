# UI00 — Component Reuse Map

**Source root:** `D:\employee-management-system`  
**Target root:** `D:\ITDM-Sale-Management\apps\web` (to be created in UI01)

Legend: **COPY** = visual markup/classes with ITDMS wiring | **ADAPT** = strip CRM logic, keep UI | **SKIP** = do not port

---

## A. Global styles and config

| Source path | Component / artifact | Dependencies | ITDMS destination | Action |
|---|---|---|---|---|
| `src/app/globals.css` | CSS variables, `.bg-brand-gradient`, `.tabular` | Tailwind layers | `apps/web/src/app/globals.css` | **COPY** (rename comments to ITDMS) |
| `tailwind.config.ts` | Theme extend (colors, shadows, fonts) | `tailwindcss-animate` | `apps/web/tailwind.config.ts` | **COPY** |
| `postcss.config.mjs` | PostCSS | autoprefixer | `apps/web/` | **COPY** |
| `src/lib/utils.ts` | `cn()` helper | clsx, tailwind-merge | `apps/web/src/lib/utils.ts` | **COPY** |

---

## B. Layout shell

| Source path | Component | Styling deps | CRM logic to remove | ITDMS destination | Action |
|---|---|---|---|---|---|
| `src/app/(app)/layout.tsx` | AppLayout | Sidebar, Topbar, MobileSidebar | — | `apps/web/src/app/(app)/layout.tsx` | **COPY** structure |
| `src/components/layout/Sidebar.tsx` | Sidebar | `PRIMARY_NAV`, uiStore, UpgradeCard | CRM nav, SaaS upgrade card | `.../layout/Sidebar.tsx` | **ADAPT** |
| `src/components/layout/MobileSidebar.tsx` | MobileSidebar | framer-motion, nav | CRM nav | `.../MobileSidebar.tsx` | **ADAPT** |
| `src/components/layout/Topbar.tsx` | Topbar | Input, buttons | CRM search scope | `.../Topbar.tsx` | **ADAPT** (PO search route) |
| `src/components/layout/UserMenu.tsx` | UserMenu | dropdown, avatar | CRM `/api/users/me` | `.../UserMenu.tsx` | **ADAPT** → ITDMS `/auth/me` |
| `src/components/layout/SidebarUser.tsx` | SidebarUser | avatar | CRM API | optional footer | **ADAPT** |
| `src/components/layout/UpgradeCard.tsx` | UpgradeCard | card gradient | SaaS billing | — | **SKIP** |
| `src/stores/uiStore.ts` | Zustand UI state | zustand | — | `.../stores/uiStore.ts` | **COPY** |
| `src/config/navigation.ts` | PRIMARY_NAV | lucide icons | All CRM routes | `.../config/itdms-navigation.ts` | **REPLACE** (new file) |

---

## C. UI primitives (`src/components/ui/`)

| File | Purpose | Radix / deps | Action |
|---|---|---|---|
| `button.tsx` | Variants CVA | @radix-ui/react-slot | **COPY** |
| `input.tsx` | Text input + icons | — | **COPY** |
| `card.tsx` | Card compound | — | **COPY** |
| `badge.tsx` | Badges | — | **COPY** |
| `dialog.tsx` | Modal | @radix-ui/react-dialog | **COPY** |
| `dropdown-menu.tsx` | Menus | @radix-ui/react-dropdown-menu | **COPY** |
| `tabs.tsx` | Tabs | @radix-ui/react-tabs | **COPY** |
| `label.tsx`, `checkbox.tsx`, `switch.tsx` | Form controls | Radix | **COPY** |
| `avatar.tsx` | Avatar | @radix-ui/react-avatar | **COPY** |
| `skeleton.tsx` | Loading | — | **COPY** |
| `separator.tsx`, `tooltip.tsx`, `progress.tsx` | Misc | Radix | **COPY** |
| `native-select.tsx` | Select fallback | — | **COPY** |

Destination: `apps/web/src/components/ui/*` (same filenames).

---

## D. Common patterns (`src/components/common/`)

| File | Use in ITDMS | CRM logic | Action |
|---|---|---|---|
| `PageHeader.tsx` | All modules | — | **COPY** |
| `SectionCard.tsx` | Detail pages | — | **COPY** |
| `KpiCard.tsx` | Overview dashboard | Fake trend props OK visually; data from API | **ADAPT** |
| `DataTable.tsx` | Employees, vendors, assets, POs, invoices | Client-side sort only | **ADAPT** (server pagination) |
| `DataTableToolbar.tsx` | Filters | — | **ADAPT** |
| `Pagination.tsx` | Lists | — | **ADAPT** to API `meta.total` |
| `EmptyState.tsx` | Empty lists | — | **COPY** |
| `StatusPill.tsx` | PO/asset/invoice status | CRM status enums | **ADAPT** labels/colors to ITDMS |
| `FilterSelect.tsx` | List filters | — | **COPY** |
| `FormStepper.tsx`, `Stepper.tsx` | Multi-step issue/return | CRM wizards | **ADAPT** |
| `CopyButton.tsx`, `QuickTip.tsx` | Utility | — | **COPY** optional |
| `OtpInput.tsx`, `PasswordStrength.tsx` | Auth extras | OTP register flow | **SKIP** unless ITDMS adds D22 flows |

---

## E. Auth and brand

| File | ITDMS | Action |
|---|---|---|
| `src/components/auth/AuthShell.tsx` | Login layout split panel | **ADAPT** (remove OAuth panel items) |
| `src/components/auth/AuthMarketingPanel.tsx` | Left/right marketing | **ADAPT** copy to ITDMS |
| `src/components/auth/illustrations.tsx` | SVG illos | **ADAPT** or replace with neutral IT imagery |
| `src/components/brand/Logo.tsx` | Wordmark | **ADAPT** text “ITDMS” |
| `src/app/(auth)/login/page.tsx` | Login | **ADAPT** — POST `/api/v1/auth/login`, no Google/MS/Apple |
| `src/components/providers/AuthProvider.tsx` | Session | **REPLACE** ITDMS cookie session |
| `src/components/providers/Providers.tsx` | Theme + query | **ADAPT** — drop CRM-specific providers |
| `src/components/providers/BrandThemeProvider.tsx` | Workspace theming | **SKIP** or simplify (no workspace API) |

---

## F. CRM-only — SKIP entire directories

| Path | Reason |
|---|---|
| `src/app/api/**` | CRM API routes |
| `src/server/**` | Mongoose models, passport, email |
| `src/app/(marketing)/**` | Marketing site |
| `src/app/onboarding/**` | SaaS onboarding |
| `src/components/email/**` | CRM email client |
| `src/components/marketing/**` | Landing pages |
| `src/components/editor/**` | Editor.js (optional later for notes) |
| `src/components/crm/ImportModal.tsx`, `ExportMenu.tsx` | CRM import/export — reimplement against ITDMS reports API |
| `src/lib/db.ts`, mongoose usage | MongoDB |

---

## G. Dashboard and charts

| Source | ITDMS module | Action |
|---|---|---|
| `src/app/(app)/dashboard/page.tsx` | Overview | **ADAPT** — map KPIs to notifications count, open POs, expiring contracts/licenses (real APIs only) |
| Recharts usage in dashboard | Budget/usage charts | **ADAPT** — only with `/budgets/*/summary` or report endpoints |
| `src/components/marketing/DashboardPreview.tsx` | — | **SKIP** |

---

## H. Settings / admin patterns

| CRM page | ITDMS mapping | Action |
|---|---|---|
| `settings/roles/page.tsx` | `/admin/users` + roles API | **ADAPT** layout only |
| `settings/profile/page.tsx` | User profile (if API added) | **DEFER** — ITDMS has limited user PATCH |
| `settings/theme/page.tsx` | Theme toggle | **COPY** pattern if theme provider ported |
| Other settings (billing, webhooks, API keys) | — | **SKIP** |

---

## I. Responsive behavior notes (from source)

| Component | Desktop | Mobile |
|---|---|---|
| Sidebar | visible `md+`, collapsible 240↔72 | hidden; drawer via Topbar menu |
| Topbar search | visible `md+` max-w-xl | hidden (ITDMS: link to `/search`) |
| DataTable | `hideOnMobile` columns | horizontal scroll expected |
| Main padding | `p-4 md:p-6 lg:p-8` | same progression |

---

## J. Dependency package list for `apps/web` (UI01)

Copy from CRM `package.json` (exclude mongoose, passport, nodemailer, editorjs, jspdf unless needed):

- `next`, `react`, `react-dom`, `typescript`
- `tailwindcss`, `postcss`, `autoprefixer`, `tailwindcss-animate`
- `@fontsource/inter`
- `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`
- Radix packages matching `components/ui`
- `framer-motion` (mobile drawer)
- `react-hook-form`, `@hookform/resolvers`, `zod`
- `@tanstack/react-query` (ITDMS API client layer)
- `recharts` (dashboard/reports)
- `sonner` (toasts)
- `zustand` (uiStore)

**Do not add:** `mongoose`, `passport*`, `axios` optional (prefer `fetch` + credentials).

---

## Acceptance

- Every **COPY/ADAPT** row has a target path under `apps/web`.
- No CRM API hook copied without ITDMS replacement plan.
- UpgradeCard and marketing routes explicitly excluded.
