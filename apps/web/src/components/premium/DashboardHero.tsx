import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type DashboardHeroProps = {
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
};

export function DashboardHero({ title, description, actions, className }: DashboardHeroProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border/80 bg-card px-6 py-6 shadow-soft md:px-8 md:py-7",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-primary/[0.07] blur-3xl dark:bg-primary/12"
        aria-hidden
      />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Overview</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-[15px]">{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div> : null}
      </div>
    </div>
  );
}
