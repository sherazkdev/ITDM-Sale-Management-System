import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type FormStep = { label: string; description?: string };

type FormStepperProps = {
  steps: FormStep[];
  /** 0-indexed current step. */
  current: number;
  className?: string;
};

/**
 * Numbered horizontal stepper (number + title/description + connector line),
 * matching the BizCRM create/edit flows. Labels collapse on small screens.
 */
export function FormStepper({ steps, current, className }: FormStepperProps) {
  return (
    <ol className={cn("flex w-full items-center", className)}>
      {steps.map((step, i) => {
        const state = i < current ? "done" : i === current ? "current" : "todo";
        const isLast = i === steps.length - 1;
        return (
          <li key={step.label} className={cn("flex items-center", !isLast && "flex-1")}>
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  state === "done" && "bg-brand-gradient text-primary-foreground",
                  state === "current" &&
                    "bg-brand-gradient text-primary-foreground shadow-pop ring-4 ring-primary/15",
                  state === "todo" && "bg-muted text-muted-foreground",
                )}
              >
                {state === "done" ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <div className="hidden min-w-0 md:block">
                <p
                  className={cn(
                    "text-sm font-semibold leading-tight",
                    state === "todo" ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {step.label}
                </p>
                {step.description ? (
                  <p className="mt-0.5 text-xs leading-tight text-muted-foreground">
                    {step.description}
                  </p>
                ) : null}
              </div>
            </div>
            {!isLast ? (
              <div
                className={cn(
                  "mx-2 h-px flex-1 min-w-[12px] sm:mx-3 transition-colors",
                  i < current ? "bg-primary" : "bg-border",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
