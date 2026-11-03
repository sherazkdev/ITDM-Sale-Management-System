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
