# UI00 — Design Tokens (extracted from BizCRM source)

**Authoritative source files:**

- `D:\employee-management-system\src\app\globals.css`
- `D:\employee-management-system\tailwind.config.ts`

Do **not** change token values during ITDMS port unless client approves a deliberate rebrand.

---

## 1. Color tokens (HSL CSS variables)

### Light (`:root`)

| Token | HSL | Approx hex / usage |
|---|---|---|
| `--background` | `230 25% 98%` | Page bg ~ `#F7F8FB` |
| `--foreground` | `222 47% 11%` | Primary text ~ `#0F172A` |
| `--card` | `0 0% 100%` | Card surface |
| `--primary` | `245 78% 62%` | Brand violet ~ `#5B4FE9` |
| `--primary-foreground` | `0 0% 100%` | Text on primary |
| `--brand-gradient-to` | `262 70% 60%` | Gradient end stop |
| `--secondary` | `245 30% 96%` | Secondary fills |
| `--muted` | `220 16% 96%` | Muted backgrounds |
| `--muted-foreground` | `215 16% 47%` | Secondary text ~ `#64748B` |
| `--border` / `--input` | `220 16% 91%` | Hairline borders |
| `--ring` | `245 78% 62%` | Focus ring |
| `--destructive` | `0 80% 60%` | Error/destructive |
| `--sidebar` | `0 0% 100%` | Sidebar bg (light) |
| `--sidebar-accent` | `245 100% 97%` | Hover/active soft |
| `--radius` | `0.75rem` | **12px** base radius |

### Dark (`.dark`)

| Token | Notes |
|---|---|
| `--background` | `224 32% 8%` deep navy page |
| `--card` | `224 28% 11%` |
| `--primary` | `245 78% 68%` slightly lighter violet |
| `--sidebar` | `240 30% 6%` |
| `--border` | `224 22% 20%` |

---

## 2. Tailwind semantic extensions

From `tailwind.config.ts`:

| Key | Value |
|---|---|
| `fontFamily.sans` | `var(--font-inter)` |
| `container.screens.2xl` | `1440px` |
| `primary.500` | Documented ~ `#5B4FE9` |
| `success` / `warning` / `info` | Soft + default pairs for StatusPill |
| `borderRadius.lg` | `var(--radius)` |
| `borderRadius.md` | `calc(var(--radius) - 2px)` |
| `borderRadius.sm` | `calc(var(--radius) - 4px)` |
| `boxShadow.card` | Subtle card elevation |
| `boxShadow.soft` | Dropdowns / popovers |
| `boxShadow.pop` | Active nav / emphasis |
| `backgroundImage.brand-gradient` | 135deg primary → purple |
| `backgroundImage.brand-soft` | Light tinted panels |

Utility class **`.bg-brand-gradient`** in `globals.css` binds gradient to `--primary` and `--brand-gradient-to` for theme overrides.

---

## 3. Typography

| Element | Source rule |
|---|---|
| Font family | Inter (400, 500, 600, 700 via `@fontsource/inter`) |
| Body | `font-sans`, antialiased, `rlig/calt/cv11/ss01` features |
| KPI numbers | `.tabular` → `font-variant-numeric: tabular-nums` |
| Section labels (sidebar) | `text-[10px] font-semibold uppercase tracking-wider text-muted-foreground` |
| Nav items | `text-sm font-medium` |
| Page titles | Via `PageHeader` (inspect in UI01) |

---

## 4. Layout metrics (shell)

| Metric | Source class / value |
|---|---|
| Sidebar width expanded | `w-[240px]` |
| Sidebar collapsed | `w-[72px]` |
| Sidebar header height | `h-[64px]` |
| Topbar height | `h-16` (64px) |
| Main max width | `max-w-[1600px] mx-auto` |
| Main padding | `p-4 md:p-6 lg:p-8` |
| Nav item | `rounded-lg px-3 py-2 gap-3` |
| Active nav | `bg-brand-gradient text-primary-foreground shadow-pop` |
| Icon size (nav) | `h-[18px] w-[18px]` |

---

## 5. Component variants (reference)

Inspect in UI01 copy:

- **Button:** `src/components/ui/button.tsx` — default, destructive, outline, ghost, link; sizes sm/default/lg/icon
- **Input:** bordered, focus ring `ring`, optional left/right icons
- **Card:** `rounded-lg border bg-card shadow-card`
- **Badge:** outline/destructive for nav counts
- **StatusPill:** `src/components/common/StatusPill.tsx` — map ITDMS statuses to `success/warning/info/muted`

---

## 6. Theme switching

- CRM uses class-based dark mode: `darkMode: ["class"]` in Tailwind
- Provider stack in `src/components/providers/` — port `ThemeProvider` pattern; ITDMS settings page optional

---

## 7. ITDMS-specific UI labels (not tokens)

Use copy and disclaimers from backend (not design tokens):

- Budget: “Provisional — pending client policy (D06/D07)”
- Exports: banner when `X-ITDMS-Export-Disclaimer` or JSON `disclaimer` field present
- Blocked actions: `POLICY_NOT_APPROVED` message from API

---

## 8. Missing / unverified

| Item | Status |
|---|---|
| Figma PNG color pick | **Not available** (104 files missing); tokens taken from code comments + CSS |
| Pixel diff vs Figma | **Not claimed** |
| Runtime dark/light screenshot pairs | **Partial** — login captured once (see `UI00_VISUAL_BASELINE.md`) |

---

## Acceptance (UI01)

- [ ] `apps/web` globals.css HSL values match this document byte-for-byte unless documented exception
- [ ] Tailwind config semantic colors match
- [ ] Inter weights loaded identically
- [ ] Sidebar/topbar dimensions match shell table above
