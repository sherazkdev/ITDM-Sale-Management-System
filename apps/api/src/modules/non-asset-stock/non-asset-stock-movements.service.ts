import { NonAssetStockMovementType, Prisma, type PrismaClient } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import type { AuditService } from "../../shared/audit/audit.service.js";
import type { PaginationQuery } from "../../shared/http/pagination.schema.js";
import {
  assertNonNegativeAvailable,
  assertPositiveQuantity,
  toDecimal,
} from "./non-asset-stock-quantities.js";
import { enrichNonAssetStockMovement, enrichNonAssetStockItem } from "./non-asset-stock.presenter.js";

type AuditCtx = { actorUserId?: bigint; requestId?: string };

class IdempotencyConflictError extends Error {
  constructor(readonly idempotencyKey: string) {
    super("IDEMPOTENCY_CONFLICT");
    this.name = "IdempotencyConflictError";
  }
}

export type MovementTotals = {
  quantityIssued: number;
  quantityReturned: number;
  quantityReplenished: number;
  quantityWrittenOff: number;
  quantityIssuedOutstanding: number;
};

export class NonAssetStockMovementsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly audit: AuditService,
  ) {}

  async aggregateTotals(
    stockItemId: bigint,
    client: PrismaClient | Prisma.TransactionClient = this.prisma,
  ): Promise<MovementTotals> {
    const grouped = await client.nonAssetStockMovement.groupBy({
      by: ["movementType"],
      where: { stockItemId },
      _sum: { quantity: true },
    });
    const sum = (type: NonAssetStockMovementType) =>
      Number(
        grouped.find((g) => g.movementType === type)?._sum.quantity?.toString() ?? "0",
      );
    const issued = sum(NonAssetStockMovementType.ISSUE);
    const returned = sum(NonAssetStockMovementType.RETURN);
    return {
      quantityIssued: issued,
      quantityReturned: returned,
      quantityReplenished: sum(NonAssetStockMovementType.REPLENISHMENT),
      quantityWrittenOff: sum(NonAssetStockMovementType.WRITE_OFF),
      quantityIssuedOutstanding: Math.max(0, issued - returned),
    };
  }

  async listForStockItem(stockItemId: bigint, query: PaginationQuery, employeeId?: bigint) {
    const where: Prisma.NonAssetStockMovementWhereInput = {
      stockItemId,
      ...(employeeId ? { employeeId } : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.nonAssetStockMovement.findMany({
        where,
        include: {
          employee: { select: { employeeId: true, employeeNumber: true, fullName: true, department: true } },
          performedByUser: { select: { userId: true, displayName: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.nonAssetStockMovement.count({ where }),
    ]);
    return {
      items: rows.map(enrichNonAssetStockMovement),
      total,
    };
  }

  private async outstandingIssuedToRecipient(
    tx: Prisma.TransactionClient,
    stockItemId: bigint,
    employeeId?: bigint,
    department?: string,
  ): Promise<Prisma.Decimal> {
    const movements = await tx.nonAssetStockMovement.findMany({
      where: {
        stockItemId,
        movementType: { in: [NonAssetStockMovementType.ISSUE, NonAssetStockMovementType.RETURN] },
        ...(employeeId ? { employeeId } : department ? { department, employeeId: null } : {}),
      },
      select: { movementType: true, quantity: true },
    });
    let net = new Prisma.Decimal(0);
    for (const m of movements) {
      if (m.movementType === NonAssetStockMovementType.ISSUE) {
        net = net.add(m.quantity);
      } else {
        net = net.sub(m.quantity);
      }
    }
    return net;
  }

  private async replayIdempotentMovement(
    idempotencyKey: string,
    client: PrismaClient | Prisma.TransactionClient = this.prisma,
  ) {
    const existing = await client.nonAssetStockMovement.findUnique({
      where: { idempotencyKey },
      include: {
        stockItem: {
          include: {
            category: true,
            purchaseOrder: { select: { purchaseOrderId: true, poNumber: true, poDate: true } },
          },
        },
        employee: true,
        performedByUser: true,
      },
    });
    if (!existing) return null;
    return {
      movement: enrichNonAssetStockMovement(existing),
      item: enrichNonAssetStockItem(
        existing.stockItem,
        await this.aggregateTotals(existing.stockItemId, client),
      ),
    };
  }

  private async resolveIdempotency<T>(
    tx: Prisma.TransactionClient,
    idempotencyKey: string | undefined,
    run: () => Promise<T>,
  ): Promise<T> {
    if (!idempotencyKey) return run();
    const existing = await this.replayIdempotentMovement(idempotencyKey, tx);
    if (existing) return existing as T;
    try {
      return await run();
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new IdempotencyConflictError(idempotencyKey);
      }
      throw err;
    }
  }

  private async withIdempotentMutation<T>(
    idempotencyKey: string | undefined,
    run: () => Promise<T>,
  ): Promise<T> {
    const attempts = idempotencyKey ? 6 : 1;
    for (let attempt = 0; attempt < attempts; attempt++) {
      if (idempotencyKey) {
        const replay = await this.replayIdempotentMovement(idempotencyKey);
        if (replay) return replay as T;
      }
      try {
        return await run();
      } catch (err) {
        const conflict =
          err instanceof IdempotencyConflictError ||
          (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002");
        if (idempotencyKey && conflict && attempt < attempts - 1) {
          continue;
        }
        if (idempotencyKey && conflict) {
          const replay = await this.replayIdempotentMovement(idempotencyKey);
          if (replay) return replay as T;
        }
        throw err;
      }
    }
    throw new AppError(ErrorCodes.INTERNAL_ERROR, "Idempotent mutation failed", 500);
  }

  private async lockStockItem(tx: Prisma.TransactionClient, stockItemId: bigint) {
    const rows = await tx.$queryRaw<{ stock_item_id: bigint }[]>`
      SELECT stock_item_id FROM non_asset_stock_items
      WHERE stock_item_id = ${stockItemId}
      FOR UPDATE
    `;
    if (!rows.length) {
      throw new AppError(ErrorCodes.NOT_FOUND, "Non-asset stock item not found", 404);
    }
    return tx.nonAssetStockItem.findUniqueOrThrow({
      where: { stockItemId },
      include: {
        category: true,
        purchaseOrder: { select: { purchaseOrderId: true, poNumber: true, poDate: true } },
      },
    });
  }

  async issue(
    stockItemId: bigint,
    input: {
      quantity: number;
      employeeId?: bigint;
      department?: string;
      referenceReason?: string;
      idempotencyKey?: string;
    },
    ctx: AuditCtx,
  ) {
    if (!input.employeeId && !input.department?.trim()) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        "Provide an employee or department for issuance",
        422,
      );
    }
    const qty = toDecimal(input.quantity);
    assertPositiveQuantity(qty);

    if (input.employeeId) {
      const emp = await this.prisma.employee.findUnique({ where: { employeeId: input.employeeId } });
      if (!emp?.isActive) {
        throw new AppError(ErrorCodes.VALIDATION_ERROR, "Employee not found or inactive", 422);
      }
    }

    return this.withIdempotentMutation(input.idempotencyKey, () =>
      this.prisma.$transaction(async (tx) => {
        return this.resolveIdempotency(tx, input.idempotencyKey, async () => {
        const item = await this.lockStockItem(tx, stockItemId);
        const before = item.quantityAvailable;
        const after = before.sub(qty);
        assertNonNegativeAvailable(after);

        const movement = await tx.nonAssetStockMovement.create({
          data: {
            stockItemId,
            movementType: NonAssetStockMovementType.ISSUE,
            quantity: qty,
            quantityBefore: before,
            quantityAfter: after,
            employeeId: input.employeeId,
            department: input.department?.trim() || null,
            performedByUserId: ctx.actorUserId,
            referenceReason: input.referenceReason?.trim(),
            idempotencyKey: input.idempotencyKey,
          },
          include: {
            employee: { select: { employeeId: true, employeeNumber: true, fullName: true, department: true } },
            performedByUser: { select: { userId: true, displayName: true } },
          },
        });

        const updated = await tx.nonAssetStockItem.update({
          where: { stockItemId },
          data: { quantityAvailable: after },
          include: {
            category: true,
            purchaseOrder: { select: { purchaseOrderId: true, poNumber: true, poDate: true } },
          },
        });

        await this.audit.record({
          actorUserId: ctx.actorUserId,
          action: "non_asset_stock.issue",
          targetType: "non_asset_stock_item",
          targetId: String(stockItemId),
          result: "success",
          requestId: ctx.requestId,
          metadata: { quantity: input.quantity, movementId: String(movement.movementId) },
        });

        return {
          movement: enrichNonAssetStockMovement(movement),
          item: enrichNonAssetStockItem(updated, await this.aggregateTotals(stockItemId, tx)),
        };
        });
      }),
    );
  }

  async returnStock(
    stockItemId: bigint,
    input: {
      quantity: number;
      employeeId?: bigint;
      department?: string;
      referenceReason?: string;
      idempotencyKey?: string;
    },
    ctx: AuditCtx,
  ) {
    if (!input.employeeId && !input.department?.trim()) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        "Provide an employee or department for the return",
        422,
      );
    }
    const qty = toDecimal(input.quantity);
    assertPositiveQuantity(qty);

    return this.withIdempotentMutation(input.idempotencyKey, () =>
      this.prisma.$transaction(async (tx) => {
        return this.resolveIdempotency(tx, input.idempotencyKey, async () => {
        const item = await this.lockStockItem(tx, stockItemId);
        const outstanding = await this.outstandingIssuedToRecipient(
          tx,
          stockItemId,
          input.employeeId,
          input.department?.trim(),
        );
        if (qty.gt(outstanding)) {
          throw new AppError(
            ErrorCodes.VALIDATION_ERROR,
            "Return quantity exceeds outstanding issued stock for this recipient",
            422,
          );
        }

        const before = item.quantityAvailable;
        const after = before.add(qty);

        const movement = await tx.nonAssetStockMovement.create({
          data: {
            stockItemId,
            movementType: NonAssetStockMovementType.RETURN,
            quantity: qty,
            quantityBefore: before,
            quantityAfter: after,
            employeeId: input.employeeId,
            department: input.department?.trim() || null,
            performedByUserId: ctx.actorUserId,
            referenceReason: input.referenceReason?.trim(),
            idempotencyKey: input.idempotencyKey,
          },
          include: {
            employee: { select: { employeeId: true, employeeNumber: true, fullName: true, department: true } },
            performedByUser: { select: { userId: true, displayName: true } },
          },
        });

        const updated = await tx.nonAssetStockItem.update({
          where: { stockItemId },
          data: { quantityAvailable: after },
          include: {
            category: true,
            purchaseOrder: { select: { purchaseOrderId: true, poNumber: true, poDate: true } },
          },
        });

        await this.audit.record({
          actorUserId: ctx.actorUserId,
          action: "non_asset_stock.return",
          targetType: "non_asset_stock_item",
          targetId: String(stockItemId),
          result: "success",
          requestId: ctx.requestId,
          metadata: { quantity: input.quantity, movementId: String(movement.movementId) },
        });

        return {
          movement: enrichNonAssetStockMovement(movement),
          item: enrichNonAssetStockItem(updated, await this.aggregateTotals(stockItemId, tx)),
        };
        });
      }),
    );
  }

  async replenish(
    stockItemId: bigint,
    input: { quantity: number; referenceReason?: string; idempotencyKey?: string },
    ctx: AuditCtx,
  ) {
    const qty = toDecimal(input.quantity);
    assertPositiveQuantity(qty);

    return this.withIdempotentMutation(input.idempotencyKey, () =>
      this.prisma.$transaction(async (tx) => {
        return this.resolveIdempotency(tx, input.idempotencyKey, async () => {
        const item = await this.lockStockItem(tx, stockItemId);
        const before = item.quantityAvailable;
        const after = before.add(qty);

        const movement = await tx.nonAssetStockMovement.create({
          data: {
            stockItemId,
            movementType: NonAssetStockMovementType.REPLENISHMENT,
            quantity: qty,
            quantityBefore: before,
            quantityAfter: after,
            performedByUserId: ctx.actorUserId,
            referenceReason: input.referenceReason?.trim(),
            idempotencyKey: input.idempotencyKey,
          },
          include: {
            employee: { select: { employeeId: true, employeeNumber: true, fullName: true, department: true } },
            performedByUser: { select: { userId: true, displayName: true } },
          },
        });

        const updated = await tx.nonAssetStockItem.update({
          where: { stockItemId },
          data: {
            quantityAvailable: after,
            quantityOnHand: item.quantityOnHand.add(qty),
          },
          include: {
            category: true,
            purchaseOrder: { select: { purchaseOrderId: true, poNumber: true, poDate: true } },
          },
        });

        await this.audit.record({
          actorUserId: ctx.actorUserId,
          action: "non_asset_stock.replenish",
          targetType: "non_asset_stock_item",
          targetId: String(stockItemId),
          result: "success",
          requestId: ctx.requestId,
          metadata: { quantity: input.quantity, movementId: String(movement.movementId) },
        });

        return {
          movement: enrichNonAssetStockMovement(movement),
          item: enrichNonAssetStockItem(updated, await this.aggregateTotals(stockItemId, tx)),
        };
        });
      }),
    );
  }

  async writeOff(
    stockItemId: bigint,
    input: { quantity: number; referenceReason?: string; idempotencyKey?: string },
    ctx: AuditCtx,
  ) {
    const qty = toDecimal(input.quantity);
    assertPositiveQuantity(qty);

    return this.withIdempotentMutation(input.idempotencyKey, () =>
      this.prisma.$transaction(async (tx) => {
        return this.resolveIdempotency(tx, input.idempotencyKey, async () => {
        const item = await this.lockStockItem(tx, stockItemId);
        const before = item.quantityAvailable;
        const after = before.sub(qty);
        assertNonNegativeAvailable(after);

        const movement = await tx.nonAssetStockMovement.create({
          data: {
            stockItemId,
            movementType: NonAssetStockMovementType.WRITE_OFF,
            quantity: qty,
            quantityBefore: before,
            quantityAfter: after,
            performedByUserId: ctx.actorUserId,
            referenceReason: input.referenceReason?.trim(),
            idempotencyKey: input.idempotencyKey,
          },
          include: {
            employee: { select: { employeeId: true, employeeNumber: true, fullName: true, department: true } },
            performedByUser: { select: { userId: true, displayName: true } },
          },
        });

        const updated = await tx.nonAssetStockItem.update({
          where: { stockItemId },
          data: { quantityAvailable: after },
          include: {
            category: true,
            purchaseOrder: { select: { purchaseOrderId: true, poNumber: true, poDate: true } },
          },
        });

        await this.audit.record({
          actorUserId: ctx.actorUserId,
          action: "non_asset_stock.write_off",
          targetType: "non_asset_stock_item",
          targetId: String(stockItemId),
          result: "success",
          requestId: ctx.requestId,
          metadata: { quantity: input.quantity, movementId: String(movement.movementId) },
        });

        return {
          movement: enrichNonAssetStockMovement(movement),
          item: enrichNonAssetStockItem(updated, await this.aggregateTotals(stockItemId, tx)),
        };
        });
      }),
    );
  }
}
