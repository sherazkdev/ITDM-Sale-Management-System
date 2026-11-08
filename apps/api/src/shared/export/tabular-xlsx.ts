import ExcelJS from "exceljs";
import { NON_OFFICIAL_DISCLAIMER } from "./tabular-export.js";

export async function buildTabularXlsx(
  title: string,
  header: string[],
  rows: string[][],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ITDMS";
  const sheet = workbook.addWorksheet("Export", {
    views: [{ state: "frozen", ySplit: 3 }],
  });
  sheet.addRow([NON_OFFICIAL_DISCLAIMER]);
  sheet.addRow([title]);
  sheet.addRow(header);
  for (const row of rows) {
    sheet.addRow(row.map((c) => String(c)));
  }
  sheet.getRow(1).font = { italic: true, color: { argb: "FF666666" } };
  sheet.getRow(2).font = { bold: true };
  sheet.getRow(3).font = { bold: true };
  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}
