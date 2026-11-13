import type { StatusKind } from "@/components/common/StatusPill";

export const PO_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  CANCELLED: "Cancelled",
};

export function poStatusToPill(status: string): StatusKind {
  switch (status) {
    case "DRAFT":
      return "draft";
    case "SUBMITTED":
      return "pending";
    case "APPROVED":
      return "active";
    case "CANCELLED":
      return "inactive";
    default:
      return "draft";
  }
}

/** Client Prompt #25 — POs are approved automatically when created in ITDMS (no SAP / manual approval step). */
export const PO_AUTO_APPROVAL_MESSAGE =
  "New purchase orders are created in Approved status automatically. There is no separate in-app approval queue or external SAP approval integration.";

export const PO_SAP_EXTERNAL_APPROVAL_MESSAGE = PO_AUTO_APPROVAL_MESSAGE;

/** @deprecated use PO_AUTO_APPROVAL_MESSAGE */
export const D03_POLICY_MESSAGE = PO_AUTO_APPROVAL_MESSAGE;

export const PO_WORKFLOW_BLOCKED = true;

export const PO_SHOW_LEGACY_WORKFLOW_ACTIONS = false;

export function isPoComposableStatus(status: string | undefined): boolean {
  return status === "DRAFT" || status === "APPROVED";
}
