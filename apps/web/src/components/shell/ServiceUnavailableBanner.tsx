import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type ServiceUnavailableBannerProps = {
  className?: string;
  compact?: boolean;
};

/** Shown when the ITDMS API cannot be reached — does not expose protected data. */
export function ServiceUnavailableBanner({ className, compact }: ServiceUnavailableBannerProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive",
        className,
      )}
    >
      <AlertTriangle className={cn("shrink-0", compact ? "h-4 w-4 mt-0.5" : "h-5 w-5 mt-0.5")} />
      <div>
        <p className="font-medium">ITDMS API unavailable</p>
        <p className={cn("mt-0.5 opacity-90", compact ? "text-xs" : "text-sm")}>
          Cannot reach the backend. Start the Express API (port 3000) and PostgreSQL, then refresh. You are not
          signed in until the API responds.
        </p>
      </div>
    </div>
  );
}
