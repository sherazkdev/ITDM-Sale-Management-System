"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ActiveFilterChips, type ActiveFilterChip } from "@/components/common/ActiveFilterChips";
import { cn } from "@/lib/utils";

type ListToolbarProps = {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  /** When false, omits the search field (API has no list search). */
  showSearch?: boolean;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  /** Active filter chips shown below the search row. */
  activeFilterChips?: ActiveFilterChip[];
  onResetFilters?: () => void;
  className?: string;
};

export function ListToolbar({
  search = "",
  onSearchChange,
  searchPlaceholder = "Search…",
  showSearch = true,
  filters,
  actions,
  activeFilterChips,
  onResetFilters,
  className,
}: ListToolbarProps) {
  return (
    <div className={cn("list-toolbar-panel space-y-3", className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        {showSearch ? (
          <div className="relative w-full min-w-0 flex-1 max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 pl-9"
              aria-label="Search"
            />
          </div>
        ) : null}
        {filters}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <ActiveFilterChips chips={activeFilterChips ?? []} onResetAll={onResetFilters} />
    </div>
  );
}
