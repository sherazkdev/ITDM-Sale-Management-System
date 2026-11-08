/**
 * Client-safe color palette for ITDMS brand theming (ported from CRM `theme-palette.ts`).
 * Default primary preset is **rose** (ORLEN corporate red).
 */

export type ColorPreset = {
  id: string;
  label: string;
  hue: number;
  sat: number;
  /** Representative hex for API `themePreferences.colors` sync. */
  hex: string;
};

export const THEME_PRESETS: ColorPreset[] = [
  { id: "rose", label: "Rose (ORLEN)", hue: 357, sat: 93, hex: "#E30613" },
  { id: "violet", label: "Violet", hue: 245, sat: 78, hex: "#6366F1" },
  { id: "indigo", label: "Indigo", hue: 230, sat: 70, hex: "#4F46E5" },
  { id: "blue", label: "Blue", hue: 212, sat: 85, hex: "#2563EB" },
  { id: "cyan", label: "Cyan", hue: 190, sat: 80, hex: "#0891B2" },
  { id: "teal", label: "Teal", hue: 175, sat: 65, hex: "#0D9488" },
  { id: "green", label: "Green", hue: 152, sat: 58, hex: "#16A34A" },
  { id: "amber", label: "Amber", hue: 38, sat: 88, hex: "#F59E0B" },
  { id: "orange", label: "Orange", hue: 24, sat: 88, hex: "#EA580C" },
  { id: "fuchsia", label: "Fuchsia", hue: 289, sat: 78, hex: "#C026D3" },
  { id: "slate", label: "Slate", hue: 215, sat: 25, hex: "#64748B" },
];

export type ThemeChannel = "primary" | "secondary" | "accent";
export type ThemeColors = Record<ThemeChannel, string>;

export const DEFAULT_COLORS: ThemeColors = {
  primary: "rose",
  secondary: "rose",
  accent: "rose",
};

export function getPreset(id: string): ColorPreset {
  return THEME_PRESETS.find((p) => p.id === id) ?? THEME_PRESETS[0]!;
}

export function presetSwatch(id: string): string {
  const p = getPreset(id);
  return `${p.hue} ${p.sat}% 55%`;
}

export function presetToHex(id: string): string {
  return getPreset(id).hex;
}

export function hexToPresetId(hex: string | undefined): string | null {
  if (!hex) return null;
  const norm = hex.trim().toUpperCase();
  const match = THEME_PRESETS.find((p) => p.hex.toUpperCase() === norm);
  return match?.id ?? null;
}

export function buildColorVars(colors: ThemeColors, mode: "light" | "dark"): Record<string, string> {
  const p = getPreset(colors.primary);
  const s = getPreset(colors.secondary);
  const a = getPreset(colors.accent);

  const gradientToHue = (p.hue + 18) % 360;
  const gradientToSat = Math.max(p.sat - 8, 45);

  if (mode === "dark") {
    return {
      "--primary": `${p.hue} ${p.sat}% 68%`,
      "--ring": `${p.hue} ${p.sat}% 68%`,
      "--brand-gradient-to": `${gradientToHue} ${gradientToSat}% 64%`,
      "--secondary": `${s.hue} 25% 16%`,
      "--secondary-foreground": "220 14% 95%",
      "--accent": `${a.hue} 40% 20%`,
      "--accent-foreground": "220 14% 95%",
      "--sidebar-accent": `${a.hue} 40% 24%`,
      "--sidebar-accent-foreground": "220 14% 95%",
    };
  }

  return {
    "--primary": `${p.hue} ${p.sat}% 62%`,
    "--ring": `${p.hue} ${p.sat}% 62%`,
    "--brand-gradient-to": `${gradientToHue} ${gradientToSat}% 60%`,
    "--secondary": `${s.hue} 30% 96%`,
    "--secondary-foreground": `${s.hue} 50% 32%`,
    "--accent": `${a.hue} 100% 97%`,
    "--accent-foreground": `${a.hue} 60% 30%`,
    "--sidebar-accent": `${a.hue} 100% 97%`,
    "--sidebar-accent-foreground": `${p.hue} ${p.sat}% 50%`,
  };
}

export const MANAGED_VARS = [
  "--primary",
  "--ring",
  "--brand-gradient-to",
  "--secondary",
  "--secondary-foreground",
  "--accent",
  "--accent-foreground",
  "--sidebar-accent",
  "--sidebar-accent-foreground",
] as const;
