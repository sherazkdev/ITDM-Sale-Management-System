"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Pagination } from "@/components/common/Pagination";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusPill } from "@/components/common/StatusPill";
import { Button } from "@/components/ui/button";
import { fetchNotifications, markNotificationRead, type NotificationEvent } from "@/lib/api/notifications";
import { ApiClientError } from "@/lib/api/client";

function eventLabel(row: NotificationEvent) {
  const payload = row.payload as Record<string, unknown> | null;
  if (payload && typeof payload.message === "string") return payload.message;
  return `${row.eventType} — ${row.entityType} ${row.entityId}`;
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const listQuery = useQuery({
    queryKey: ["notifications", page, pageSize, unreadOnly],
    queryFn: () => fetchNotifications({ page, pageSize, unreadOnly }),
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Could not mark read"),
  });

  const rows = listQuery.data?.data ?? [];
  const total = listQuery.data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const columns: Column<NotificationEvent>[] = [
    {
      key: "status",
      header: "",
      cell: (r) =>
        r.readAt ? (
          <span className="text-xs text-muted-foreground">Read</span>
        ) : (
          <StatusPill status="pending" label="Unread" />
        ),
    },
    {
      key: "due",
      header: "Due",
      cell: (r) => r.dueOn,
    },
    {
      key: "type",
      header: "Type",
      cell: (r) => r.eventType,
    },
    {
      key: "summary",
      header: "Summary",
      cell: (r) => eventLabel(r),
    },
    {
      key: "actions",
      header: "",
      cell: (r) =>
        !r.readAt ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={markReadMutation.isPending}
            onClick={() => markReadMutation.mutate(r.notificationEventId)}
          >
            Mark read
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        title="Notifications"
        description="Contract, license, and PO expiry alerts from scheduled backend scans — not editable here."
      />

      <SectionCard title="Inbox">
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            type="button"
            variant={unreadOnly ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setUnreadOnly((v) => !v);
              setPage(1);
            }}
          >
            {unreadOnly ? "Showing unread" : "Show unread only"}
          </Button>
        </div>

        {listQuery.isLoading && <p className="text-sm text-muted-foreground">Loading notifications…</p>}
        {listQuery.isError && (
          <EmptyState
            icon={Bell}
            title="Could not load notifications"
            description={
              listQuery.error instanceof ApiClientError ? listQuery.error.message : "Try again later."
            }
          />
        )}
        {!listQuery.isLoading && !listQuery.isError && rows.length === 0 && (
          <EmptyState icon={Bell} title="No notifications" description="Expiry alerts appear when the backend job creates them." />
        )}
        {rows.length > 0 && (
          <>
            <DataTable
              tableId="notifications"
              sortMode="off"
              columns={columns}
              data={rows}
              getRowId={(r) => r.notificationEventId}
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
              itemLabel="notifications"
            />
          </>
        )}
      </SectionCard>
    </div>
  );
}
