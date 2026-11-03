import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * A unified status pill with semantic color mapping derived from the mockups:
 *   - active / completed / won / verified  → success (green)
 *   - new / scheduled / info               → info (blue)
 *   - in-progress / negotiation / due      → warning (amber)
 *   - overdue / lost / inactive / failed   → destructive (red)
 *   - qualification / proposal / default   → primary (violet)
 *   - neutral / draft                      → neutral (gray)
 *
 * Variant is auto-derived if you only pass `status`, or override with `variant`.
 */
export type StatusKind =
  | "active"
  | "inactive"
  | "completed"
  | "won"
  | "lost"
  | "new"
  | "scheduled"
  | "in_progress"
  | "due_today"
  | "overdue"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "draft"
  | "paid"
  | "refunded"
  | "verified"
  | "pending"
  | "high_priority"
  | "medium_priority"
  | "low_priority";

const MAP: Record<StatusKind, { label: string; variant: "success" | "warning" | "destructive" | "info" | "default" | "neutral" }> = {
  active:          { label: "Active", variant: "success" },
  inactive:        { label: "Inactive", variant: "neutral" },
  completed:       { label: "Completed", variant: "success" },
  won:             { label: "Won", variant: "success" },
  lost:            { label: "Lost", variant: "destructive" },
  new:             { label: "New", variant: "info" },
  scheduled:       { label: "Scheduled", variant: "info" },
  in_progress:     { label: "In Progress", variant: "warning" },
  due_today:       { label: "Due Today", variant: "warning" },
  overdue:         { label: "Overdue", variant: "destructive" },
  qualified:       { label: "Qualified", variant: "success" },
  proposal:        { label: "Proposal", variant: "default" },
  negotiation:     { label: "Negotiation", variant: "warning" },
  draft:           { label: "Draft", variant: "neutral" },
  paid:            { label: "Paid", variant: "success" },
  refunded:        { label: "Refunded", variant: "neutral" },
  verified:        { label: "Verified", variant: "success" },
  pending:         { label: "Pending", variant: "warning" },
  high_priority:   { label: "High", variant: "destructive" },
  medium_priority: { label: "Medium", variant: "warning" },
  low_priority:    { label: "Low", variant: "success" },
};

type StatusPillProps = {
  status: StatusKind;
  /** Override the auto label. */
  label?: string;
  className?: string;
  /** Show a leading colored dot. */
  dot?: boolean;
};

export function StatusPill({ status, label, className, dot }: StatusPillProps) {
  const meta = MAP[status];
  return (
    <Badge variant={meta.variant} className={cn("gap-1.5", className)}>
      {dot ? (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            meta.variant === "success" && "bg-success",
            meta.variant === "warning" && "bg-warning",
            meta.variant === "destructive" && "bg-destructive",
            meta.variant === "info" && "bg-info",
            meta.variant === "default" && "bg-primary",
            meta.variant === "neutral" && "bg-muted-foreground",
          )}
        />
      ) : null}
      {label ?? meta.label}
    </Badge>
  );
}
