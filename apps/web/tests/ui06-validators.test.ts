import { describe, expect, it } from "vitest";
import { createInvoiceSchema, recordPaymentSchema } from "@/lib/validators/invoice";
import { createFinancialYearSchema, appendLedgerEntrySchema } from "@/lib/validators/budget";
import { createMaintenanceSchema } from "@/lib/validators/maintenance";
import { createLicenseSchema } from "@/lib/validators/software-license";

describe("UI06 invoice validators", () => {
  it("accepts valid create invoice", () => {
    const parsed = createInvoiceSchema.parse({
      invoiceNumber: "INV-1",
      purchaseOrderId: "12",
      invoiceDate: "2026-03-01",
      invoiceAmount: 100.5,
    });
    expect(parsed.invoiceAmount).toBe(100.5);
  });

  it("rejects non-positive payment", () => {
    expect(() => recordPaymentSchema.parse({ amount: 0 })).toThrow();
  });
});

describe("UI06 budget validators", () => {
  it("accepts financial year", () => {
    const y = createFinancialYearSchema.parse({
      yearName: "FY26",
      startDate: "2026-04-01",
      endDate: "2027-03-31",
      status: "OPEN",
    });
    expect(y.yearName).toBe("FY26");
  });

  it("requires budgetId on ledger", () => {
    expect(() =>
      appendLedgerEntrySchema.parse({
        budgetId: "",
        transactionType: "MANUAL",
        amount: 10,
        transactionDate: "2026-01-01",
      }),
    ).toThrow();
  });
});

describe("UI06 maintenance validators", () => {
  it("requires at least one link", () => {
    expect(() =>
      createMaintenanceSchema.parse({
        maintenanceType: "Repair",
        requestDate: "2026-01-01",
      }),
    ).toThrow();
  });
});

describe("UI06 license validators", () => {
  it("accepts license create", () => {
    const l = createLicenseSchema.parse({
      softwareName: "Office",
      startDate: "2026-01-01",
      expiryDate: "2027-01-01",
      licenseQuantity: 5,
    });
    expect(l.licenseQuantity).toBe(5);
  });
});
