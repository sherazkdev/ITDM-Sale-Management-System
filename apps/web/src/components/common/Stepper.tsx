import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type Step = {
  label: string;
  description?: string;
};

type StepperProps = {
  steps: Step[];
  /** 0-indexed current step. */
  current: number;
  className?: string;
  /** Horizontal (default) or vertical. */
  orientation?: "horizontal" | "vertical";
};

export function Stepper({ steps, current, orientation = "horizontal", className }: StepperProps) {
  if (orientation === "vertical") {
    return (
      <ol className={cn("flex flex-col gap-6", className)}>
        {steps.map((step, i) => {
          const state = i < current ? "done" : i === current ? "current" : "todo";
          return (
            <li key={step.label} className="flex gap-3">
              <StepDot state={state} index={i} />
              <div className="min-w-0 pt-0.5">
                <p className={cn("text-sm font-medium", state === "current" ? "text-primary" : state === "done" ? "text-foreground" : "text-muted-foreground")}>
                  {step.label}
                </p>
                {step.description ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol className={cn("flex w-full items-start gap-2", className)}>
      {steps.map((step, i) => {
        const state = i < current ? "done" : i === current ? "current" : "todo";
        return (
          <li key={step.label} className="flex flex-1 items-start gap-2">
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <StepDot state={state} index={i} />
              <div className="text-center">
                <p className={cn("text-xs font-medium", state === "current" ? "text-primary" : state === "done" ? "text-foreground" : "text-muted-foreground")}>
                  {step.label}
                </p>
              </div>
            </div>
            {i < steps.length - 1 ? (
              <div
                className={cn(
                  "mt-4 h-px flex-1 transition-colors",
                  state === "done" ? "bg-primary" : "bg-border",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function StepDot({ state, index }: { state: "done" | "current" | "todo"; index: number }) {
  return (
    <span
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
        state === "done" && "border-primary bg-primary text-primary-foreground",
        state === "current" && "border-primary bg-primary text-primary-foreground shadow-pop",
        state === "todo" && "border-border bg-muted text-muted-foreground",
      )}
    >
      {state === "done" ? <Check className="h-4 w-4" /> : index + 1}
    </span>
  );
}
