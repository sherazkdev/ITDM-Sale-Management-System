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

export async function fetchNotifications(params: {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
}) {
  const qs = toQueryString({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
    ...(params.unreadOnly ? { unread: "true" } : {}),
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
