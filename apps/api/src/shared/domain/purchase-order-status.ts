export const PurchaseOrderStatus = {
  draft: "DRAFT",
  submitted: "SUBMITTED",
  approved: "APPROVED",
  cancelled: "CANCELLED",
} as const;

export type PurchaseOrderStatusValue = (typeof PurchaseOrderStatus)[keyof typeof PurchaseOrderStatus];

export function isPoDraft(status: string): boolean {
  return status === PurchaseOrderStatus.draft;
}

/** Header/lines editable — legacy DRAFT plus client auto-approved POs without a blocking status. */
export function isPoComposable(status: string): boolean {
  return (
    status === PurchaseOrderStatus.draft ||
    status === PurchaseOrderStatus.approved
  );
}
