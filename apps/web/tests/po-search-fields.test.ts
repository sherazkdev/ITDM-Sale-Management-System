import { describe, expect, it } from "vitest";
import type { PoSearchResult } from "../src/lib/api/search";
import { REPORT_DEFINITIONS } from "../src/lib/api/reports";

/** Mirrors UI cell formatters on `/search` for serialization-aligned fields. */
function formatMovementEmployee(
  employee: PoSearchResult["movements"][number]["employee"],
): string {
  return employee ? `${employee.employeeNumber} — ${employee.fullName}` : "—";
}

function formatLicenseName(license: PoSearchResult["softwareLicenses"][number]): string {
  return license.softwareName;
}

function formatLineTotal(
  line: PoSearchResult["purchaseOrder"]["lines"][number],
): string {
  return line.lineSubtotal;
}

function formatNonAssetRow(item: PoSearchResult["nonAssetStockItems"][number], poNumber: string) {
  return {
    itemName: item.itemName,
    unitOfMeasure: item.unitOfMeasure,
    registeredQty: item.quantityOnHand,
    availableQty: item.quantityAvailable,
    linkedPo: item.purchaseOrder?.poNumber ?? poNumber,
  };
}

describe("PO search hub field mapping", () => {
  const fixture: PoSearchResult = {
    purchaseOrder: {
      purchaseOrderId: "1",
      poNumber: "PO-2026-FIX",
      poDate: "2026-07-01",
      currency: "USD",
      status: "draft",
      validUntil: null,
      vendorId: "10",
      contractId: null,
      lines: [
        {
          purchaseOrderLineId: "100",
          lineNumber: 1,
          description: "Laptop",
          quantity: "1",
          unitPrice: "1200.00",
          lineSubtotal: "1200.00",
        },
      ],
      invoices: [],
      assets: [],
    },
    nonAssetStockItems: [
      {
        stockItemId: "50",
        stockCode: "CABLE-1",
        itemName: "Cat6 reel",
        itemType: "Cable",
        unitOfMeasure: "FEET",
        quantityOnHand: "100",
        quantityAvailable: "100",
        quantityAvailableNote:
          "Available equals quantity on hand — consumption and replenishment are not implemented.",
        purchaseOrder: { purchaseOrderId: "1", poNumber: "PO-2026-FIX" },
      },
    ],
    expiryDates: { contractExpiry: null, poValidUntil: null, note: "" },
    supportingDocuments: { purchaseOrder: [], contract: [] },
    invoiceFinancials: [],
    movements: [
      {
        assetTransactionId: "9",
        transactionType: "ISSUE",
        transactionDate: "2026-07-02T00:00:00.000Z",
        asset: { assetCode: "A-1", assetName: "Laptop" },
        employee: { employeeNumber: "E-42", fullName: "Ada Lovelace" },
      },
    ],
    maintenance: [],
    softwareLicenses: [
      {
        licenseId: "7",
        softwareName: "Office Suite",
        expiryDate: "2027-01-01",
        status: "active",
      },
    ],
    budget: { allocations: [], semanticsNote: "" },
    truncation: {
      movementsCap: 500,
      maintenanceCap: 200,
      licensesCap: 200,
      nonAssetStockCap: 200,
    },
  };

  it("renders employeeNumber (not employeeCode) for movements", () => {
    const label = formatMovementEmployee(fixture.movements[0]!.employee);
    expect(label).toBe("E-42 — Ada Lovelace");
    expect(label).not.toContain("undefined");
    expect(
      "employeeCode" in (fixture.movements[0]!.employee as Record<string, unknown>),
    ).toBe(false);
  });

  it("renders softwareName (not productName) for licenses", () => {
    expect(formatLicenseName(fixture.softwareLicenses[0]!)).toBe("Office Suite");
    expect("productName" in (fixture.softwareLicenses[0] as Record<string, unknown>)).toBe(false);
  });

  it("uses lineSubtotal for PO line totals", () => {
    expect(formatLineTotal(fixture.purchaseOrder.lines[0]!)).toBe("1200.00");
  });

  it("maps non-asset stock qty and linked PO", () => {
    const row = formatNonAssetRow(fixture.nonAssetStockItems[0]!, fixture.purchaseOrder.poNumber);
    expect(row.itemName).toBe("Cat6 reel");
    expect(row.unitOfMeasure).toBe("FEET");
    expect(row.registeredQty).toBe("100");
    expect(row.availableQty).toBe("100");
    expect(row.linkedPo).toBe("PO-2026-FIX");
  });
});

describe("Purchase order report catalog copy", () => {
  it("does not claim line-level PO export", () => {
    const poReport = REPORT_DEFINITIONS.find((r) => r.slug === "purchase-orders");
    expect(poReport).toBeDefined();
    expect(poReport!.description.toLowerCase()).toContain("header");
    expect(poReport!.description.toLowerCase()).not.toMatch(/line summary/);
  });
});
