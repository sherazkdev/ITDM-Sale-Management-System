import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn, formatCompact } from "@/lib/utils";
import { Card } from "@/components/ui/card";

type KpiCardProps = {
  label: string;
  value: number | string;
  /** Optional change vs previous period. */
  change?: { value: number; label?: string };
  icon?: LucideIcon;
  /** Color treatment for the icon disc. Maps to the BizCRM tinted-disc system. */
  tone?: "violet" | "green" | "blue" | "amber" | "rose" | "neutral";
  className?: string;
  href?: string;
  density?: "default" | "compact";
  /** Optional sparkline (recharts). Drawn full-width across the bottom of the card. */
  sparkline?: React.ReactNode;
};

export function KpiCard({
  label,
  value,
  change,
  icon: Icon,
  className,
  href,
  sparkline,
  density = "default",
}: KpiCardProps) {
  const formatted =
    typeof value === "number" ? formatCompact(value) : value;
  const isPositive = change && change.value >= 0;
  const ChangeArrow = isPositive ? ArrowUpRight : ArrowDownRight;

  const body = (
    <Card
      className={cn(
        density === "compact" ? "p-4" : "p-5",
        "min-h-[104px]",
        href && "hover:shadow-soft hover:border-primary/20",
        className,
      )}
    >
      <div className="flex items-start gap-3.5">
        {Icon ? (
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug text-muted-foreground line-clamp-2">{label}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight tabular md:text-[1.65rem]">{formatted}</span>
            {change ? (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-medium",
                  isPositive ? "text-success" : "text-destructive",
                )}
              >
                <ChangeArrow className="h-3.5 w-3.5" />
                {Math.abs(change.value)}%
              </span>
            ) : null}
          </div>
          {change?.label ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{change.label}</p>
          ) : null}
        </div>
      </div>
      {sparkline ? <div className="mt-3 -mx-1">{sparkline}</div> : null}
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {body}
      </Link>
    );
  }

  return body;
}
