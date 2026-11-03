import type { StatusKind } from "@/components/common/StatusPill";

export const INVOICE_PAYMENT_LABELS: Record<string, string> = {
  UNPAID: "Unpaid",
  PARTIAL: "Partial",
  PAID: "Paid",
};

export function invoicePaymentToPill(status: string): StatusKind {
  switch (status) {
    case "PAID":
      return "active";
    case "PARTIAL":
      return "pending";
    case "UNPAID":
    default:
      return "draft";
  }
}
