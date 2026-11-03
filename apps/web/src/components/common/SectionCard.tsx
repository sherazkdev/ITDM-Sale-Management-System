import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SectionCardProps = {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  /** When true, content area has no padding (good for tables). */
  flush?: boolean;
  className?: string;
  children: ReactNode;
};

export function SectionCard({ title, description, action, flush, className, children }: SectionCardProps) {
  const hasHeader = !!title || !!description || !!action;
  return (
    <Card className={cn("overflow-hidden", className)}>
      {hasHeader ? (
        <CardHeader className={cn("flex flex-row items-start justify-between gap-3 pb-3 border-b border-border", flush && "border-b-0 pb-6")}>
          <div className="min-w-0">
            {title ? <CardTitle>{title}</CardTitle> : null}
            {description ? (
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {action ? <div className="flex-shrink-0">{action}</div> : null}
        </CardHeader>
      ) : null}
      <CardContent className={cn(flush ? "p-0" : "pt-4")}>{children}</CardContent>
    </Card>
  );
}
