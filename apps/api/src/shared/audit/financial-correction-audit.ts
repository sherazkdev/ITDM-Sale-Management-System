import type { Prisma } from "@prisma/client";
import type { AuditService } from "./audit.service.js";

export type FinancialCorrectionAuditPayload = {
  entityType: string;
  recordId: string;
  correctionReason: string;
  actionType: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  changedFields: string[];
  relatedIds?: Record<string, string | null>;
};

export async function recordFinancialCorrectionAudit(
  audit: AuditService,
  input: {
    actorUserId?: bigint;
    requestId?: string;
    result: "success" | "failure";
    payload: FinancialCorrectionAuditPayload;
    errorMessage?: string;
  },
): Promise<void> {
  const metadata = {
    ...input.payload,
    ...(input.errorMessage ? { errorMessage: input.errorMessage } : {}),
  } as Prisma.InputJsonValue;
  await audit.record({
    actorUserId: input.actorUserId,
    action: "financial.correction",
    targetType: input.payload.entityType,
    targetId: input.payload.recordId,
    result: input.result,
    requestId: input.requestId,
    metadata,
  });
}
