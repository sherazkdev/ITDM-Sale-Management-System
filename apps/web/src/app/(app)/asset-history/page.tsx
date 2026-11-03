"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History, Search } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { ListToolbar } from "@/components/crud/ListToolbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/common/StatusPill";
import { fetchAssets, type Asset } from "@/lib/api/assets";
import { ASSET_STATUS_LABELS, assetStatusToPill } from "@/lib/domain/asset-status-ui";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { ApiClientError } from "@/lib/api/client";

export default function AssetHistoryPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const searchActive = debouncedSearch.trim().length > 0;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["assets", "history-search", debouncedSearch],
    queryFn: () =>
      fetchAssets({
        page: 1,
        pageSize: 25,
        search: debouncedSearch.trim(),
      }),
    enabled: searchActive,
  });

  const rows = data?.data ?? [];

  const columns: Column<Asset>[] = [
    {
      key: "assetCode",
      header: "Code",
      cell: (a) => <span className="font-medium tabular">{a.assetCode}</span>,
    },
    {
      key: "assetName",
      header: "Name",
      cell: (a) => a.assetName,
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
      key: "actions",
      header: "",
      cell: (a) => (
        <Button variant="link" className="h-auto p-0" asChild>
          <Link href={`/assets/${a.assetId}`}>View history</Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        title="Asset history"
        description="Find an asset by code or name to view its movement history."
      />

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by asset code…"
      />

      {!searchActive ? (
        <Card className="p-8">
          <EmptyState
            icon={Search}
            title="Search for an asset"
            description="Enter an asset code or name to locate the register record and open full history."
          />
        </Card>
      ) : null}

      {searchActive && isError ? (
        <Card className="p-4 text-sm text-destructive">
          {error instanceof ApiClientError ? error.message : "Search failed."}{" "}
          <Button variant="link" className="h-auto p-0" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      ) : null}

      {searchActive ? (
        <Card className="overflow-hidden">
          <DataTable
            data={rows}
            columns={columns}
            getRowId={(a) => a.assetId}
            loading={isLoading}
            empty={
              <EmptyState
                icon={History}
                title="No matching assets"
                description="Try a different code or check spelling."
              />
            }
          />
        </Card>
      ) : null}
    </div>
  );
}
