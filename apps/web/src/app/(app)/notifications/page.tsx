"use client";

import { Suspense, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import {
  NotificationFilterBar,
  useNotificationFilterParams,
} from "@/components/notifications/NotificationFilterBar";
import { NotificationCard } from "@/components/notifications/NotificationCard";
import { fetchNotifications, markNotificationRead } from "@/lib/api/notifications";
import { ApiClientError } from "@/lib/api/client";

export default function NotificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="page-stack">
          <Skeleton className="h-12 w-full max-w-md" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      }
    >
      <NotificationsPageContent />
    </Suspense>
  );
}

function NotificationsPageContent() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useNotificationFilterParams();
  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
  const [pageSize, setPageSize] = useState(20);

  const queryKey = useMemo(
    () => [
      "notifications",
      page,
      pageSize,
      filters.read,
      filters.expiringSoon,
      filters.eventType,
      filters.search,
      filters.dueFrom,
      filters.dueTo,
    ],
    [
      page,
      pageSize,
      filters.read,
      filters.expiringSoon,
      filters.eventType,
      filters.search,
      filters.dueFrom,
      filters.dueTo,
    ],
  );

  const listQuery = useQuery({
    queryKey,
    queryFn: () =>
      fetchNotifications({
        page,
        pageSize,
        read: filters.read,
        expiringSoon: filters.expiringSoon,
        eventType: filters.eventType || undefined,
        search: filters.search || undefined,
        dueFrom: filters.dueFrom || undefined,
        dueTo: filters.dueTo || undefined,
      }),
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

  const hasFilters =
    filters.read !== "all" ||
    filters.expiringSoon ||
    Boolean(filters.eventType || filters.search || filters.dueFrom || filters.dueTo);

  return (
    <div className="page-stack">
      <PageHeader
        title="Notifications"
        description="Contract, license, and purchase-order expiry reminders from scheduled scans."
      />

      <NotificationFilterBar />

      <section className="space-y-3" aria-label="Notification inbox">
        {listQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : null}

        {listQuery.isError ? (
          <EmptyState
            icon={Bell}
            title="Could not load notifications"
            description={
              listQuery.error instanceof ApiClientError ? listQuery.error.message : "Try again later."
            }
            action={{ label: "Retry", onClick: () => void listQuery.refetch() }}
          />
        ) : null}

        {!listQuery.isLoading && !listQuery.isError && rows.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={hasFilters ? "No notifications match filters" : "No notifications"}
            description={
              hasFilters
                ? "Try resetting filters or broadening the date range."
                : "Expiry alerts appear when the backend job creates them."
            }
          />
        ) : null}

        {rows.map((row) => (
          <NotificationCard
            key={row.notificationEventId}
            row={row}
            marking={markReadMutation.isPending}
            onMarkRead={(id) => markReadMutation.mutate(id)}
          />
        ))}
      </section>

      {total > 0 ? (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          onPageChange={(p) => {
            const sp = new URLSearchParams(searchParams.toString());
            if (p <= 1) sp.delete("page");
            else sp.set("page", String(p));
            const qs = sp.toString();
            router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
          }}
          onPageSizeChange={(size) => {
            setPageSize(size);
          }}
          itemLabel="notifications"
        />
      ) : null}
    </div>
  );
}
