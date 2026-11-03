import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FilterSelect } from "@/components/common/FilterSelect";

type DataTableToolbarProps = {
  rangeLabel: string;
  sortValue?: string;
  onSortChange?: (value: string) => void;
  sortOptions?: { value: string; label: string }[];
  view?: "list" | "grid";
  onViewChange?: (view: "list" | "grid") => void;
  className?: string;
  trailing?: React.ReactNode;
};

/** Table meta row above DataTable — matches Figma list screens. */
export function DataTableToolbar({
  rangeLabel,
  sortValue = "recent",
  onSortChange,
  sortOptions = [
    { value: "recent", label: "Recently Added" },
    { value: "name", label: "Name" },
    { value: "score", label: "Score" },
  ],
  view = "list",
  onViewChange,
  className,
  trailing,
}: DataTableToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b border-border bg-muted/20",
        className,
      )}
    >
      <p className="text-sm text-muted-foreground">{rangeLabel}</p>
      <div className="flex flex-wrap items-center gap-2">
        {onSortChange ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground whitespace-nowrap">Sort by:</span>
            <FilterSelect
              value={sortValue}
              onChange={onSortChange}
              options={sortOptions}
              placeholder="Sort"
              className="min-w-[140px]"
              aria-label="Sort table"
            />
          </div>
        ) : null}
        {onViewChange ? (
          <div className="inline-flex rounded-lg border border-input bg-card p-0.5">
            <Button
              type="button"
              variant={view === "list" ? "soft" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => onViewChange("list")}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={view === "grid" ? "soft" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => onViewChange("grid")}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
        {trailing}
      </div>
    </div>
  );
}
