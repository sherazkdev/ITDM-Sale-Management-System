/** Human-readable audit action from API fields — no invented events. */
export function formatAuditActivityLine(action: string, targetType?: string | null): string {
  const normalized = action
    .trim()
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ");
  const titled = normalized.replace(/\b\w/g, (c) => c.toUpperCase());
  if (targetType) {
    const target = targetType.replace(/_/g, " ").toLowerCase();
    return `${titled} · ${target}`;
  }
  return titled;
}
