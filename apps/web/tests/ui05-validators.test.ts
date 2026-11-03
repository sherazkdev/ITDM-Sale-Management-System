import { describe, expect, it } from "vitest";
import { createContractSchema, updateContractSchema } from "../src/lib/validators/contract";
import {
  createPurchaseOrderSchema,
  purchaseOrderLineSchema,
} from "../src/lib/validators/purchase-order";
import { issueAssetsSchema, returnAssetsSchema } from "../src/lib/validators/asset-movement";

describe("createContractSchema", () => {
  it("accepts valid contract dates", () => {
    const result = createContractSchema.safeParse({
      contractNumber: "CN-1",
      vendorId: "1",
      startDate: "2026-01-01",
      expiryDate: "2027-01-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid date format", () => {
    const result = createContractSchema.safeParse({
      contractNumber: "CN-1",
      vendorId: "1",
      startDate: "01/01/2026",
      expiryDate: "2027-01-01",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateContractSchema", () => {
  it("allows partial updates", () => {
    expect(updateContractSchema.safeParse({ renewalStatus: "Pending" }).success).toBe(true);
  });
});

describe("createPurchaseOrderSchema", () => {
  it("requires 3-letter currency", () => {
    expect(
      createPurchaseOrderSchema.safeParse({
        poNumber: "PO-1",
        vendorId: "1",
        poDate: "2026-02-01",
        currency: "USD",
      }).success,
    ).toBe(true);
    expect(
      createPurchaseOrderSchema.safeParse({
        poNumber: "PO-1",
        vendorId: "1",
        poDate: "2026-02-01",
        currency: "US",
      }).success,
    ).toBe(false);
  });
});

describe("purchaseOrderLineSchema", () => {
  it("requires positive quantity", () => {
    const ok = purchaseOrderLineSchema.safeParse({
      lineNumber: 1,
      description: "Item",
      lineType: "goods",
      quantity: 2,
      unitPrice: 10,
    });
    expect(ok.success).toBe(true);

    const bad = purchaseOrderLineSchema.safeParse({
      lineNumber: 1,
      description: "Item",
      lineType: "goods",
      quantity: 0,
      unitPrice: 10,
    });
    expect(bad.success).toBe(false);
  });
});

describe("issueAssetsSchema", () => {
  it("requires at least one asset", () => {
    expect(
      issueAssetsSchema.safeParse({
        employeeId: "1",
        assets: [{ assetId: "10" }],
      }).success,
    ).toBe(true);
    expect(
      issueAssetsSchema.safeParse({
        employeeId: "1",
        assets: [],
      }).success,
    ).toBe(false);
  });
});

describe("returnAssetsSchema", () => {
  it("mirrors issue validation", () => {
    expect(
      returnAssetsSchema.safeParse({
        employeeId: "1",
        referenceNumber: "RET-1",
        assets: [{ assetId: "10", conditionNotes: "" }],
      }).success,
    ).toBe(true);
  });
});
