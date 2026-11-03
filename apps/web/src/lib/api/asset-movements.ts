import { apiGet, apiPost } from "./client";
import type { IssueAssetsInput, ReturnAssetsInput } from "@/lib/validators/asset-movement";

export type MovementDocumentLine = {
  assetId: string;
  asset?: { assetId: string; assetCode: string; assetName: string };
  transaction?: { conditionNotes: string | null };
};

export type MovementDocument = {
  documentId: string;
  documentType: string;
  referenceNumber: string | null;
  occurredAt: string;
  employeeId: string;
  employee?: { employeeId: string; fullName: string; employeeNumber: string };
  lines: MovementDocumentLine[];
};

function toMovementBody(input: IssueAssetsInput | ReturnAssetsInput) {
  return {
    employeeId: input.employeeId,
    referenceNumber: input.referenceNumber || undefined,
    occurredAt: input.occurredAt || undefined,
    assets: input.assets.map((a) => ({
      assetId: a.assetId,
      conditionNotes: a.conditionNotes || undefined,
    })),
  };
}

export function issueAssets(input: IssueAssetsInput) {
  return apiPost<MovementDocument>("/asset-issuances", toMovementBody(input));
}

export function returnAssets(input: ReturnAssetsInput) {
  return apiPost<MovementDocument>("/asset-returns", toMovementBody(input));
}

export function fetchIssuanceDocument(documentId: string) {
  return apiGet<MovementDocument>(`/asset-issuances/${documentId}`);
}

export function fetchReturnDocument(documentId: string) {
  return apiGet<MovementDocument>(`/asset-returns/${documentId}`);
}
