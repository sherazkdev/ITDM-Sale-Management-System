import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

type QuickTipProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
  variant?: "tip" | "info" | "warning";
};

const VARIANT_STYLES = {
  tip: "bg-primary/5 text-foreground",
  info: "bg-info-soft text-info-softFg",
  warning: "bg-warning-soft text-warning-softFg",
} as const;

const VARIANT_ICON_STYLES = {
  tip: "bg-primary/10 text-primary",
  info: "bg-info/15 text-info",
  warning: "bg-warning/15 text-warning",
} as const;

export function QuickTip({
  title = "Quick Tip",
  children,
  className,
  variant = "tip",
}: QuickTipProps) {
  return (
    <div className={cn("flex items-start gap-3 rounded-xl p-4", VARIANT_STYLES[variant], className)}>
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", VARIANT_ICON_STYLES[variant])}>
        <Lightbulb className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <div className="mt-0.5 text-sm text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
