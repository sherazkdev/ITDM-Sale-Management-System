/** Commercial units for non-asset stock (client Wave 1). */
export const UNITS_OF_MEASURE = [
  "EACH",
  "FEET",
  "KILOGRAM",
  "METER",
  "LITER",
  "BOX",
  "PACK",
  "OTHER",
] as const;

export type UnitOfMeasure = (typeof UNITS_OF_MEASURE)[number];

export function isUnitOfMeasure(value: string): value is UnitOfMeasure {
  return (UNITS_OF_MEASURE as readonly string[]).includes(value);
}

export function normalizeStockCode(raw: string): string {
  return raw.trim().toUpperCase();
}
