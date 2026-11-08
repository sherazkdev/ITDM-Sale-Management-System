"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollText } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Pagination } from "@/components/common/Pagination";
import { EmptyState } from "@/components/common/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchAuditEvent, fetchAuditEvents, type AuditLogEntry } from "@/lib/api/audit";
import { ApiClientError } from "@/lib/api/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [targetType, setTargetType] = useState("");
  const [filterInput, setFilterInput] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ["audit-events", page, pageSize, targetType],
    queryFn: () => fetchAuditEvents({ page, pageSize, targetType: targetType || undefined }),
  });

  const detailQuery = useQuery({
    queryKey: ["audit-event", detailId],
    queryFn: () => fetchAuditEvent(detailId!),
    enabled: Boolean(detailId),
  });

  const rows = listQuery.data?.data ?? [];
  const total = listQuery.data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const columns: Column<AuditLogEntry>[] = [
    { key: "when", header: "When", cell: (r) => r.occurredAt },
    { key: "action", header: "Action", cell: (r) => r.action },
    { key: "target", header: "Target", cell: (r) => `${r.targetType}${r.targetId ? ` / ${r.targetId}` : ""}` },
    { key: "actor", header: "Actor", cell: (r) => r.actor?.username ?? "—" },
    { key: "result", header: "Result", cell: (r) => r.result },
    {
      key: "view",
      header: "",
      cell: (r) => (
        <Button type="button" variant="outline" size="sm" onClick={() => setDetailId(r.auditLogId)}>
          Details
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Audit log" description="Read-only security and change events (`audit.read`)." />

      <SectionCard title="Events">
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end mb-4"
          onSubmit={(e) => {
            e.preventDefault();
            setTargetType(filterInput.trim());
            setPage(1);
          }}
        >
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="target-type">
              Target type filter
            </label>
            <Input
              id="target-type"
              value={filterInput}
              onChange={(e) => setFilterInput(e.target.value)}
              placeholder="e.g. purchase_order"
            />
          </div>
          <Button type="submit">Apply filter</Button>
        </form>

        {listQuery.isLoading && <p className="text-sm text-muted-foreground">Loading audit events…</p>}
        {listQuery.isError && (
          <EmptyState
            icon={ScrollText}
            title="Access denied or error"
            description={
              listQuery.error instanceof ApiClientError ? listQuery.error.message : "Could not load audit log."
            }
          />
        )}
        {rows.length > 0 && (
          <>
            <DataTable
              tableId="audit-log"
              sortMode="off"
              columns={columns}
              data={rows}
              getRowId={(r) => r.auditLogId}
              caption="Audit event log"
            />
            <Pagination
              className="mt-4"
              page={page}
              pageSize={pageSize}
              total={total}
              totalPages={totalPages}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              itemLabel="events"
            />
          </>
        )}
        {!listQuery.isLoading && !listQuery.isError && rows.length === 0 && (
          <EmptyState icon={ScrollText} title="No events" description="No audit entries match this filter." />
        )}
      </SectionCard>

      <Dialog open={detailId !== null} onOpenChange={(open) => !open && setDetailId(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Audit event {detailId}</DialogTitle>
          </DialogHeader>
          {detailQuery.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {detailQuery.data && (
            <pre className="text-xs bg-muted p-3 rounded-md overflow-auto">
              {JSON.stringify(detailQuery.data, null, 2)}
            </pre>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
