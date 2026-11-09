import type { PrismaClient } from "@prisma/client";
import type { AuditService } from "../../shared/audit/audit.service.js";
import { mapRowsByHeader, parseSpreadsheetBuffer } from "../../shared/import/spreadsheet-parse.js";
import type {
  BulkImportPreviewResult,
  BulkImportPreviewRow,
  BulkImportResult,
} from "../../shared/import/bulk-import-result.js";
import { slugDepartmentCode } from "./department-code.js";

export class DepartmentImportService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly audit: AuditService,
  ) {}

  async previewBuffer(buffer: Buffer, fileName: string): Promise<BulkImportPreviewResult> {
    const { header, rows } = await parseSpreadsheetBuffer(buffer, fileName);
    const mapped = mapRowsByHeader(header, rows);
    const previewRows: BulkImportPreviewRow[] = [];
    let validCount = 0;
    let duplicateCount = 0;
    let invalidCount = 0;

    for (let i = 0; i < mapped.length; i++) {
      const rowIndex = i + 2;
      const raw = mapped[i]!;
      const name = (raw.department_name ?? raw.departmentname ?? raw.name ?? "").trim();
      const values = {
        departmentName: name,
        departmentCode: (raw.department_code ?? raw.departmentcode ?? "").trim(),
      };
      if (!name) {
        invalidCount++;
        previewRows.push({ row: rowIndex, status: "invalid", values, message: "departmentName required" });
        continue;
      }
      const code = (values.departmentCode || slugDepartmentCode(name)).trim();
      const existing = await this.prisma.department.findFirst({
        where: {
          OR: [{ departmentCode: code }, { departmentName: { equals: name, mode: "insensitive" } }],
        },
      });
      if (existing) {
        duplicateCount++;
        previewRows.push({ row: rowIndex, status: "duplicate", values });
        continue;
      }
      validCount++;
      previewRows.push({ row: rowIndex, status: "valid", values });
    }

    return {
      totalRows: mapped.length,
      validCount,
      duplicateCount,
      invalidCount,
      rows: previewRows.slice(0, 200),
    };
  }

  async importBuffer(
    buffer: Buffer,
    fileName: string,
    actorUserId?: bigint,
    requestId?: string,
  ): Promise<BulkImportResult> {
    const { header, rows } = await parseSpreadsheetBuffer(buffer, fileName);
    const mapped = mapRowsByHeader(header, rows);
    const result: BulkImportResult = { imported: 0, skipped: 0, errors: [] };

    for (let i = 0; i < mapped.length; i++) {
      const rowIndex = i + 2;
      const raw = mapped[i]!;
      const name = (raw.department_name ?? raw.departmentname ?? raw.name ?? "").trim();
      if (!name) {
        result.errors.push({ row: rowIndex, message: "departmentName required" });
        continue;
      }
      const code = (raw.department_code ?? raw.departmentcode ?? slugDepartmentCode(name)).trim();
      const existing = await this.prisma.department.findFirst({
        where: { OR: [{ departmentCode: code }, { departmentName: { equals: name, mode: "insensitive" } }] },
      });
      if (existing) {
        result.skipped++;
        continue;
      }
      try {
        await this.prisma.department.create({
          data: {
            departmentCode: code,
            departmentName: name,
            description: raw.description || undefined,
          },
        });
        result.imported++;
      } catch {
        result.errors.push({ row: rowIndex, message: "Failed to create department" });
      }
    }

    if (result.imported > 0) {
      await this.audit.record({
        actorUserId,
        action: "department.import",
        targetType: "department",
        targetId: "bulk",
        result: "success",
        requestId,
        metadata: { imported: result.imported, skipped: result.skipped },
      });
    }
    return result;
  }
}
