import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", leftIcon, rightIcon, error, ...props }, ref) => {
    if (!leftIcon && !rightIcon) {
      return (
        <input
          ref={ref}
          type={type}
          className={cn(
            "flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-card transition-colors",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus-visible:ring-destructive",
            className,
          )}
          {...props}
        />
      );
    }
    return (
      <div
        className={cn(
          "flex h-10 w-full items-center rounded-lg border border-input bg-card shadow-card transition-colors",
          "focus-within:ring-2 focus-within:ring-ring focus-within:border-ring",
          error && "border-destructive focus-within:ring-destructive",
          className,
        )}
      >
        {leftIcon ? (
          <span className="pl-3 text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">{leftIcon}</span>
        ) : null}
        <input
          ref={ref}
          type={type}
          className="h-full flex-1 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none"
          {...props}
        />
        {rightIcon ? (
          <span className="pr-3 text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">{rightIcon}</span>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";
