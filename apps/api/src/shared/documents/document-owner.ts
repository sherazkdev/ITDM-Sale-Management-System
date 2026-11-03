import { AppError } from "../errors/app-error.js";
import { ErrorCodes } from "../errors/error-codes.js";
import type { PrismaClient } from "@prisma/client";

export type DocumentOwnerType = "purchase_order" | "contract" | "invoice" | "maintenance_record";

export async function assertDocumentOwnerExists(
  prisma: PrismaClient,
  ownerType: DocumentOwnerType,
  ownerId: string,
): Promise<void> {
  if (!/^\d+$/.test(ownerId)) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, "Invalid owner id", 422);
  }
  const id = BigInt(ownerId);
  switch (ownerType) {
    case "purchase_order": {
      const row = await prisma.purchaseOrder.findUnique({ where: { purchaseOrderId: id } });
      if (!row) {
        throw new AppError(ErrorCodes.VALIDATION_ERROR, "Purchase order not found", 422);
      }
      return;
    }
    case "contract": {
      const row = await prisma.contract.findUnique({ where: { contractId: id } });
      if (!row) {
        throw new AppError(ErrorCodes.VALIDATION_ERROR, "Contract not found", 422);
      }
      return;
    }
    case "invoice": {
      const row = await prisma.invoice.findUnique({ where: { invoiceId: id } });
      if (!row) {
        throw new AppError(ErrorCodes.VALIDATION_ERROR, "Invoice not found", 422);
      }
      return;
    }
    case "maintenance_record": {
      const row = await prisma.maintenanceRecord.findUnique({ where: { maintenanceId: id } });
      if (!row) {
        throw new AppError(ErrorCodes.VALIDATION_ERROR, "Maintenance record not found", 422);
      }
      return;
    }
    default:
      throw new AppError(ErrorCodes.VALIDATION_ERROR, "Unsupported owner type", 422);
  }
}

export async function listDocumentsForOwner(
  prisma: PrismaClient,
  ownerType: DocumentOwnerType,
  ownerId: string,
) {
  return prisma.documentLink.findMany({
    where: { ownerType, ownerId },
    include: {
      storedDocument: {
        select: {
          storedDocumentId: true,
          originalFileName: true,
          mimeType: true,
          sizeBytes: true,
          sha256: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
