import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type Breadcrumb = { label: string; href?: string };

type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  eyebrow?: string;
  /** Action buttons aligned to the right. */
  actions?: React.ReactNode;
  className?: string;
  variant?: "standard" | "premium";
};

export function PageHeader({
  title,
  description,
  breadcrumbs,
  eyebrow,
  actions,
  className,
  variant = "premium",
}: PageHeaderProps) {
  if (variant === "premium") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-border/80 bg-card px-6 py-6 shadow-soft md:px-8 md:py-7",
          className,
        )}
      >
        <div
          className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-primary/[0.06] blur-3xl dark:bg-primary/12"
          aria-hidden
        />
        <header className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            {breadcrumbs && breadcrumbs.length > 0 ? (
              <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                {breadcrumbs.map((crumb, i) => {
                  const last = i === breadcrumbs.length - 1;
                  return (
                    <span key={`${crumb.label}-${i}`} className="flex items-center gap-1">
                      {crumb.href && !last ? (
                        <Link href={crumb.href} className="hover:text-foreground">
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className={last ? "text-foreground" : ""}>{crumb.label}</span>
                      )}
                      {!last ? <ChevronRight className="h-3.5 w-3.5" /> : null}
                    </span>
                  );
                })}
              </nav>
            ) : null}
            {eyebrow ? (
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>
            ) : null}
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-[1.65rem]">{title}</h1>
            {description ? (
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div> : null}
        </header>
      </div>
    );
  }

  return (
    <header className={cn("flex flex-col gap-3 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
            {breadcrumbs.map((crumb, i) => {
              const last = i === breadcrumbs.length - 1;
              return (
                <span key={`${crumb.label}-${i}`} className="flex items-center gap-1">
                  {crumb.href && !last ? (
                    <Link href={crumb.href} className="hover:text-foreground">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={last ? "text-foreground" : ""}>{crumb.label}</span>
                  )}
                  {!last ? <ChevronRight className="h-3.5 w-3.5" /> : null}
                </span>
              );
            })}
          </nav>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2 flex-shrink-0">{actions}</div> : null}
    </header>
  );
}
