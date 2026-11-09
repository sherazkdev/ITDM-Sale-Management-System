"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type EntityIdentityTone = "brand" | "blue" | "green" | "amber" | "violet" | "neutral";

const TONE_STYLES: Record<EntityIdentityTone, string> = {
  brand: "bg-primary/10 text-primary ring-primary/20",
  blue: "bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-blue-500/20",
  green: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20",
  amber: "bg-amber-500/10 text-amber-800 dark:text-amber-200 ring-amber-500/20",
  violet: "bg-violet-500/10 text-violet-700 dark:text-violet-300 ring-violet-500/20",
  neutral: "bg-muted text-muted-foreground ring-border",
};

type EntityIdentityCellProps = {
  icon: LucideIcon;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  tone?: EntityIdentityTone;
  className?: string;
};

/** Premium list-row identity: icon tile + primary label + optional secondary line. */
export function EntityIdentityCell({
  icon: Icon,
  title,
  subtitle,
  meta,
  tone = "brand",
  className,
}: EntityIdentityCellProps) {
  return (
    <div className={cn("flex items-center gap-3 min-w-0", className)}>
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
          TONE_STYLES[tone],
        )}
        aria-hidden
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-medium text-foreground leading-snug truncate">{title}</div>
        {subtitle ? (
          <div className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</div>
        ) : null}
        {meta ? <div className="mt-1 flex flex-wrap items-center gap-1.5">{meta}</div> : null}
      </div>
    </div>
  );
}
