import type { PrismaClient } from "@prisma/client";
import { createVendorSchema } from "./vendor.schema.js";
import { mapRowsByHeader, parseSpreadsheetBuffer } from "../../shared/import/spreadsheet-parse.js";
import type { BulkImportResult } from "../../shared/import/bulk-import-result.js";

export class VendorImportService {
  constructor(private readonly prisma: PrismaClient) {}

  async importBuffer(buffer: Buffer, fileName: string): Promise<BulkImportResult> {
    const { header, rows } = await parseSpreadsheetBuffer(buffer, fileName);
    const mapped = mapRowsByHeader(header, rows);
    const result: BulkImportResult = { imported: 0, skipped: 0, errors: [] };

    for (let i = 0; i < mapped.length; i++) {
      const rowIndex = i + 2;
      const row = mapped[i]!;
      const parsed = createVendorSchema.safeParse({
        vendorName: row.vendor_name ?? row.vendorname ?? row.vendorName,
        registrationNumber: row.registration_number || row.registrationnumber || undefined,
        contactPerson: row.contact_person || undefined,
        phone: row.phone || undefined,
        email: row.email || undefined,
        address: row.address || undefined,
      });
      if (!parsed.success) {
        result.errors.push({ row: rowIndex, message: "Invalid vendor row" });
        continue;
      }
      const existing = await this.prisma.vendor.findFirst({
        where: { vendorName: { equals: parsed.data.vendorName, mode: "insensitive" } },
      });
      if (existing) {
        result.skipped++;
        continue;
      }
      try {
        await this.prisma.vendor.create({ data: { ...parsed.data, isActive: true } });
        result.imported++;
      } catch {
        result.errors.push({ row: rowIndex, message: "Failed to create vendor" });
      }
    }
    return result;
  }
}
