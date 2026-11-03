# ORLEN Final Branding Report

**Date:** 2026-11-03  
**Project:** `ITDM-Sale-Management` / `apps/web`  
**Scope:** Visual branding only — ORLEN red theme + official logo integration slot. No layout, API, auth, or business-logic changes.

**Client branding approval:** Not claimed. This report documents engineering delivery pending client review and supply of official logo files.

---

## 1. Logo asset source

| Status | Detail |
|--------|--------|
| **Official ORLEN logo in repo** | **Not present** at delivery time. No suitable client-provided SVG/PNG was found under version control (search: `orlen`, `ORLEN`, `public/brand/*.{svg,png}`). |
| **Integration path** | `apps/web/public/brand/` — see `apps/web/public/brand/README.md` for expected filenames. |
| **Runtime behavior** | `OrlenBrandLogo` loads `/brand/orlen-logo.svg` (and optional dark/mark variants). On 404, shows typographic **ORLEN** + **ITDMS** subtitle — **not** a recreated or web-sourced logo. |
| **Collapsed sidebar** | Uses `/brand/orlen-logo-mark.svg` when present; otherwise ITDMS product mark (`LogoMark`) tinted with `--primary` / `--brand-gradient-to`. |

**Action for client:** Drop approved assets into `public/brand/` and re-capture sidebar/login screenshots. No code change required beyond file placement.

---

## 2. Final color palette (hex reference)

Derived from ORLEN corporate red (~ **#E30613**) for tokens; exact match to client PDF/brand book should be confirmed when logo files arrive.

| Token / role | Light (`:root`) | Approx. hex | Dark (`.dark`) | Approx. hex |
|--------------|-------------------|-------------|------------------|-------------|
| `--primary` | `357 93% 46%` | **#E30613** | `357 88% 55%` | **#EF2D38** |
| `--brand-gradient-to` | `0 76% 38%` | **#A31616** | `0 70% 42%` | **#B31F1F** |
| `--ring` / focus | same as primary | | same as primary | |
| `--secondary` | `357 35% 96%` | tint | `224 25% 16%` | neutral |
| `--accent` / sidebar accent bg | `357 100% 97%` | tint | `357 40% 22%` | deep red |
| `--sidebar-accent-foreground` | `357 85% 40%` | **#C41E24** | `220 14% 95%` | text |
| `--chart-brand` | `357 93% 46%` | chart accent | `357 88% 55%` | chart accent |

**Unchanged (semantic hierarchy):** `--destructive`, `success`, `warning`, `info` scales in `tailwind.config.ts`; chart series greens, ambers, cyans, etc. remain non-red.

**Gradients / shadows:** `bg-brand-gradient`, `shadow-pop`, Tailwind `primary.50–950` remapped to red hue **357**.

---

## 3. Design tokens changed

| File | Changes |
|------|---------|
| `apps/web/src/app/globals.css` | Primary, secondary, accent, ring, sidebar accents, `--brand-gradient-to`, `--chart-brand*`; page background tint; `.bg-brand-gradient` stops. |
| `apps/web/tailwind.config.ts` | `primary` scale (357), `shadow-pop`, `brand-gradient`, `brand-soft`. |
| `apps/web/src/components/dashboard/DashboardCharts.tsx` | `CHART.brand` / `CHART.brandMuted` via CSS vars; `CHART.violet` aliases brand for compatibility. |
| `apps/web/src/app/(app)/dashboard/page.tsx` | Issued-assets slice uses `CHART.brand`. |
| `apps/web/src/components/auth/AuthShell.tsx` | Showcase radials: violet → ORLEN red; light panel `#fdf0f0`. |
| `apps/web/src/components/brand/Logo.tsx` | `OrlenBrandLogo`, `LogoMark`, `Wordmark` wiring; gradient stops use CSS vars. |
| `apps/web/src/components/layout/Sidebar.tsx` | Collapsed header uses `OrlenBrandLogo`. |

**Not changed:** Sidebar width (240/72), topbar `h-16`, main padding/max-width, CRM create/detail layouts, dashboard grid structure, navigation config.

---

## 4. Components updated (by area)

- **Shell:** Sidebar (expanded/collapsed brand), MobileSidebar (`Wordmark` → ORLEN slot), active nav still `bg-brand-gradient` + `shadow-pop`.
- **Auth:** Login form column + showcase panels (red gradients); `Wordmark` on all auth pages using `AuthShell`.
- **Controls:** Primary `Button`, checkbox/switch/progress, badges, steppers — consume tokens (no per-file violet hex).
- **Dashboard:** KPI `tone="violet"` is a **legacy prop name** only; styling is `bg-primary/10 text-primary` (now red).
- **Charts:** Donut/bar brand accent via `CHART.brand`; other series unchanged.

---

## 5. Screenshots (before / after)

**Directory:** `docs/frontend/screenshots/orlen-branding/`

### Before (pre-ORLEN / CRM violet theme)

Copied from CRM layout correction captures (2026-11-03 baseline):

| File | Route |
|------|--------|
| `before-dashboard-1440-light.png` | `/dashboard` |
| `before-dashboard-390-light.png` | `/dashboard` mobile |
| `before-employees-1440-light.png` | `/employees` |
| `before-vendors-1440-light.png` | `/vendors` |
| `before-assets-1440-light.png` | `/assets` |
| `before-invoices-1440-light.png` | `/invoices` |
| `before-login-1440-light.png` | `/login` |

### After (ORLEN red theme)

| Pattern | Themes / widths |
|---------|-----------------|
| `after-{route}-1440-{light\|dark}.png` | dashboard, employees, vendors, assets, invoices |
| `after-{route}-390-{light\|dark}.png` | same routes @ 390×844 |
| `after-login-{1440\|390}-{light\|dark}.png` | login (unauthenticated) |

**Visual delta:** Violet primary, sidebar active state, auth showcase, and chart “issued” accent → red; layout dimensions unchanged.

---

## 6. Regression results

| Check | Result |
|-------|--------|
| `npm run typecheck` (root) | Pass |
| `npm run lint` (root) | Pass |
| `npm run test --workspace=@itdms/web` (Vitest) | **43/43** pass |
| `npm run build:web` | Pass |
| Playwright `e2e/responsive.spec.ts` | **162** pass (no horizontal overflow) |
| Playwright `e2e/orlen-branding-capture.spec.ts` | **6/6** pass (after fix: wait on `main` for mobile; auth setup sensitive to API rate limit — re-run after cooldown if login setup fails) |

**Playwright note:** Use clean production build before `next start` captures (`Remove-Item apps/web/.next -Recurse` then `npm run build`) if Turbopack/dev artifacts cause `MODULE_NOT_FOUND`.

**E2E API:** `apps/web/.env.local` → `ITDMS_API_URL=http://127.0.0.1:3000`; API must be reachable for auth setup.

---

## 7. Remaining issues

1. **Missing official ORLEN logo files** — sidebar/login show text fallback until client assets are added under `public/brand/`.
2. **Hex fine-tuning** — Primary red is aligned to public ORLEN reference **#E30613**; client brand book may require exact CMYK/Pantone match once logo is supplied.
3. **Documentation drift** — `docs/frontend/CRM_DESIGN_FIDELITY_REPORT.md` still cites violet `245 78% 62%`; superseded for production UI by this branding pass (tokens in `globals.css` are authoritative).
4. **KPI prop naming** — `tone="violet"` on list/KPI components is cosmetic naming only; optional rename in a future cleanup (out of scope here).
5. **Auth showcase copy colors** — Some light-tone auth body text still uses indigo-tinted hex (`#4b478a`, etc.); readable and secondary to primary red; optional polish if client wants all neutrals warm-gray.

---

## 8. Verification checklist (manual)

- [x] Light mode: sidebar active, buttons, links, focus rings → red token
- [x] Dark mode: primary, charts, dialogs/shell (via token inheritance)
- [x] Login + app shell branding locations wired
- [x] No backend / Prisma / RBAC / calculation changes
- [ ] Client UAT with official logo files — **pending**

---

## 9. How to re-run branding captures

```powershell
cd D:\ITDM-Sale-Management\apps\web
# Ensure API on ITDMS_API_URL and clean build for next start
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npx playwright test e2e/orlen-branding-capture.spec.ts --project=chromium-desktop
```

---

*End of ORLEN final branding engineering report.*
