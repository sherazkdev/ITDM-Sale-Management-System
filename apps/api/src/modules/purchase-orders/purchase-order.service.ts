import { Prisma } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import { PurchaseOrderStatus, isPoDraft } from "../../shared/domain/purchase-order-status.js";
import { lineSubtotal, toDecimal } from "../../shared/money/decimal-math.js";
import { runInTransaction } from "../../shared/db/transaction.js";
import type { AuditService } from "../../shared/audit/audit.service.js";
import type { PaginationQuery } from "../../shared/http/pagination.schema.js";
import type { PrismaClient } from "@prisma/client";
import type { PurchaseOrderRepository } from "./purchase-order.repository.js";

function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export class PurchaseOrderService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly repository: PurchaseOrderRepository,
    private readonly audit: AuditService,
  ) {}

  private async assertVendorContractMatch(vendorId: bigint, contractId?: bigint | null) {
    if (!contractId) {
      return;
    }
    const contract = await this.prisma.contract.findUnique({ where: { contractId } });
    if (!contract) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, "Contract not found", 422);
    }
    if (contract.vendorId !== vendorId) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        "Purchase order vendor must match linked contract vendor",
        422,
      );
    }
  }

  private async recomputeHeaderTotal(tx: Prisma.TransactionClient, purchaseOrderId: bigint) {
    const agg = await this.repository.sumLineSubtotals(tx, purchaseOrderId);
    const total = agg._sum.lineSubtotal ?? new Prisma.Decimal(0);
    await tx.purchaseOrder.update({
      where: { purchaseOrderId },
      data: { totalAmount: total },
    });
    return total;
  }

  async createDraft(
    input: {
      poNumber: string;
      vendorId: bigint;
      contractId?: bigint;
      poDate: string;
      currency: string;
      validUntil?: string;
    },
    auditContext: { actorUserId?: bigint; requestId?: string },
  ) {
    await this.assertVendorContractMatch(input.vendorId, input.contractId);
    try {
      const po = await this.repository.createHeader({
        poNumber: input.poNumber.trim(),
        vendor: { connect: { vendorId: input.vendorId } },
        contract: input.contractId ? { connect: { contractId: input.contractId } } : undefined,
        poDate: parseDateOnly(input.poDate),
        validUntil: input.validUntil ? parseDateOnly(input.validUntil) : undefined,
        totalAmount: new Prisma.Decimal(0),
        currency: input.currency.toUpperCase(),
        status: PurchaseOrderStatus.draft,
      });
      await this.audit.record({
        actorUserId: auditContext.actorUserId,
        action: "purchase_order.create_draft",
        targetType: "purchase_order",
        targetId: String(po.purchaseOrderId),
        result: "success",
        requestId: auditContext.requestId,
      });
      return po;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new AppError(ErrorCodes.CONFLICT, "PO number already exists", 409);
      }
      throw err;
    }
  }

  async getById(purchaseOrderId: bigint) {
    const po = await this.repository.findById(purchaseOrderId);
    if (!po) {
      throw new AppError(ErrorCodes.NOT_FOUND, "Purchase order not found", 404);
    }
    return po;
  }

  getByNumber(poNumber: string) {
    return this.repository.findByNumber(poNumber.trim());
  }

  async updateDraftHeader(
    purchaseOrderId: bigint,
    input: { poDate?: string; currency?: string; contractId?: bigint | null; validUntil?: string | null },
    auditContext: { actorUserId?: bigint; requestId?: string },
  ) {
    const po = await this.getById(purchaseOrderId);
    if (!isPoDraft(po.status)) {
      throw new AppError(ErrorCodes.CONFLICT, "Only draft purchase orders can be edited", 409);
    }
    const vendorId = po.vendorId;
    if (input.contractId !== undefined) {
      await this.assertVendorContractMatch(vendorId, input.contractId ?? undefined);
    }
    const updated = await this.repository.updateHeader(purchaseOrderId, {
      ...(input.poDate ? { poDate: parseDateOnly(input.poDate) } : {}),
      ...(input.currency ? { currency: input.currency.toUpperCase() } : {}),
      ...(input.validUntil === null
        ? { validUntil: null }
        : input.validUntil
          ? { validUntil: parseDateOnly(input.validUntil) }
          : {}),
      ...(input.contractId === null
        ? { contract: { disconnect: true } }
        : input.contractId
          ? { contract: { connect: { contractId: input.contractId } } }
          : {}),
    });
    await this.audit.record({
      actorUserId: auditContext.actorUserId,
      action: "purchase_order.update_draft",
      targetType: "purchase_order",
      targetId: String(purchaseOrderId),
      result: "success",
      requestId: auditContext.requestId,
    });
    return updated;
  }

  async addLine(
    purchaseOrderId: bigint,
    line: {
      lineNumber: number;
      description: string;
      lineType: string;
      quantity: number;
      unitPrice: number;
    },
    auditContext: { actorUserId?: bigint; requestId?: string },
  ) {
    await runInTransaction(this.prisma, async (tx) => {
      const po = await tx.purchaseOrder.findUnique({ where: { purchaseOrderId } });
      if (!po) {
        throw new AppError(ErrorCodes.NOT_FOUND, "Purchase order not found", 404);
      }
      if (!isPoDraft(po.status)) {
        throw new AppError(ErrorCodes.CONFLICT, "Only draft purchase orders accept new lines", 409);
      }
      const subtotal = lineSubtotal(line.quantity, line.unitPrice);
      await tx.purchaseOrderLine.create({
        data: {
          purchaseOrderId,
          lineNumber: line.lineNumber,
          description: line.description,
          lineType: line.lineType,
          quantity: toDecimal(line.quantity),
          unitPrice: toDecimal(line.unitPrice),
          lineSubtotal: subtotal,
        },
      });
      await this.recomputeHeaderTotal(tx, purchaseOrderId);
      await this.audit.record({
        actorUserId: auditContext.actorUserId,
        action: "purchase_order.add_line",
        targetType: "purchase_order",
        targetId: String(purchaseOrderId),
        result: "success",
        requestId: auditContext.requestId,
        metadata: { lineNumber: line.lineNumber },
      });
    });
    return this.getById(purchaseOrderId);
  }

  async removeLine(
    purchaseOrderId: bigint,
    purchaseOrderLineId: bigint,
    auditContext: { actorUserId?: bigint; requestId?: string },
  ) {
    await runInTransaction(this.prisma, async (tx) => {
      const po = await tx.purchaseOrder.findUnique({ where: { purchaseOrderId } });
      if (!po || !isPoDraft(po.status)) {
        throw new AppError(ErrorCodes.CONFLICT, "Line can only be removed on draft PO", 409);
      }
      await tx.purchaseOrderLine.delete({ where: { purchaseOrderLineId } });
      await this.recomputeHeaderTotal(tx, purchaseOrderId);
      await this.audit.record({
        actorUserId: auditContext.actorUserId,
        action: "purchase_order.remove_line",
        targetType: "purchase_order",
        targetId: String(purchaseOrderId),
        result: "success",
        requestId: auditContext.requestId,
      });
    });
    return this.getById(purchaseOrderId);
  }

  assertWorkflowEndpointBlocked(): never {
    throw new AppError(
      ErrorCodes.POLICY_NOT_APPROVED,
      "PO submit/approve/cancel are not used in ITDMS — client confirmed approval occurs in SAP (or manually outside ITDMS). ITDMS maintains PO records only.",
      403,
    );
  }

  list(query: PaginationQuery, filters: { vendorId?: bigint; search?: string; status?: string }) {
    return this.repository.list(query, filters);
  }
}
