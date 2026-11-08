/** Discrete palette for custom-role badges + swatches (matches API ROLE_COLORS). */
export const ROLE_SWATCHES: Array<{ id: string; label: string; hsl: string }> = [
  { id: "violet", label: "Violet", hsl: "245 78% 62%" },
  { id: "blue", label: "Blue", hsl: "212 90% 55%" },
  { id: "cyan", label: "Cyan", hsl: "190 85% 45%" },
  { id: "teal", label: "Teal", hsl: "175 70% 42%" },
  { id: "green", label: "Green", hsl: "152 60% 42%" },
  { id: "amber", label: "Amber", hsl: "38 92% 50%" },
  { id: "orange", label: "Orange", hsl: "24 90% 55%" },
  { id: "rose", label: "Rose", hsl: "0 80% 60%" },
  { id: "fuchsia", label: "Fuchsia", hsl: "289 80% 60%" },
  { id: "slate", label: "Slate", hsl: "215 25% 40%" },
];

const SWATCH_MAP: Record<string, string> = Object.fromEntries(
  ROLE_SWATCHES.map((c) => [c.id, c.hsl]),
);

export function roleColorHsl(id: string | null | undefined): string {
  return (id && SWATCH_MAP[id]) || "245 78% 62%";
}
