"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ActiveFilterChip = {
  id: string;
  label: string;
  onRemove: () => void;
};

type ActiveFilterChipsProps = {
  chips: ActiveFilterChip[];
  onResetAll?: () => void;
  className?: string;
};

export function ActiveFilterChips({ chips, onResetAll, className }: ActiveFilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-2",
        className,
      )}
      aria-live="polite"
    >
      <span className="text-xs font-medium text-muted-foreground">
        {chips.length} active filter{chips.length === 1 ? "" : "s"}
      </span>
      {chips.map((chip) => (
        <Badge key={chip.id} variant="secondary" className="gap-1 pr-1 font-normal text-xs">
          {chip.label}
          <button
            type="button"
            className="rounded-sm p-0.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={chip.onRemove}
            aria-label={`Remove filter ${chip.label}`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {onResetAll ? (
        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs ml-auto" onClick={onResetAll}>
          Reset filters
        </Button>
      ) : null}
    </div>
  );
}
