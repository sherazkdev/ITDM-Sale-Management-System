"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EntityIdentityCellProps = {
  icon: LucideIcon;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  /** Kept for call-site compatibility. List icons are always neutral. */
  tone?: string;
  className?: string;
};

/** List-row identity: plain icon, title, optional secondary line. */
export function EntityIdentityCell({
  icon: Icon,
  title,
  subtitle,
  meta,
  className,
}: EntityIdentityCellProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium leading-snug text-foreground">{title}</div>
        {subtitle ? (
          <div className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</div>
        ) : null}
        {meta ? <div className="mt-1 flex flex-wrap items-center gap-1.5">{meta}</div> : null}
      </div>
    </div>
  );
}
