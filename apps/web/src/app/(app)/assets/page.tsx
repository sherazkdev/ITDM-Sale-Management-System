"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package, Plus } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Pagination } from "@/components/common/Pagination";
import { StatusPill } from "@/components/common/StatusPill";
import { EmptyState } from "@/components/common/EmptyState";
import { ListToolbar } from "@/components/crud/ListToolbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FilterSelect } from "@/components/common/FilterSelect";
import { fetchAssets, type Asset } from "@/lib/api/assets";
import { fetchNonAssetStockItems, type NonAssetStockItem } from "@/lib/api/non-asset-stock";
import { fetchAssetCategories } from "@/lib/api/asset-categories";
import { ASSET_STATUS_LABELS, assetStatusToPill } from "@/lib/domain/asset-status-ui";
import { useServerListTable } from "@/lib/hooks/use-server-list-table";
import { useAuth } from "@/components/providers/AuthProvider";
import { PermissionKeys } from "@/lib/permissions";
import { ApiClientError } from "@/lib/api/client";

import { cn } from "@/lib/utils";

type InventoryView = "assets" | "non_asset";

const STATUS_OPTIONS = Object.entries(ASSET_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export default function AssetsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialInventory =
    searchParams.get("view") === "non-asset" ? "non_asset" : searchParams.get("inventory") === "non_asset" ? "non_asset" : "assets";
  const list = useServerListTable({
    defaults: {
      page: 1,
      pageSize: 20,
      inventory: initialInventory,
      status: searchParams.get("status") ?? "",
      categoryId: "",
    },
    defaultSortBy: "assetCode",
  });
  const inventoryView = (list.extras.inventory === "non_asset" ? "non_asset" : "assets") as InventoryView;
  const statusFilter = list.extras.status ?? "";
  const categoryFilter = list.extras.categoryId ?? "";
  const { hasPermission } = useAuth();

  const sortParams = useMemo(() => {
    const defaultSort = inventoryView === "assets" ? "assetCode" : "stockCode";
    return {
      sortBy: list.sortBy || defaultSort,
      sortDir: list.sortDir,
    };
  }, [inventoryView, list.sortBy, list.sortDir]);

  const { data: categories = [] } = useQuery({
    queryKey: ["asset-categories"],
    queryFn: fetchAssetCategories,
  });

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: c.categoryId, label: c.categoryName })),
    [categories],
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      "assets",
      list.page,
      list.pageSize,
      list.debouncedSearch,
      statusFilter,
      categoryFilter,
      sortParams.sortBy,
      sortParams.sortDir,
    ],
    queryFn: () =>
      fetchAssets({
        page: list.page,
        pageSize: list.pageSize,
        search: list.debouncedSearch || undefined,
        status: statusFilter || undefined,
        categoryId: categoryFilter || undefined,
        sortBy: sortParams.sortBy,
        sortDir: sortParams.sortDir,
      }),
    enabled: inventoryView === "assets",
  });

  const nonAssetQuery = useQuery({
    queryKey: [
      "non-asset-stock",
      list.page,
      list.pageSize,
      list.debouncedSearch,
      categoryFilter,
      sortParams.sortBy,
      sortParams.sortDir,
    ],
    queryFn: () =>
      fetchNonAssetStockItems({
        page: list.page,
        pageSize: list.pageSize,
        search: list.debouncedSearch || undefined,
        categoryId: categoryFilter || undefined,
        sortBy: sortParams.sortBy,
        sortDir: sortParams.sortDir,
      }),
    enabled: inventoryView === "non_asset",
  });

  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / list.pageSize));

  const nonAssetRows = nonAssetQuery.data?.data ?? [];
  const nonAssetTotal = nonAssetQuery.data?.meta.total ?? 0;
  const nonAssetTotalPages = Math.max(1, Math.ceil(nonAssetTotal / list.pageSize));

  const nonAssetColumns: Column<NonAssetStockItem>[] = [
    {
      key: "stockCode",
      header: "Code",
      sortable: true,
      serverSortKey: "stockCode",
      cell: (r) => (
        <Link href={`/assets/non-asset/${r.stockItemId}`} className="font-medium tabular text-primary hover:underline">
          {r.stockCode}
        </Link>
      ),
    },
    { key: "itemName", header: "Name", cell: (r) => r.itemName },
    {
      key: "qty",
      header: "Qty",
      cell: (r) => (
        <span className="tabular">
          {r.quantityOnHand} {r.unitOfMeasure}
        </span>
      ),
    },
    {
      key: "category",
      header: "Category",
      hideOnMobile: true,
      cell: (r) => r.category?.categoryName ?? "—",
    },
    {
      key: "location",
      header: "Location",
      hideOnMobile: true,
      cell: (r) => r.currentLocation ?? "—",
    },
  ];

  const columns: Column<Asset>[] = [
    {
      key: "assetCode",
      header: "Code",
      sortable: true,
      serverSortKey: "assetCode",
      cell: (a) => <span className="font-medium tabular">{a.assetCode}</span>,
    },
    {
      key: "assetName",
      header: "Name",
      sortable: true,
      serverSortKey: "assetName",
      cell: (a) => (
        <div className="min-w-0">
          <p className="font-medium truncate">{a.assetName}</p>
          {a.serialNumber ? (
            <p className="text-xs text-muted-foreground truncate">S/N {a.serialNumber}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      hideOnMobile: true,
      cell: (a) => a.category?.categoryName ?? "—",
    },
    {
      key: "assetStatus",
      header: "Status",
      cell: (a) => (
        <StatusPill
          status={assetStatusToPill(a.assetStatus)}
          label={ASSET_STATUS_LABELS[a.assetStatus] ?? a.assetStatus}
          dot
        />
      ),
    },
    {
      key: "currentLocation",
      header: "Location",
      hideOnMobile: true,
      cell: (a) => a.currentLocation ?? <span className="text-muted-foreground">—</span>,
    },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        title="Assets"
        description="Serialized assets and non-asset quantity stock."
        actions={
          hasPermission(PermissionKeys.assetsManage) ? (
            <Button asChild size="md">
              <Link href="/assets/new">
                <Plus className="h-4 w-4" />
                Stock entry
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["assets", "Serialized assets"],
            ["non_asset", "Non-asset stock"],
          ] as const
        ).map(([view, label]) => (
          <Button
            key={view}
            type="button"
            size="sm"
            variant={inventoryView === view ? "default" : "outline"}
            className={cn(inventoryView === view && "bg-brand-gradient text-primary-foreground")}
            onClick={() => {
              list.patch({
                extras: {
                  inventory: view,
                  status: view === "non_asset" ? "" : statusFilter,
                  categoryId: categoryFilter,
                },
                page: 1,
                sortBy: "",
              });
            }}
          >
            {label}
          </Button>
        ))}
      </div>

      <ListToolbar
        search={list.search}
        onSearchChange={(v) => {
          list.patch({ search: v, page: 1 });
        }}
        searchPlaceholder={
          inventoryView === "assets"
            ? "Search code, name, or serial…"
            : "Search stock code or name…"
        }
        filters={
          <>
            {inventoryView === "assets" ? (
              <FilterSelect
                aria-label="Status filter"
                value={statusFilter}
                onChange={(v) => {
                  list.patch({ extras: { status: v }, page: 1 });
                }}
                placeholder="All statuses"
                options={STATUS_OPTIONS}
              />
            ) : null}
            <FilterSelect
              aria-label="Category filter"
              value={categoryFilter}
              onChange={(v) => {
                list.patch({ extras: { categoryId: v }, page: 1 });
              }}
              placeholder="All categories"
              options={categoryOptions}
            />
          </>
        }
      />

      {inventoryView === "assets" && isError ? (
        <Card className="p-4 text-sm text-destructive">
          {error instanceof ApiClientError ? error.message : "Failed to load assets."}{" "}
          <Button variant="link" className="h-auto p-0" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      ) : null}

      {inventoryView === "non_asset" && nonAssetQuery.isError ? (
        <Card className="p-4 text-sm text-destructive">
          Failed to load non-asset stock.{" "}
          <Button variant="link" className="h-auto p-0" onClick={() => nonAssetQuery.refetch()}>
            Retry
          </Button>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        {inventoryView === "assets" ? (
        <>
        <DataTable
          tableId="assets-serialized"
          sortMode="server"
          serverSort={sortParams}
          onServerSortChange={list.onServerSortChange}
          data={rows}
          columns={columns}
          getRowId={(a) => a.assetId}
          loading={isLoading}
          onRowClick={(a) => router.push(`/assets/${a.assetId}`)}
          empty={
            <EmptyState
              icon={Package}
              title="No assets found"
              description="Adjust filters or register a new asset."
            />
          }
        />
        <div className="border-t border-border p-4">
          <Pagination
            page={list.page}
            totalPages={totalPages}
            total={total}
            pageSize={list.pageSize}
            onPageChange={(p) => list.patch({ page: p })}
            onPageSizeChange={(s) => {
              list.patch({ pageSize: s, page: 1 });
            }}
            itemLabel="assets"
          />
        </div>
        </>
        ) : (
        <>
        <DataTable
          tableId="non-asset-stock"
          sortMode="server"
          serverSort={sortParams}
          onServerSortChange={list.onServerSortChange}
          data={nonAssetRows}
          columns={nonAssetColumns}
          getRowId={(r) => r.stockItemId}
          loading={nonAssetQuery.isLoading}
          empty={
            <EmptyState
              icon={Package}
              title="No non-asset stock"
              description="Record quantity-based items from Stock entry."
            />
          }
        />
        <div className="border-t border-border p-4">
          <Pagination
            page={list.page}
            totalPages={nonAssetTotalPages}
            total={nonAssetTotal}
            pageSize={list.pageSize}
            onPageChange={(p) => list.patch({ page: p })}
            onPageSizeChange={(s) => {
              list.patch({ pageSize: s, page: 1 });
            }}
            itemLabel="items"
          />
        </div>
        </>
        )}
      </Card>
    </div>
  );
}
