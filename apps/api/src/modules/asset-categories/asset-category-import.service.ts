import type { PrismaClient } from "@prisma/client";
import { createAssetCategorySchema } from "./asset-category.schema.js";
import { mapRowsByHeader, parseSpreadsheetBuffer } from "../../shared/import/spreadsheet-parse.js";
import type {
  BulkImportPreviewResult,
  BulkImportPreviewRow,
  BulkImportResult,
} from "../../shared/import/bulk-import-result.js";

export class AssetCategoryImportService {
  constructor(private readonly prisma: PrismaClient) {}

  async previewBuffer(buffer: Buffer, fileName: string): Promise<BulkImportPreviewResult> {
    const { header, rows } = await parseSpreadsheetBuffer(buffer, fileName);
    const mapped = mapRowsByHeader(header, rows);
    const previewRows: BulkImportPreviewRow[] = [];
    let validCount = 0;
    let duplicateCount = 0;
    let invalidCount = 0;

    for (let i = 0; i < mapped.length; i++) {
      const rowIndex = i + 2;
      const row = mapped[i]!;
      const values = {
        categoryName: row.category_name ?? row.categoryname ?? row.categoryName ?? "",
        description: row.description ?? "",
      };
      const parsed = createAssetCategorySchema.safeParse({
        categoryName: values.categoryName,
        description: values.description || undefined,
      });
      if (!parsed.success) {
        invalidCount++;
        previewRows.push({ row: rowIndex, status: "invalid", values, message: "Invalid category row" });
        continue;
      }
      const existing = await this.prisma.assetCategory.findFirst({
        where: { categoryName: { equals: parsed.data.categoryName, mode: "insensitive" } },
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

  async importBuffer(buffer: Buffer, fileName: string): Promise<BulkImportResult> {
    const { header, rows } = await parseSpreadsheetBuffer(buffer, fileName);
    const mapped = mapRowsByHeader(header, rows);
    const result: BulkImportResult = { imported: 0, skipped: 0, errors: [] };

    for (let i = 0; i < mapped.length; i++) {
      const rowIndex = i + 2;
      const row = mapped[i]!;
      const parsed = createAssetCategorySchema.safeParse({
        categoryName: row.category_name ?? row.categoryname ?? row.categoryName,
        description: row.description || undefined,
      });
      if (!parsed.success) {
        result.errors.push({ row: rowIndex, message: "Invalid category row" });
        continue;
      }
      const existing = await this.prisma.assetCategory.findFirst({
        where: { categoryName: { equals: parsed.data.categoryName, mode: "insensitive" } },
      });
      if (existing) {
        result.skipped++;
        continue;
      }
      try {
        await this.prisma.assetCategory.create({ data: parsed.data });
        result.imported++;
      } catch {
        result.errors.push({ row: rowIndex, message: "Failed to create category" });
      }
    }
    return result;
  }
}
