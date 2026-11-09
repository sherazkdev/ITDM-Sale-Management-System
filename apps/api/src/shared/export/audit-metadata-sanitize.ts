/** Redact sensitive keys before audit metadata appears in CSV/XLSX/PDF exports. */
const SENSITIVE_KEY = /password|token|secret|authorization|cookie|credential/i;

export function sanitizeAuditMetadataForExport(metadata: unknown): string {
  if (metadata === null || metadata === undefined) return "";

  const walk = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(walk);
    if (value && typeof value === "object") {
      const out: Record<string, unknown> = {};
      for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
        out[key] = SENSITIVE_KEY.test(key) ? "[REDACTED]" : walk(child);
      }
      return out;
    }
    return value;
  };

  try {
    return JSON.stringify(walk(metadata));
  } catch {
    return "";
  }
}
