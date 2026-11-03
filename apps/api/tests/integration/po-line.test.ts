import { describe, expect, it, beforeAll } from "vitest";
import { buildApplication } from "../../src/server.js";
import { prepareTestDatabase } from "../helpers/prepare-test-database.js";
import { PurchaseOrderStatus } from "../../src/shared/domain/purchase-order-status.js";
import { PurchaseOrderRepository } from "../../src/modules/purchase-orders/purchase-order.repository.js";
import { PurchaseOrderService } from "../../src/modules/purchase-orders/purchase-order.service.js";
import { AuditService } from "../../src/shared/audit/audit.service.js";

describe("PurchaseOrderService.addLine", () => {
  beforeAll(async () => {
    await prepareTestDatabase();
  }, 120_000);

  it("adds a line and recomputes header total", async () => {
    const { prisma } = buildApplication();
    const vendor = await prisma.vendor.create({
      data: { vendorName: `V-int-${Date.now()}`, isActive: true },
    });
    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber: `PO-int-${Date.now()}`,
        vendorId: vendor.vendorId,
        poDate: new Date("2026-02-01T00:00:00.000Z"),
        totalAmount: 0,
        currency: "USD",
        status: PurchaseOrderStatus.draft,
      },
    });

    const svc = new PurchaseOrderService(
      prisma,
      new PurchaseOrderRepository(prisma),
      new AuditService(prisma),
    );

    const result = await svc.addLine(
      po.purchaseOrderId,
      {
        lineNumber: 1,
        description: "Item",
        lineType: "goods",
        quantity: 2,
        unitPrice: 1000,
      },
      {},
    );
    expect(String(result.totalAmount)).toBe("2000");
    expect(result.lines).toHaveLength(1);
  });
});
