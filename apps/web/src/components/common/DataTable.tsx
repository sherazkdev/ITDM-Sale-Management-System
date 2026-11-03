"use client";

import { type ReactNode, useState, useMemo } from "react";
import { ChevronDown, ChevronsUpDown, ChevronUp, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export type Column<T> = {
  key: string;
  /** Column header text. */
  header: ReactNode;
  /** Render the cell. Default renders `String(row[key])`. */
  cell?: (row: T) => ReactNode;
  /** Enable sorting on this column. */
  sortable?: boolean;
  /** Make sorting key different from cell key. */
  sortKey?: (row: T) => string | number;
  /** Override width / alignment. */
  className?: string;
  /** Header text-align. Cell inherits unless overridden via cell render. */
  align?: "left" | "right" | "center";
  /** Don't render on small screens. */
  hideOnMobile?: boolean;
};

type SortDir = "asc" | "desc" | null;

type DataTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  /** Pulls a stable id off each row. */
  getRowId: (row: T) => string;
  loading?: boolean;
  /** Number of skeleton rows to show while loading. */
  skeletonRows?: number;
  /** Click handler for whole-row navigation. */
  onRowClick?: (row: T) => void;
  /** Empty-state slot. */
  empty?: ReactNode;
  /** Render a per-row action menu. */
  rowActions?: (row: T) => ReactNode;
  className?: string;
};

export function DataTable<T>({
  data,
  columns,
  getRowId,
  loading,
  skeletonRows = 6,
  onRowClick,
  empty,
  rowActions,
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return data;
    const getValue = (row: T): string | number => {
      if (col.sortKey) return col.sortKey(row);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const v = (row as any)[sortKey];
      if (typeof v === "number") return v;
      return String(v ?? "");
    };
    return [...data].sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortDir, columns]);

  const handleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortDir(null);
      setSortKey(null);
    }
  };

  return (
    <div className={cn("w-full min-w-0 rounded-xl border border-border bg-card shadow-card overflow-hidden", className)}>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-muted/50 border-b border-border">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    "px-4 py-3.5 font-semibold",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    col.hideOnMobile && "hidden md:table-cell",
                    col.className,
                  )}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                      aria-label={`Sort by ${typeof col.header === "string" ? col.header : col.key}`}
                    >
                      {col.header}
                      {sortKey === col.key && sortDir === "asc" ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : sortKey === col.key && sortDir === "desc" ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 opacity-50" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
              {rowActions ? <th className="w-12 px-2" aria-label="Actions" /> : null}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={i} className="border-t border-border">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn("px-4 py-3", col.hideOnMobile && "hidden md:table-cell")}
                    >
                      <Skeleton className="h-4 w-3/4" />
                    </td>
                  ))}
                  {rowActions ? <td className="px-2"><Skeleton className="h-4 w-4 mx-auto" /></td> : null}
                </tr>
              ))
            ) : sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (rowActions ? 1 : 0)}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  {empty ?? "No data to display."}
                </td>
              </tr>
            ) : (
              sortedData.map((row) => {
                const id = getRowId(row);
                return (
                  <tr
                    key={id}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      "border-t border-border transition-colors",
                      onRowClick && "cursor-pointer hover:bg-muted/50 active:bg-muted/60",
                    )}
                  >
                    {columns.map((col) => {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const value = col.cell ? col.cell(row) : (row as any)[col.key];
                      return (
                        <td
                          key={col.key}
                          className={cn(
                            "px-4 py-3.5 align-middle",
                            col.align === "right" && "text-right",
                            col.align === "center" && "text-center",
                            col.hideOnMobile && "hidden md:table-cell",
                          )}
                        >
                          {value as ReactNode}
                        </td>
                      );
                    })}
                    {rowActions ? (
                      <td className="px-2 text-right" onClick={(e) => e.stopPropagation()}>
                        {rowActions(row) ?? (
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Row actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
