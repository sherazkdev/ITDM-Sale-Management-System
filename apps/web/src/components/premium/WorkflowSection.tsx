import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type WorkflowSectionProps = {
  title: string;
  description?: string;
  step?: string;
  children: ReactNode;
  className?: string;
};

/** Operational form sections (issuance, returns, multi-step flows). */
export function WorkflowSection({ title, description, step, children, className }: WorkflowSectionProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-card md:p-6",
        className,
      )}
    >
      <div className="mb-5 flex flex-col gap-1 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {step ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary/90">{step}</p>
          ) : null}
          <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}
