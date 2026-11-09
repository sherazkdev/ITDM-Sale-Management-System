/** Clarifies lifetime / as-of metrics that ignore activity-date dashboard filters. */
export function DashboardMetricScopeNote({ children }: { children: string }) {
  return <p className="text-[11px] leading-snug text-muted-foreground">{children}</p>;
}
