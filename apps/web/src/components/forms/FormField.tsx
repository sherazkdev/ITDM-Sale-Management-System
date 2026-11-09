"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  /** Contextual helper shown when there is no error. */
  hint?: string;
  /** Alias for `hint` (settings-style copy). */
  description?: string;
  children: React.ReactNode;
  className?: string;
  /** Show subtle success when touched + valid (no error). */
  valid?: boolean;
  maxLength?: number;
  currentLength?: number;
};

export function FormField({
  label,
  htmlFor,
  required,
  error,
  hint,
  description,
  children,
  className,
  valid,
  maxLength,
  currentLength,
}: FormFieldProps) {
  const helper = description ?? hint;
  const showCounter =
    maxLength != null && currentLength != null && maxLength > 0;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
          {required ? (
            <span className="text-destructive ml-0.5" aria-hidden>
              *
            </span>
          ) : null}
          {required ? <span className="sr-only"> (required)</span> : null}
        </Label>
        {showCounter ? (
          <span
            className={cn(
              "text-[11px] tabular-nums text-muted-foreground",
              currentLength! > maxLength! && "text-destructive",
            )}
            aria-live="polite"
          >
            {currentLength}/{maxLength}
          </span>
        ) : null}
      </div>
      {children}
      {helper && !error ? (
        <p className="text-xs text-muted-foreground leading-relaxed">{helper}</p>
      ) : null}
      {valid && !error ? (
        <p className="text-xs text-success sr-only">Field is valid</p>
      ) : null}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
