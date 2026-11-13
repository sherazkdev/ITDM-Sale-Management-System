import { apiFetchBinary, apiGet, apiPost, saveBlobAsFile } from "./client";
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
  receivingDepartment?: string | null;
  employee?: { employeeId: string; fullName: string; employeeNumber: string; department?: string | null };
  lines: MovementDocumentLine[];
};

export type OfficialMovementKind = "issuance" | "return";

function toMovementBody(input: IssueAssetsInput | ReturnAssetsInput) {
  const receivingDepartment =
    "receivingDepartment" in input ? input.receivingDepartment : undefined;
  return {
    employeeId: input.employeeId,
    ...(receivingDepartment ? { receivingDepartment } : {}),
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

function officialXlsxPath(documentId: string, kind: OfficialMovementKind): string {
  return kind === "issuance"
    ? `/asset-issuances/${documentId}/official-xlsx`
    : `/asset-returns/${documentId}/official-xlsx`;
}

function fileNameFromDisposition(headers: Headers, fallback: string): string {
  const cd = headers.get("content-disposition") ?? "";
  const match = /filename="([^"]+)"/i.exec(cd);
  return match?.[1] ?? fallback;
}

export async function downloadOfficialMovementXlsx(
  documentId: string,
  kind: OfficialMovementKind,
): Promise<{ blob: Blob; fileName: string }> {
  const path = officialXlsxPath(documentId, kind);
  const { blob, headers } = await apiFetchBinary(path);
  const fileName = fileNameFromDisposition(headers, `ITDMS-${kind}-${documentId}.xlsx`);
  return { blob, fileName };
}

export async function saveOfficialMovementXlsx(documentId: string, kind: OfficialMovementKind) {
  const { blob, fileName } = await downloadOfficialMovementXlsx(documentId, kind);
  saveBlobAsFile(blob, fileName);
}
