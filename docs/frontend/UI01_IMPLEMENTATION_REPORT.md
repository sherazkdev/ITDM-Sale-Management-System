# UI01 — Implementation Report

**Date:** 2026-11-02  
**Scope:** Design system + dashboard shell (`apps/web`) — **no UI02 auth, no module CRUD**

---

## Summary

Created `@itdms/web` (Next.js **15.1.3**, React **19**, Tailwind **3.4**) by porting BizCRM (`D:\employee-management-system`) globals, Tailwind tokens, UI primitives, layout shell, and shared patterns. ITDMS navigation and permission keys replace CRM routes. Module routes render placeholders only.

---

## Components reused from CRM

| CRM source | ITDMS target | Notes |
|---|---|---|
| `src/app/globals.css` | `apps/web/src/app/globals.css` | Comment updated; tokens unchanged |
| `tailwind.config.ts` | `apps/web/tailwind.config.ts` | Direct copy |
| `postcss.config.js` | `apps/web/postcss.config.js` | Direct copy |
| `src/lib/utils.ts` | `apps/web/src/lib/utils.ts` | Direct copy |
| `src/lib/copy-to-clipboard.ts` | `apps/web/src/lib/copy-to-clipboard.ts` | For `CopyButton` |
| `src/components/ui/*` (16 files) | `apps/web/src/components/ui/*` | Direct copy |
| `src/components/common/PageHeader.tsx` | same path under web | Copy |
| `KpiCard`, `DataTable`, `StatusPill`, `EmptyState`, `SectionCard` | same | Copy |
| `Pagination`, `DataTableToolbar`, `FilterSelect`, `CopyButton`, `QuickTip`, `FormStepper`, `Stepper` | same | Copy (future modules) |
| `src/app/(app)/layout.tsx` | `apps/web/src/app/(app)/layout.tsx` | Same structure |
| `Sidebar.tsx`, `MobileSidebar.tsx`, `Topbar.tsx`, `UserMenu.tsx` | `components/layout/*` | **ADAPT** — ITDMS nav, no UpgradeCard, shell auth |
| `ThemeProvider.tsx` | `components/providers/ThemeProvider.tsx` | Storage key `itdms.theme` |
| `QueryProvider` pattern | `Providers.tsx` | Simplified retry |
| `Logo.tsx` | `components/brand/Logo.tsx` | Wordmark **ITDMS** |
| `stores/uiStore.ts` | `stores/uiStore.ts` | Persist key `itdms-ui` |

**Explicitly not ported:** `UpgradeCard`, CRM `AuthProvider`, `BrandThemeProvider`, `NotificationBell` API hooks, CRM API/`server/**`, marketing routes.

---

## New ITDMS-only files

| File | Purpose |
|---|---|
| `src/config/itdms-navigation.ts` | Typed nav + `filterNavByPermissions` |
| `src/lib/permissions.ts` | Mirrors API permission keys |
| `src/lib/api/client.ts` | Envelope types + UI02 stub `apiFetch` |
| `src/components/providers/ShellAuthProvider.tsx` | Dev-only shell user (labeled) |
| `src/components/shell/DevShellBanner.tsx` | UI01 banner |
| `src/components/shell/ModulePlaceholder.tsx` | Module stubs |
| `src/app/(app)/dashboard/page.tsx` | Overview shell + layout fixtures |
| `src/app/(app)/*/page.tsx` | 17 module placeholder routes |

---

## Design tokens preserved

All HSL CSS variables, `.bg-brand-gradient`, Tailwind `primary` scale, `shadow-card` / `shadow-pop`, sidebar tokens, Inter via `@fontsource/inter`, and responsive padding (`p-4 md:p-6 lg:p-8`, `max-w-[1600px]`) match UI00 audit / CRM source.

---

## Navigation & permissions

- Central config: `src/config/itdms-navigation.ts`
- Each item may set `permission` matching `apps/api/src/shared/auth/permissions.ts`
- **UI01:** `ShellAuthProvider` uses `permissionsMode: show-all-nav` (`filterNavByPermissions` receives `null`)
- **UI02:** Wire `GET /auth/me` → filter nav; no hardcoded role matrix (D01)

---

## Backend compatibility (UI02 prep)

- `next.config.ts` rewrites `/api/v1/*` → `ITDMS_API_URL` or `http://localhost:3000`
- Typed envelope in `src/lib/api/client.ts`
- Cookie session + `credentials: 'include'` documented; **not implemented** in UI01
- No fake API success responses

---

## Verification (executed)

| Check | Result |
|---|---|
| `npm install` (root) | **Pass** (+306 packages) |
| `npm run typecheck` (`apps/web`) | **Pass** |
| `npm run lint` (`apps/web`) | **Pass** (0 warnings) |
| `npm run build` (`apps/web`) | **Pass** — 22 static routes |
| `npm run dev` (`apps/web`) | **Pass** — http://localhost:3011 |
| Layout / sidebar / mobile drawer | **Manual** — browser snapshot + screenshots |
| Light / dark theme | **Manual** — toggle via user menu; `html.light` verified |

---

## Responsive verification

Captured ITDMS `/dashboard` screenshots (dev server):

| File | Viewport | Theme |
|---|---|---|
| `docs/frontend/screenshots/ui01-itdms-dashboard-1440.png` | 1440×900 | Dark (default system) |
| `docs/frontend/screenshots/ui01-itdms-dashboard-1440-light.png` | 1440×900 | Light |
| `docs/frontend/screenshots/ui01-itdms-dashboard-1024.png` | 1024×800 | Dark |
| `docs/frontend/screenshots/ui01-itdms-dashboard-768.png` | 768×1024 | Dark |
| `docs/frontend/screenshots/ui01-itdms-dashboard-390.png` | 390×844 | Dark (mobile header) |

**Not captured this pass:** 1280×800, 375×812 dedicated files (behavior follows same Tailwind `md`/`lg` rules as CRM).

**Sidebar collapse:** Toggle control present (240↔72px); not screenshot-archived.

---

## CRM visual comparison

| Reference | Status |
|---|---|
| CRM authenticated dashboard | **UNVERIFIED** — no dev credentials used; cannot compare pixel parity to CRM `/dashboard` |
| CRM login (UI00) | `ui00-crm-login-1440.png` — auth layout only |
| ITDMS shell vs CRM source | **Structural match** — same class names for sidebar/topbar/main; ITDMS adds section titles in nav and dev banner |

**Known differences (intentional):**

- Wordmark **ITDMS** vs BizCRM
- Nav grouped by ITDMS domains (section labels)
- No UpgradeCard footer
- Dev shell banner + placeholder KPI values (`—`)
- Topbar search placeholder → PO search route
- Notification dropdown static copy until UI06

---

## Limitations & risks

- Next **15.1.3** reports known CVE in npm advisory — pinned to match CRM; plan patch after visual sign-off
- `ShellAuthProvider` is **not** production auth
- Module pages are non-functional placeholders
- Permission-gated nav not exercised until UI02
- Recharts not used on overview yet (UI03)

---

## Remaining UI02 dependencies

1. Implement `apiFetch` + session (`POST /auth/login`, `GET /auth/me`, `POST /auth/logout`)
2. Replace `ShellAuthProvider` with real session context
3. Route middleware / guards (401 → login)
4. `usePermissions()` hook driving `filterNavByPermissions`
5. Env docs: `ITDMS_API_URL`, CORS/cookie domain for local dev

---

## UI01 gate

| Criterion | Met |
|---|---|
| `apps/web` scaffold in monorepo | Yes |
| CRM design system ported | Yes |
| ITDMS navigation config | Yes |
| No module CRUD / fake APIs | Yes |
| typecheck + lint + build | Yes |
| Screenshots + report | Yes |

**Stop here.** UI02 not started.
