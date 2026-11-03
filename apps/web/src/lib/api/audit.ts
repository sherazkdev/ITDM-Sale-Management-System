import { apiGet, apiGetPage } from "./client";
import { toQueryString } from "./query-string";

export type AuditLogEntry = {
  auditLogId: string;
  actorUserId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  result: string;
  metadata: unknown;
  occurredAt: string;
  requestId: string | null;
  actor?: { userId: string; username: string; displayName: string } | null;
};

export async function fetchAuditEvents(params: {
  page?: number;
  pageSize?: number;
  targetType?: string;
}) {
  const qs = toQueryString({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 50,
    ...(params.targetType ? { targetType: params.targetType } : {}),
  });
  return apiGetPage<AuditLogEntry>(`/audit-events${qs}`);
}

export async function fetchAuditEvent(auditLogId: string) {
  return apiGet<AuditLogEntry>(`/audit-events/${encodeURIComponent(auditLogId)}`);
}
