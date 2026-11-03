import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NativeSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  leftIcon?: React.ReactNode;
  error?: boolean;
}

/**
 * Styled native <select> that mirrors the Input control (bordered, optional
 * left icon, trailing chevron). Keeps native a11y + mobile behaviour.
 */
export const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, leftIcon, error, children, ...props }, ref) => {
    return (
      <div
        className={cn(
          "relative flex h-10 w-full items-center rounded-[8px] border border-[#E5E7EB] bg-card transition-colors",
          "focus-within:ring-2 focus-within:ring-ring focus-within:border-ring",
          error && "border-destructive focus-within:ring-destructive",
          className,
        )}
      >
        {leftIcon ? (
          <span className="pl-3 text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">{leftIcon}</span>
        ) : null}
        <select
          ref={ref}
          className={cn(
            "h-full w-full flex-1 cursor-pointer appearance-none bg-transparent pr-9 text-sm text-foreground focus:outline-none",
            leftIcon ? "pl-2.5" : "pl-3",
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    );
  },
);
NativeSelect.displayName = "NativeSelect";
