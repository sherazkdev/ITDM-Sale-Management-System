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

/** Client Wave 1 (D03 superseded): no in-app PO approval workflow. */
export const PO_SAP_EXTERNAL_APPROVAL_MESSAGE =
  "Purchase order approval is handled outside ITDMS (for example in SAP). ITDMS stores PO records for tracking. Submit, approve, and cancel controls here stay disabled unless a future integration is explicitly approved.";

/** @deprecated use PO_SAP_EXTERNAL_APPROVAL_MESSAGE */
export const D03_POLICY_MESSAGE = PO_SAP_EXTERNAL_APPROVAL_MESSAGE;

/** ITDMS does not run an internal PO approval engine (client Wave 1). */
export const PO_WORKFLOW_BLOCKED = true;

/** Open PO status semantics if SAP status should be mirrored manually later. */
export const PO_STATUS_OPEN_QUESTIONS =
  "Should ITDMS PO status reflect SAP approval manually, or remain draft-only for data entry? Pending client follow-up.";
