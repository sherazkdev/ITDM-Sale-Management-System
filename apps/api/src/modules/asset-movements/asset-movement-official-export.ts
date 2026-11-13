import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ExcelJS from "exceljs";
import { AssetMovementDocumentType, type PrismaClient } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import type { AppEnv } from "../../shared/config/env.js";
import { dateOnlyIso } from "../../shared/domain/expiry-reminder-policy.js";

const VALUE_COLUMN = 4;

function defaultTemplatePaths(env: AppEnv): { issuance: string; return: string } {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../..");
  const root = path.join(repoRoot, "storage", "client-templates");
  return {
    issuance:
      env.ITDMS_ISSUANCE_TEMPLATE_PATH ??
      path.join(root, "Issuance.xlsx"),
    return:
      env.ITDMS_RETURN_TEMPLATE_PATH ?? path.join(root, "Return.xlsx"),
  };
}

function setLabelValue(sheet: ExcelJS.Worksheet, labelRow: number, value: string) {
  sheet.getCell(labelRow, VALUE_COLUMN).value = value;
}

export class AssetMovementOfficialExportService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly env: AppEnv,
  ) {}

  private async loadDocument(documentId: bigint) {
    const doc = await this.prisma.assetMovementDocument.findUnique({
      where: { documentId },
      include: {
        employee: { include: { departmentRef: true } },
        processedByUser: true,
        lines: { include: { asset: true } },
      },
    });
    if (!doc) {
      throw new AppError(ErrorCodes.NOT_FOUND, "Movement document not found", 404);
    }
    return doc;
  }

  private resolveTemplatePath(documentType: AssetMovementDocumentType): string {
    const paths = defaultTemplatePaths(this.env);
    const target = documentType === AssetMovementDocumentType.ISSUANCE ? paths.issuance : paths.return;
    if (!fs.existsSync(target)) {
      throw new AppError(
        ErrorCodes.NOT_FOUND,
        `Official template file not found at ${target}`,
        404,
      );
    }
    return target;
  }

  private buildFieldMap(
    doc: Awaited<ReturnType<typeof this.loadDocument>>,
    documentType: AssetMovementDocumentType,
  ) {
    const employeeName = doc.employee
      ? `${doc.employee.fullName}${doc.employee.designation ? ` — ${doc.employee.designation}` : ""}`
      : "";
    const department =
      doc.receivingDepartment ??
      doc.employee?.departmentRef?.departmentName ??
      doc.employee?.department ??
      "";
    const locations = [
      ...new Set(
        doc.lines
          .map((l) => l.asset.currentLocation?.trim())
          .filter((v): v is string => Boolean(v)),
      ),
    ];
    const items = doc.lines.map((l) => l.asset.assetName).join("; ");
    const codes = doc.lines.map((l) => l.asset.assetCode).join("; ");
    const issuedBy = doc.processedByUser?.displayName ?? "";
    const receivedBy = doc.employee?.fullName ?? "";
    const onRequest = doc.referenceNumber?.trim() || department || employeeName;
    const txnDate = dateOnlyIso(doc.occurredAt);

    return {
      location: locations.join("; "),
      department,
      userDesignation: employeeName,
      items,
      assetCodes: codes,
      onRequest,
      issuedBy,
      receivedBy,
      dateLabel:
        documentType === AssetMovementDocumentType.RETURN ? txnDate : txnDate,
    };
  }

  async generateWorkbook(documentId: bigint): Promise<{ buffer: Buffer; filename: string }> {
    const doc = await this.loadDocument(documentId);
    const templatePath = this.resolveTemplatePath(doc.documentType);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    const sheet = workbook.worksheets[0];
    if (!sheet) {
      throw new AppError(ErrorCodes.INTERNAL_ERROR, "Template worksheet missing", 500);
    }

    const fields = this.buildFieldMap(doc, doc.documentType);
    setLabelValue(sheet, 9, fields.location);
    setLabelValue(sheet, 11, fields.department);
    setLabelValue(sheet, 13, fields.userDesignation);
    setLabelValue(sheet, 15, fields.items);
    setLabelValue(sheet, 17, fields.assetCodes);
    setLabelValue(sheet, 19, fields.onRequest);
    setLabelValue(sheet, 21, fields.issuedBy);
    setLabelValue(sheet, 23, fields.receivedBy);
    setLabelValue(sheet, 25, fields.dateLabel);

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const kind = doc.documentType === AssetMovementDocumentType.ISSUANCE ? "issuance" : "return";
    const ref = doc.referenceNumber?.trim() || String(doc.documentId);
    const filename = `ITDMS-${kind}-${ref}.xlsx`;
    return { buffer, filename };
  }
}
