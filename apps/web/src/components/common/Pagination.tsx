"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DEFAULT_PAGE_SIZES = [10, 20, 50] as const;

type PaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  /** Omit to hide the page-size selector. */
  onPageSizeChange?: (size: number) => void;
  pageSizes?: readonly number[];
  /** Noun used in the range label, e.g. "leads". */
  itemLabel?: string;
  className?: string;
};

/** Build a compact page list with leading/trailing ellipsis. */
export function buildPageNumbers(current: number, totalPages: number): Array<number | "…"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: Array<number | "…"> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);
  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push("…");
  pages.push(totalPages);
  return pages;
}

/** Standardized pagination footer for list pages (matches Figma). */
export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizes = DEFAULT_PAGE_SIZES,
  itemLabel = "items",
  className,
}: PaginationProps) {
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);
  const pageNumbers = useMemo(() => buildPageNumbers(page, totalPages), [page, totalPages]);

  if (total === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 text-sm sm:flex-row sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
        <p className="text-muted-foreground">
          Showing <span className="font-medium text-foreground">{rangeStart}</span>–
          <span className="font-medium text-foreground">{rangeEnd}</span> of{" "}
          <span className="font-medium text-foreground">{total.toLocaleString()}</span> {itemLabel}
        </p>
        {onPageSizeChange ? (
          <label className="flex items-center gap-2 text-muted-foreground">
            Show
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-9 rounded-lg border border-input bg-card px-2 text-sm shadow-card focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Rows per page"
            >
              {pageSizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            entries
          </label>
        ) : null}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          disabled={page === 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {pageNumbers.map((n, i) =>
          n === "…" ? (
            <span key={`gap-${i}`} className="px-2 text-muted-foreground">
              …
            </span>
          ) : (
            <Button
              key={n}
              variant={n === page ? "default" : "outline"}
              size="icon"
              className={cn("h-9 w-9 tabular-nums", n === page && "bg-brand-gradient shadow-pop border-0")}
              onClick={() => onPageChange(n)}
              aria-current={n === page ? "page" : undefined}
            >
              {n}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
