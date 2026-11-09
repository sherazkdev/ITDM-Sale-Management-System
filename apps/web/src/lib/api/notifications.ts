import { apiGet, apiGetPage, apiPost } from "./client";
import { toQueryString } from "./query-string";

export type NotificationEvent = {
  notificationEventId: string;
  eventType: string;
  entityType: string;
  entityId: string;
  dueOn: string;
  payload: unknown;
  createdAt: string;
  readAt: string | null;
};

export type NotificationReadFilter = "all" | "unread" | "read";

export type FetchNotificationsParams = {
  page?: number;
  pageSize?: number;
  /** @deprecated use read */
  unreadOnly?: boolean;
  read?: NotificationReadFilter;
  expiringSoon?: boolean;
  eventType?: string;
  search?: string;
  dueFrom?: string;
  dueTo?: string;
};

export async function fetchNotifications(params: FetchNotificationsParams) {
  const read =
    params.read ?? (params.unreadOnly ? "unread" : "all");
  const qs = toQueryString({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
    read: read === "all" ? undefined : read,
    ...(params.expiringSoon ? { expiringSoon: "true" } : {}),
    ...(params.eventType ? { eventType: params.eventType } : {}),
    ...(params.search?.trim() ? { search: params.search.trim() } : {}),
    ...(params.dueFrom ? { dueFrom: params.dueFrom } : {}),
    ...(params.dueTo ? { dueTo: params.dueTo } : {}),
  });
  return apiGetPage<NotificationEvent>(`/notifications${qs}`);
}

export async function fetchUnreadNotificationCount() {
  const res = await apiGet<{ count: number }>("/notifications/unread-count");
  return res.count;
}

export async function markNotificationRead(notificationEventId: string) {
  return apiPost<NotificationEvent>(`/notifications/${encodeURIComponent(notificationEventId)}/read`);
}

export function notificationSummary(row: NotificationEvent): string {
  const payload = row.payload as Record<string, unknown> | null;
  if (payload && typeof payload.message === "string") return payload.message;
  if (payload && typeof payload.contractNumber === "string") {
    return `Contract ${payload.contractNumber} approaching expiry`;
  }
  if (payload && typeof payload.softwareName === "string") {
    return `License ${payload.softwareName} approaching expiry`;
  }
  if (payload && typeof payload.poNumber === "string") {
    return `PO ${payload.poNumber} validity ending`;
  }
  return `${row.eventType.replace(/_/g, " ").toLowerCase()} — ${row.entityType}`;
}

export function countNotificationActiveFilters(sp: URLSearchParams): number {
  return [
    sp.get("read") && sp.get("read") !== "all" ? sp.get("read") : null,
    sp.get("expiringSoon") === "true" ? "expiring" : null,
    sp.get("eventType"),
    sp.get("search"),
    sp.get("dueFrom"),
    sp.get("dueTo"),
  ].filter(Boolean).length;
}

export const NOTIFICATION_EVENT_OPTIONS = [
  { value: "", label: "All categories" },
  { value: "CONTRACT_EXPIRY", label: "Contract expiry" },
  { value: "LICENSE_EXPIRY", label: "License expiry" },
  { value: "PO_VALID_UNTIL", label: "PO valid until" },
] as const;
