"use client";

import { cn } from "@/lib/utils";

type DetailRecordLayoutProps = {
  children: React.ReactNode;
  /** Optional ~320px rail — status, holder, workflow summary (CRM detail pattern) */
  aside?: React.ReactNode;
  className?: string;
};

/** CRM-aligned detail page grid — mirrors `CreateFormLayout` / CRM customer detail columns. */
export function DetailRecordLayout({ children, aside, className }: DetailRecordLayoutProps) {
  if (!aside) {
    return <div className={cn("flex flex-col gap-6", className)}>{children}</div>;
  }

  return (
    <div className={cn("grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]", className)}>
      <div className="flex min-w-0 flex-col gap-6">{children}</div>
      <div className="flex min-w-0 flex-col gap-4 lg:max-w-[320px]">{aside}</div>
    </div>
  );
}

type RecordOverviewCardProps = {
  children: React.ReactNode;
  className?: string;
};

/** Hero summary card below `PageHeader` on record detail pages. */
export function RecordOverviewCard({ children, className }: RecordOverviewCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-6 shadow-card",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
    </div>
  );
}
