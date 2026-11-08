"use client";

import type { ReactNode } from "react";
import { SectionCard } from "@/components/common/SectionCard";
import { DataTable, type Column, type DataTableSortMode } from "@/components/common/DataTable";
import { DataTableColumnMenu } from "@/components/common/DataTableColumnMenu";
import { Pagination } from "@/components/common/Pagination";
import { useDataTableColumnPrefs } from "@/lib/hooks/use-data-table-column-prefs";
import { cn } from "@/lib/utils";

export type ServerSortState = {
  sortBy: string;
  sortDir: "asc" | "desc";
};

type ListDataSectionProps<T> = {
  tableId?: string;
  columns: Column<T>[];
  data: T[];
  getRowId: (row: T) => string;
  loading?: boolean;
  empty?: ReactNode;
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => ReactNode;
  sortMode?: DataTableSortMode;
  serverSort?: ServerSortState;
  onServerSortChange?: (sortBy: string | null, sortDir: "asc" | "desc" | null) => void;
  className?: string;
  toolbarTrailing?: ReactNode;
  page?: number;
  totalPages?: number;
  total?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  itemLabel?: string;
  error?: ReactNode;
};

export function ListDataSection<T>({
  tableId,
  columns,
  data,
  getRowId,
  loading,
  empty,
  onRowClick,
  rowActions,
  sortMode = "client",
  serverSort,
  onServerSortChange,
  className,
  toolbarTrailing,
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  itemLabel = "items",
  error,
}: ListDataSectionProps<T>) {
  const columnKeys = columns.map((c) => c.key);
  const { prefs, visibleKeys, toggleColumn, moveColumn, reset } = useDataTableColumnPrefs(
    tableId,
    columnKeys,
  );

  const showPagination =
    total !== undefined &&
    totalPages !== undefined &&
    page !== undefined &&
    pageSize !== undefined &&
    onPageChange;

  return (
    <SectionCard flush className={cn("shadow-soft", className)}>
      {tableId ? (
        <div className="flex flex-wrap items-center justify-end gap-2 border-b border-border px-4 py-2">
          <DataTableColumnMenu
            tableId={tableId}
            columns={columns}
            hiddenKeys={prefs.hidden}
            columnOrder={prefs.order}
            onToggle={toggleColumn}
            onMove={moveColumn}
            onReset={reset}
          />
          {toolbarTrailing}
        </div>
      ) : null}
      {error}
      <DataTable
        data={data}
        columns={columns}
        getRowId={getRowId}
        loading={loading}
        empty={empty}
        onRowClick={onRowClick}
        rowActions={rowActions}
        sortMode={sortMode}
        serverSort={serverSort}
        onServerSortChange={onServerSortChange}
        visibleColumnKeys={tableId ? visibleKeys : undefined}
        className="border-0 shadow-none rounded-none"
      />
      {showPagination && total! > 0 ? (
        <div className="border-t border-border px-4 py-3 md:px-6">
          <Pagination
            page={page!}
            totalPages={totalPages!}
            total={total!}
            pageSize={pageSize!}
            onPageChange={onPageChange!}
            onPageSizeChange={onPageSizeChange}
            itemLabel={itemLabel}
          />
        </div>
      ) : null}
    </SectionCard>
  );
}
