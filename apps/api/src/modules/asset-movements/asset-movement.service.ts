import { AssetMovementDocumentType, AssetTransactionType } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import {
  AssetStatus,
  assertIssueEligible,
  assertReturnEligible,
} from "../../shared/domain/asset-status.js";
import { runInTransaction } from "../../shared/db/transaction.js";
import type { AuditService } from "../../shared/audit/audit.service.js";
import type { PrismaClient } from "@prisma/client";

type MovementLine = { assetId: bigint; conditionNotes?: string };

export class AssetMovementService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly audit: AuditService,
  ) {}

  private ensureUniqueAssetIds(lines: MovementLine[]) {
    const ids = lines.map((l) => l.assetId.toString());
    if (new Set(ids).size !== ids.length) {
      throw new AppError(ErrorCodes.CONFLICT, "Duplicate asset in movement payload", 409);
    }
  }

  private sortedAssetIds(lines: MovementLine[]): bigint[] {
    return [...lines.map((l) => l.assetId)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  async issueAssets(
    input: {
      employeeId: bigint;
      referenceNumber?: string;
      occurredAt?: string;
      assets: MovementLine[];
    },
    actor: { userId: bigint; requestId?: string },
  ) {
    this.ensureUniqueAssetIds(input.assets);
    const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();

    const employee = await this.prisma.employee.findUnique({ where: { employeeId: input.employeeId } });
    if (!employee || !employee.isActive) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, "Employee not found or inactive", 422);
    }

    return runInTransaction(this.prisma, async (tx) => {
      for (const assetId of this.sortedAssetIds(input.assets)) {
        await tx.$queryRaw`SELECT asset_id FROM assets WHERE asset_id = ${assetId} FOR UPDATE`;
      }

      const document = await tx.assetMovementDocument.create({
        data: {
          documentType: AssetMovementDocumentType.ISSUANCE,
          referenceNumber: input.referenceNumber,
          employeeId: input.employeeId,
          processedByUserId: actor.userId,
          occurredAt,
        },
      });

      for (const line of input.assets) {
        const asset = await tx.asset.findUnique({ where: { assetId: line.assetId } });
        if (!asset) {
          throw new AppError(ErrorCodes.NOT_FOUND, `Asset ${line.assetId} not found`, 404);
        }
        try {
          assertIssueEligible(asset.assetStatus);
        } catch {
          throw new AppError(ErrorCodes.CONFLICT, `Asset ${asset.assetCode} is not available to issue`, 409);
        }
        if (asset.currentAssigneeEmployeeId) {
          throw new AppError(ErrorCodes.CONFLICT, `Asset ${asset.assetCode} already assigned`, 409);
        }

        const transaction = await tx.assetTransaction.create({
          data: {
            assetId: line.assetId,
            employeeId: input.employeeId,
            transactionType: AssetTransactionType.ISSUE,
            transactionDate: occurredAt,
            conditionNotes: line.conditionNotes,
            referenceNumber: input.referenceNumber,
            processedByUserId: actor.userId,
            movementDocumentId: document.documentId,
          },
        });

        await tx.assetMovementDocumentLine.create({
          data: {
            documentId: document.documentId,
            assetId: line.assetId,
            transactionId: transaction.transactionId,
          },
        });

        await tx.asset.update({
          where: { assetId: line.assetId },
          data: {
            assetStatus: AssetStatus.issued,
            currentAssigneeEmployeeId: input.employeeId,
          },
        });
      }

      await this.audit.record({
        actorUserId: actor.userId,
        action: "asset.issue",
        targetType: "asset_movement_document",
        targetId: String(document.documentId),
        result: "success",
        requestId: actor.requestId,
      });

      return tx.assetMovementDocument.findUnique({
        where: { documentId: document.documentId },
        include: {
          lines: { include: { asset: true, transaction: true } },
          employee: true,
        },
      });
    });
  }

  async returnAssets(
    input: {
      employeeId: bigint;
      referenceNumber?: string;
      occurredAt?: string;
      assets: MovementLine[];
    },
    actor: { userId: bigint; requestId?: string },
  ) {
    this.ensureUniqueAssetIds(input.assets);
    const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();

    return runInTransaction(this.prisma, async (tx) => {
      for (const assetId of this.sortedAssetIds(input.assets)) {
        await tx.$queryRaw`SELECT asset_id FROM assets WHERE asset_id = ${assetId} FOR UPDATE`;
      }

      const document = await tx.assetMovementDocument.create({
        data: {
          documentType: AssetMovementDocumentType.RETURN,
          referenceNumber: input.referenceNumber,
          employeeId: input.employeeId,
          processedByUserId: actor.userId,
          occurredAt,
        },
      });

      for (const line of input.assets) {
        const asset = await tx.asset.findUnique({ where: { assetId: line.assetId } });
        if (!asset) {
          throw new AppError(ErrorCodes.NOT_FOUND, `Asset ${line.assetId} not found`, 404);
        }
        try {
          assertReturnEligible(asset.assetStatus);
        } catch {
          throw new AppError(ErrorCodes.CONFLICT, `Asset ${asset.assetCode} is not issued`, 409);
        }
        if (asset.currentAssigneeEmployeeId !== input.employeeId) {
          throw new AppError(
            ErrorCodes.CONFLICT,
            `Asset ${asset.assetCode} is not held by the specified employee`,
            409,
          );
        }

        const transaction = await tx.assetTransaction.create({
          data: {
            assetId: line.assetId,
            employeeId: input.employeeId,
            transactionType: AssetTransactionType.RETURN,
            transactionDate: occurredAt,
            conditionNotes: line.conditionNotes,
            referenceNumber: input.referenceNumber,
            processedByUserId: actor.userId,
            movementDocumentId: document.documentId,
          },
        });

        await tx.assetMovementDocumentLine.create({
          data: {
            documentId: document.documentId,
            assetId: line.assetId,
            transactionId: transaction.transactionId,
          },
        });

        await tx.asset.update({
          where: { assetId: line.assetId },
          data: {
            assetStatus: AssetStatus.inStock,
            currentAssigneeEmployeeId: null,
          },
        });
      }

      await this.audit.record({
        actorUserId: actor.userId,
        action: "asset.return",
        targetType: "asset_movement_document",
        targetId: String(document.documentId),
        result: "success",
        requestId: actor.requestId,
      });

      return tx.assetMovementDocument.findUnique({
        where: { documentId: document.documentId },
        include: {
          lines: { include: { asset: true, transaction: true } },
          employee: true,
        },
      });
    });
  }

  async getDocument(documentId: bigint) {
    const doc = await this.prisma.assetMovementDocument.findUnique({
      where: { documentId },
      include: {
        lines: { include: { asset: true, transaction: true } },
        employee: true,
      },
    });
    if (!doc) {
      throw new AppError(ErrorCodes.NOT_FOUND, "Movement document not found", 404);
    }
    return doc;
  }

  async getCurrentHolder(assetId: bigint) {
    const asset = await this.prisma.asset.findUnique({
      where: { assetId },
      include: { currentAssignee: true },
    });
    if (!asset) {
      throw new AppError(ErrorCodes.NOT_FOUND, "Asset not found", 404);
    }
    return {
      assetId: asset.assetId,
      assetCode: asset.assetCode,
      assetStatus: asset.assetStatus,
      holder: asset.currentAssignee,
    };
  }
}
