"use client";

import { type ReactNode, useState, useMemo, useCallback, useRef, useEffect } from "react";
import { ChevronDown, ChevronsUpDown, ChevronUp, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { DataTableColumnMenu } from "@/components/common/DataTableColumnMenu";
import { useDataTableColumnPrefs } from "@/lib/hooks/use-data-table-column-prefs";

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
  /** Server/API sort field when sortMode is server (defaults to key). */
  serverSortKey?: string;
  /** Override width / alignment. */
  className?: string;
  /** Header text-align. Cell inherits unless overridden via cell render. */
  align?: "left" | "right" | "center";
  /** Don't render on small screens. */
  hideOnMobile?: boolean;
  /** Prevent hiding via column menu. */
  alwaysVisible?: boolean;
};

type SortDir = "asc" | "desc";

export type DataTableSortMode = "client" | "server" | "off";

export type ServerSortProps = {
  sortBy: string;
  sortDir: SortDir;
};

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
  /** client: sort loaded rows; server: emits onServerSortChange; off: headers not sortable */
  sortMode?: DataTableSortMode;
  serverSort?: ServerSortProps;
  onServerSortChange?: (sortBy: string | null, sortDir: SortDir | null) => void;
  /** Restrict visible columns (from column prefs). */
  visibleColumnKeys?: string[];
  /** Caption for screen readers */
  caption?: string;
  /** Enables column visibility/order preferences (localStorage). */
  tableId?: string;
  columnMenuTrailing?: ReactNode;
};

function nextClientSort(
  currentKey: string | null,
  currentDir: SortDir | null,
  key: string,
): { key: string | null; dir: SortDir | null } {
  if (currentKey !== key) return { key, dir: "asc" };
  if (currentDir === "asc") return { key, dir: "desc" };
  return { key: null, dir: null };
}

function nextServerSort(
  current: ServerSortProps | undefined,
  col: Column<unknown>,
): { sortBy: string | null; sortDir: SortDir | null } {
  const field = col.serverSortKey ?? col.key;
  if (!current || current.sortBy !== field) return { sortBy: field, sortDir: "asc" };
  if (current.sortDir === "asc") return { sortBy: field, sortDir: "desc" };
  return { sortBy: null, sortDir: null };
}

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
  sortMode = "client",
  serverSort,
  onServerSortChange,
  visibleColumnKeys,
  caption,
  tableId,
  columnMenuTrailing,
}: DataTableProps<T>) {
  const columnKeys = columns.map((c) => c.key);
  const columnPrefs = useDataTableColumnPrefs(tableId, columnKeys);
  const [clientSortKey, setClientSortKey] = useState<string | null>(null);
  const [clientSortDir, setClientSortDir] = useState<SortDir | null>(null);
  const [focusedRowIndex, setFocusedRowIndex] = useState(0);
  const tableRef = useRef<HTMLTableElement>(null);

  const resolvedVisibleKeys = tableId
    ? columnPrefs.visibleKeys
    : visibleColumnKeys?.length
      ? visibleColumnKeys
      : columns.map((c) => c.key);

  const displayColumns = useMemo(() => {
    return resolvedVisibleKeys
      .map((key) => columns.find((c) => c.key === key))
      .filter((c): c is Column<T> => Boolean(c));
  }, [columns, resolvedVisibleKeys]);

  const sortedData = useMemo(() => {
    if (sortMode !== "client") return data;
    if (!clientSortKey || !clientSortDir) return data;
    const col = columns.find((c) => c.key === clientSortKey);
    if (!col) return data;
    const getValue = (row: T): string | number => {
      if (col.sortKey) return col.sortKey(row);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const v = (row as any)[clientSortKey];
      if (typeof v === "number") return v;
      return String(v ?? "");
    };
    return [...data].sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);
      if (va < vb) return clientSortDir === "asc" ? -1 : 1;
      if (va > vb) return clientSortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, clientSortKey, clientSortDir, columns, sortMode]);

  useEffect(() => {
    if (focusedRowIndex >= sortedData.length) setFocusedRowIndex(Math.max(0, sortedData.length - 1));
  }, [focusedRowIndex, sortedData.length]);

  const handleSortClick = useCallback(
    (col: Column<T>) => {
      if (sortMode === "off" || !col.sortable) return;
      if (sortMode === "server") {
        const next = nextServerSort(serverSort, col as Column<unknown>);
        onServerSortChange?.(next.sortBy, next.sortDir);
        return;
      }
      const next = nextClientSort(clientSortKey, clientSortDir, col.key);
      setClientSortKey(next.key);
      setClientSortDir(next.dir);
    },
    [sortMode, serverSort, onServerSortChange, clientSortKey, clientSortDir],
  );

  const getSortState = (col: Column<T>): SortDir | null => {
    if (sortMode === "server" && serverSort) {
      const field = col.serverSortKey ?? col.key;
      if (serverSort.sortBy === field) return serverSort.sortDir;
      return null;
    }
    if (sortMode === "client" && clientSortKey === col.key) return clientSortDir;
    return null;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!sortedData.length || loading) return;
  const rows = sortedData;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedRowIndex((i) => Math.min(rows.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedRowIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setFocusedRowIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setFocusedRowIndex(rows.length - 1);
    } else if ((e.key === "Enter" || e.key === " ") && onRowClick) {
      e.preventDefault();
      const row = rows[focusedRowIndex];
      if (row) onRowClick(row);
    }
  };

  const colSpan = displayColumns.length + (rowActions ? 1 : 0);

  return (
    <div
      className={cn(
        "w-full min-w-0 rounded-xl border border-border bg-card shadow-card overflow-hidden",
        className,
      )}
    >
      {tableId ? (
        <div className="flex flex-wrap items-center justify-end gap-2 border-b border-border px-3 py-2">
          <DataTableColumnMenu
            tableId={tableId}
            columns={columns}
            hiddenKeys={columnPrefs.prefs.hidden}
            columnOrder={columnPrefs.prefs.order}
            onToggle={columnPrefs.toggleColumn}
            onMove={columnPrefs.moveColumn}
            onReset={columnPrefs.reset}
          />
          {columnMenuTrailing}
        </div>
      ) : null}
      <div className="w-full max-w-full overflow-x-auto overscroll-x-contain">
        <table
          ref={tableRef}
          className="w-full min-w-[640px] text-sm border-collapse"
          role="grid"
          aria-rowcount={loading ? skeletonRows : sortedData.length}
          onKeyDown={onKeyDown}
        >
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead className="bg-muted/50 border-b border-border sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-muted/80">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {displayColumns.map((col) => {
                const dir = getSortState(col);
                const sortable = sortMode !== "off" && col.sortable;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={
                      sortable && dir
                        ? dir === "asc"
                          ? "ascending"
                          : "descending"
                        : sortable
                          ? "none"
                          : undefined
                    }
                    className={cn(
                      "px-4 py-3.5 font-semibold whitespace-nowrap",
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center",
                      col.hideOnMobile && "hidden md:table-cell",
                      col.className,
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSortClick(col)}
                        className="inline-flex items-center gap-1 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                        aria-label={`Sort by ${typeof col.header === "string" ? col.header : col.key}`}
                      >
                        {col.header}
                        {dir === "asc" ? (
                          <ChevronUp className="h-3 w-3" aria-hidden />
                        ) : dir === "desc" ? (
                          <ChevronDown className="h-3 w-3" aria-hidden />
                        ) : (
                          <ChevronsUpDown className="h-3 w-3 opacity-50" aria-hidden />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
              {rowActions ? <th className="w-12 px-2 sticky right-0 bg-muted/80" scope="col" aria-label="Actions" /> : null}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={i} className="border-t border-border">
                  {displayColumns.map((col) => (
                    <td
                      key={col.key}
                      className={cn("px-4 py-3", col.hideOnMobile && "hidden md:table-cell")}
                    >
                      <Skeleton className="h-4 w-3/4" />
                    </td>
                  ))}
                  {rowActions ? (
                    <td className="px-2">
                      <Skeleton className="h-4 w-4 mx-auto" />
                    </td>
                  ) : null}
                </tr>
              ))
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  {empty ?? "No data to display."}
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIndex) => {
                const id = getRowId(row);
                const focused = rowIndex === focusedRowIndex;
                return (
                  <tr
                    key={id}
                    tabIndex={focused ? 0 : -1}
                    data-row-index={rowIndex}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onFocus={() => setFocusedRowIndex(rowIndex)}
                    className={cn(
                      "border-t border-border transition-colors",
                      onRowClick && "cursor-pointer hover:bg-muted/50 active:bg-muted/60",
                      focused && "bg-muted/40 outline-none ring-1 ring-inset ring-ring/30",
                    )}
                  >
                    {displayColumns.map((col) => {
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
                      <td
                        className="px-2 text-right sticky right-0 bg-card"
                        onClick={(e) => e.stopPropagation()}
                      >
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
