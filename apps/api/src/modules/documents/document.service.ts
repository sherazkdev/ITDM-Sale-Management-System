import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import { FileStorageService } from "../../shared/storage/file-storage.js";
import {
  assertDocumentOwnerExists,
  type DocumentOwnerType,
} from "../../shared/documents/document-owner.js";
import { placeholderPdf } from "../../shared/export/tabular-export.js";
import { runInTransaction } from "../../shared/db/transaction.js";
import type { AuditService } from "../../shared/audit/audit.service.js";
import type { PrismaClient } from "@prisma/client";
import type { AppEnv } from "../../shared/config/env.js";

export class DocumentService {
  private readonly storage: FileStorageService;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly audit: AuditService,
    env: AppEnv,
  ) {
    this.storage = new FileStorageService(env.STORAGE_ROOT);
  }

  async upload(
    input: {
      ownerType: string;
      ownerId: string;
      originalFileName: string;
      mimeType: string;
      contentBase64: string;
    },
    ctx: { actorUserId?: bigint; requestId?: string },
  ) {
    const ownerType = input.ownerType as DocumentOwnerType;
    if (
      ownerType !== "purchase_order" &&
      ownerType !== "contract" &&
      ownerType !== "invoice" &&
      ownerType !== "maintenance_record"
    ) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, "Invalid owner type", 422);
    }
    await assertDocumentOwnerExists(this.prisma, ownerType, input.ownerId);

    let buffer: Buffer;
    try {
      buffer = Buffer.from(input.contentBase64, "base64");
    } catch {
      throw new AppError(ErrorCodes.BAD_REQUEST, "Invalid base64 content", 400);
    }
    const stored = await this.storage.store({
      originalFileName: input.originalFileName,
      mimeType: input.mimeType,
      buffer,
    });

    const row = await runInTransaction(this.prisma, async (tx) => {
      const doc = await tx.storedDocument.create({
        data: {
          storageKey: stored.storageKey,
          originalFileName: input.originalFileName,
          mimeType: input.mimeType,
          sizeBytes: BigInt(stored.sizeBytes),
          sha256: stored.sha256,
          uploadedByUserId: ctx.actorUserId,
        },
      });
      await tx.documentLink.create({
        data: {
          storedDocumentId: doc.storedDocumentId,
          ownerType,
          ownerId: input.ownerId,
        },
      });
      return doc;
    });

    await this.audit.record({
      actorUserId: ctx.actorUserId,
      action: "document.upload",
      targetType: ownerType,
      targetId: input.ownerId,
      result: "success",
      requestId: ctx.requestId,
      metadata: { storedDocumentId: String(row.storedDocumentId) },
    });
    return row;
  }

  async getMetadata(storedDocumentId: bigint) {
    const row = await this.prisma.storedDocument.findUnique({
      where: { storedDocumentId },
      include: { link: true },
    });
    if (!row) {
      throw new AppError(ErrorCodes.NOT_FOUND, "Document not found", 404);
    }
    return row;
  }

  async download(storedDocumentId: bigint, ctx: { actorUserId?: bigint; requestId?: string }) {
    const row = await this.getMetadata(storedDocumentId);
    if (!row.link) {
      throw new AppError(ErrorCodes.FORBIDDEN, "Document has no owner link", 403);
    }
    const buffer = await this.storage.read(row.storageKey);
    await this.audit.record({
      actorUserId: ctx.actorUserId,
      action: "document.download",
      targetType: row.link.ownerType,
      targetId: row.link.ownerId,
      result: "success",
      requestId: ctx.requestId,
      metadata: { storedDocumentId: String(storedDocumentId) },
    });
    return { row, buffer };
  }

  async generateMovementDocument(
    documentId: bigint,
    format: string,
    ctx: { actorUserId?: bigint; requestId?: string },
  ) {
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

    if (format === "pdf") {
      const lines = doc.lines.map(
        (l) => `${l.asset.assetCode}: ${l.asset.assetName} (${doc.documentType})`,
      );
      await this.audit.record({
        actorUserId: ctx.actorUserId,
        action: "document.generate_movement_placeholder_pdf",
        targetType: "asset_movement_document",
        targetId: String(documentId),
        result: "success",
        requestId: ctx.requestId,
      });
      return {
        format: "pdf",
        disclaimer: "NON-OFFICIAL PLACEHOLDER (D12)",
        contentType: "application/pdf",
        body: placeholderPdf(`Movement ${doc.documentType}`, lines),
      };
    }

    await this.audit.record({
      actorUserId: ctx.actorUserId,
      action: "document.generate_movement_json",
      targetType: "asset_movement_document",
      targetId: String(documentId),
      result: "success",
      requestId: ctx.requestId,
    });
    return doc;
  }
}
