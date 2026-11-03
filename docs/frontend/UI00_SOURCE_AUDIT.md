# UI00 — Source CRM Design Audit

**Date:** 2026-11-02  
**Source (READ-ONLY):** `D:\employee-management-system`  
**Target:** `D:\ITDM-Sale-Management` (no `apps/web` yet — API only `@itdms/api`)  
**Specifications:** `requirements/frontend/01–04`

---

## 1. Executive summary

The BizCRM project is a **Next.js 15.1.3 / React 19** App Router application with a cohesive **violet-forward design system** (HSL CSS variables + Tailwind 3.4), **shadcn-style Radix UI primitives**, shared **app shell** (240px / 72px sidebar, 64px topbar, mobile drawer), and reusable **list/detail/dashboard** patterns. It is suitable as the **visual and component reference** for ITDMS.

**Do not port:** MongoDB/Mongoose, `src/app/api/*`, Passport/OAuth/JWT CRM auth, CRM business modules (leads, deals, SaaS billing, marketing, email workspace), `.env`, or `public/uploads/*` user content.

**Runtime verification (this session):** CRM dev server started on `http://localhost:3010` (read-only source tree; `.env` loaded by Next but **not read or copied**). Login route rendered successfully. **One** reference screenshot captured (login, default viewport ~1440px class width): `docs/frontend/screenshots/ui00-crm-login-1440.png`. Full breakpoint matrix (375/390/768/1024/1440) and authenticated dashboard shell **not** captured (requires CRM credentials and additional viewport passes).

---

## 2. Source stack

| Item | Evidence |
|---|---|
| Framework | `package.json` — Next **15.1.3**, React **19**, Turbopack dev |
| Styling | Tailwind **3.4**, `tailwindcss-animate`, `class-variance-authority`, `tailwind-merge` |
| Fonts | `@fontsource/inter` 400–700 in `src/app/layout.tsx` |
| Icons | `lucide-react` |
| Charts | `recharts` (dashboard) |
| Motion | `framer-motion` (mobile sidebar) |
| Forms | `react-hook-form`, `@hookform/resolvers`, `zod` |
| Data (CRM) | `@tanstack/react-query`, `axios`, `mongoose` — **exclude from ITDMS** |
| Auth (CRM) | `passport`, OAuth, `jose`, Next API routes — **exclude** |
| Theme | `next-themes` pattern via `Providers` / theme toggle in settings |

Config files to copy in UI01 (visual only): `tailwind.config.ts`, `postcss.config.*`, `src/app/globals.css`, `components.json` (if present).

---

## 3. App Router structure (source)

| Route group | Purpose | ITDMS action |
|---|---|---|
| `(app)/` | Authenticated shell: `layout.tsx` + modules | Reuse shell; replace routes |
| `(auth)/` | Login, register, OTP, OAuth | Reuse **AuthShell** visuals; wire ITDMS Express session |
| `(marketing)/` | Public marketing site | **Do not port** |
| `onboarding/*` | SaaS workspace onboarding | **Do not port** |
| `api/*`, `server/*` | CRM backend | **Do not port** |

Representative CRM pages to mirror **patterns** (not business):

- `src/app/(app)/dashboard/page.tsx` — KPI grid + Recharts + activity
- `src/app/(app)/customers/page.tsx`, `customers/[id]/page.tsx` — list + detail
- `src/app/(app)/deals/[id]/page.tsx` — line items / related records pattern
- `src/app/(app)/search/page.tsx` — global search layout
- `src/app/(app)/notifications/page.tsx` — notification center
- `src/app/(app)/settings/*` — settings sub-nav pattern (adapt for ITDMS admin subset)
- `src/app/(auth)/login/page.tsx` — split auth layout

---

## 4. Layout and navigation (source behavior)

| Component | Path | Behavior |
|---|---|---|
| App layout | `src/app/(app)/layout.tsx` | Flex shell; main `p-4 md:p-6 lg:p-8 max-w-[1600px]` |
| Sidebar | `src/components/layout/Sidebar.tsx` | `md:flex`, width **240px / 72px**, sticky full height, active link `bg-brand-gradient` + `shadow-pop` |
| MobileSidebar | `src/components/layout/MobileSidebar.tsx` | Drawer `< md`, Framer Motion |
| Topbar | `src/components/layout/Topbar.tsx` | `h-16`, sticky, blur backdrop, search input, notification + user menu |
| Navigation config | `src/config/navigation.ts` | **Replace entirely** with ITDMS permission-aware nav |
| UpgradeCard | `src/components/layout/UpgradeCard.tsx` | **Remove** (SaaS CTA) |
| UserMenu / SidebarUser | `src/components/layout/UserMenu.tsx`, `SidebarUser.tsx` | Reuse styling; ITDMS session user |
| NotificationBell | `src/components/crm/NotificationBell.tsx` | Reuse styling; ITDMS `/notifications` API |

Breakpoints (from Tailwind usage): mobile `< md` (768px); sidebar hidden on mobile; topbar menu button `md:hidden`.

---

## 5. Design system (summary)

Documented in **`UI00_DESIGN_TOKENS.md`**. Highlights:

- Primary violet `hsl(245 78% 62%)` (~ `#5B4FE9`)
- Page background light `hsl(230 25% 98%)` (~ `#F7F8FB`)
- Card radius `--radius: 0.75rem` (12px)
- Shadows: `shadow-card`, `shadow-soft`, `shadow-pop`
- Dark mode: `.dark` token set in `globals.css`

---

## 6. Assets and Figma

| Asset | Status |
|---|---|
| `figma-manifest.txt` | Lists **104 PNG filenames** — **files not present** in repo (manifest only) |
| `public/uploads/**` | Sample avatars/images/PDFs — **do not copy** to ITDMS (user/upload content) |
| `public/pdf.worker.min.mjs` | CRM email PDF viewer — only if ITDMS needs in-app PDF preview |
| Brand | `src/components/brand/Logo.tsx` — reword to ITDMS, keep geometry/colors |

---

## 7. ITDMS backend alignment (Step 4)

ITDMS Express API (`apps/api`) is the **only** data/auth source.

| Topic | ITDMS reality |
|---|---|
| Auth | Cookie `SESSION_COOKIE_NAME` (default `itdms_session`); optional Bearer; `GET /api/v1/auth/me` returns `permissions: string[]` |
| Envelope | `{ success, data, meta: { requestId, page?, pageSize?, total? } }` / `{ success: false, error: { code, message, details } }` |
| Pagination | Query `page`, `pageSize` (max 100), optional `sortBy`, `sortDir` |
| Permissions | See `apps/api/src/shared/auth/permissions.ts` — seed matrix **PROPOSED (D01)** |
| Blocked APIs | PO submit/approve/cancel, license renew → `403 POLICY_NOT_APPROVED`; official templates **D12** (placeholder exports with disclaimer header) |
| Docs | `docs/BACKEND_FINAL_ACCEPTANCE_MATRIX.md`, `docs/CLIENT_REQUIREMENTS_REMEDIATION_REPORT.md` |

**No `apps/web` in monorepo yet.** UI01 will add `apps/web` workspace.

Client PDFs (`requirements/*.pdf`) require browser-based internal IT ops UI — CRM visual language satisfies “dashboard-friendly” intent; **not** pixel copies of absent Figma PNGs.

---

## 8. ITDMS planned navigation (single app)

Permission-gated sections (labels provisional):

1. Overview — `/dashboard`
2. Employees — `/employees`
3. Inventory — `/assets`, `/asset-categories`
4. Vendors — `/vendors`
5. Contracts — `/contracts`
6. Purchase orders — `/purchase-orders`
7. Issuance & returns — `/issuance`, `/returns`
8. Invoices — `/invoices`
9. Budgets — `/budgets`
10. Maintenance — `/maintenance`
11. Licenses — `/licenses`
12. Search — `/search` (PO hub)
13. Documents & reports — `/documents`, `/reports`
14. Notifications — `/notifications`
15. Administration — `/admin/users`, `/admin/audit` (if `users.manage` / `audit.read`)

---

## 9. Technical risks

| Risk | Mitigation |
|---|---|
| CRM DataTable sorts **current page only** | ITDMS lists: server sort/pagination via API |
| CRM dashboard **synthetic** chart series | ITDMS overview: real aggregates or explicit “no API” empty state |
| CRM auth/OAuth in login UI | Strip OAuth buttons; username/password → ITDMS login |
| React 19 / Next 15 coupling | Match versions in `apps/web` when created |
| Permission matrix not client-approved | UI labels + nav hide; never fake access |
| Blocked workflows | Disabled actions + `POLICY_NOT_APPROVED` copy from API |
| Missing Figma PNGs | Code reference + partial screenshot; no Figma diff claim |
| CORS / cookies | Next proxy or same-site deployment; `credentials: 'include'` |

---

## 10. UI00 acceptance criteria

| Criterion | Status |
|---|---|
| Source paths and design system documented | Done |
| Reuse vs exclude list documented | Done → `UI00_COMPONENT_REUSE_MAP.md` |
| Tokens extracted | Done → `UI00_DESIGN_TOKENS.md` |
| API mapping per module | Done → `UI00_BACKEND_API_MAPPING.md` |
| Visual baseline evidence | Partial → `UI00_VISUAL_BASELINE.md` |
| Phased plan through UI08 | Done → `UI00_IMPLEMENTATION_PLAN.md` |
| No ITDMS feature pages implemented | Confirmed |
| CRM source unmodified | Confirmed (read-only inspection + dev run) |

**UI01 gate:** Approve reuse map + tokens + API map before copying shell into `apps/web`.
