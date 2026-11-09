import { describe, expect, it } from "vitest";

import { fieldErrorMessage, fieldHasError } from "@/lib/forms/field-error";
import { countNotificationActiveFilters, notificationSummary } from "@/lib/api/notifications";
import { countDashboardActiveFilters, resolveDashboardRange } from "@/components/dashboard/DashboardFilterBar";
import { createVendorSchema } from "@/lib/validators/vendor";
import { createInvoiceSchema } from "@/lib/validators/invoice";

describe("field-error helper", () => {
  it("suppresses errors until touched or submit", () => {
    const errors = { vendorName: { message: "Required", type: "required" } };
    expect(fieldErrorMessage("vendorName", {}, false, errors)).toBeUndefined();
    expect(fieldErrorMessage("vendorName", { vendorName: true }, false, errors)).toBe("Required");
    expect(fieldHasError("vendorName", {}, true, errors)).toBe(true);
  });
});

describe("notification filters", () => {
  it("countNotificationActiveFilters counts URL params", () => {
    const sp = new URLSearchParams("read=unread&expiringSoon=true&search=po");
    expect(countNotificationActiveFilters(sp)).toBe(3);
  });

  it("notificationSummary uses payload hints", () => {
    const text = notificationSummary({
      notificationEventId: "1",
      eventType: "PO_VALID_UNTIL",
      entityType: "purchase_order",
      entityId: "9",
      dueOn: "2026-12-01",
      payload: { poNumber: "PO-100" },
      createdAt: "",
      readAt: null,
    });
    expect(text).toContain("PO-100");
  });
});

describe("form zod schemas", () => {
  it("vendor schema requires name", () => {
    expect(createVendorSchema.safeParse({ vendorName: "" }).success).toBe(false);
    expect(createVendorSchema.safeParse({ vendorName: "Acme" }).success).toBe(true);
  });

  it("invoice schema requires PO link", () => {
    expect(
      createInvoiceSchema.safeParse({
        invoiceNumber: "INV-1",
        purchaseOrderId: "",
        invoiceDate: "2026-01-01",
        invoiceAmount: 10,
      }).success,
    ).toBe(false);
  });
});

describe("dashboard chips", () => {
  it("countDashboardActiveFilters unchanged semantics", () => {
    const range = resolveDashboardRange("current_month");
    expect(countDashboardActiveFilters(new URLSearchParams("departmentId=x"), range)).toBe(1);
  });
});
