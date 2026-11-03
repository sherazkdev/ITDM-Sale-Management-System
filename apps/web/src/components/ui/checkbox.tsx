"use client";

import * as React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  indeterminate?: boolean;
  label?: React.ReactNode;
};

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, indeterminate, label, id, ...props }, ref) => {
    const internalRef = React.useRef<HTMLInputElement | null>(null);
    React.useImperativeHandle(ref, () => internalRef.current as HTMLInputElement);
    React.useEffect(() => {
      if (internalRef.current) internalRef.current.indeterminate = !!indeterminate;
    }, [indeterminate]);

    const generatedId = React.useId();
    const checkboxId = id ?? generatedId;

    const node = (
      <span className={cn("relative inline-flex h-4 w-4 items-center justify-center", className)}>
        <input
          ref={internalRef}
          id={checkboxId}
          type="checkbox"
          className="peer absolute inset-0 h-full w-full cursor-pointer appearance-none rounded border border-input bg-card transition-colors checked:bg-primary checked:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          {...props}
        />
        {indeterminate ? (
          <Minus className="pointer-events-none h-3 w-3 text-primary-foreground" />
        ) : (
          <Check className="pointer-events-none h-3 w-3 text-primary-foreground opacity-0 peer-checked:opacity-100" />
        )}
      </span>
    );

    if (!label) return node;
    return (
      <label htmlFor={checkboxId} className="flex cursor-pointer items-start gap-2.5 select-none">
        {node}
        <span className="min-w-0 flex-1 text-sm leading-snug">{label}</span>
      </label>
    );
  },
);
Checkbox.displayName = "Checkbox";
