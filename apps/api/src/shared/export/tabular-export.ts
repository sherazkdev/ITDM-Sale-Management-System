import { AppError } from "../errors/app-error.js";
import { ErrorCodes } from "../errors/error-codes.js";

/** Non-official export formats — not client template compliance (D12). */
export type ExportFormat = "json" | "csv" | "pdf" | "xlsx";

const NON_OFFICIAL_DISCLAIMER =
  "NON-OFFICIAL EXPORT — not an approved organizational template (D12). For operational use only.";

export function parseExportFormat(raw: string): ExportFormat {
  if (raw === "json" || raw === "csv" || raw === "pdf" || raw === "xlsx") {
    return raw;
  }
  throw new AppError(ErrorCodes.BAD_REQUEST, "Unsupported format", 400);
}

export function csvFromRows(header: string[], rows: string[][]): string {
  const escape = (value: string): string => {
    if (/^[=+\-@]/.test(value)) {
      return `'${value}`;
    }
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };
  const lines = [header.map(escape).join(",")];
  for (const row of rows) {
    lines.push(row.map((c) => escape(String(c))).join(","));
  }
  return lines.join("\n");
}

/** Minimal PDF (text lines) — placeholder infrastructure only. */
export function placeholderPdf(title: string, lines: string[]): Buffer {
  const content = [NON_OFFICIAL_DISCLAIMER, "", title, "", ...lines].join("\n");
  const escaped = content.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const stream = `BT /F1 10 Tf 50 750 Td (${escaped.replace(/\n/g, ") Tj T* (")}) Tj ET`;
  const pdf = `%PDF-1.4
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj
4 0 obj<< /Length ${stream.length} >>stream
${stream}
endstream endobj
5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000240 00000 n 
0000000400 00000 n 
trailer<< /Size 6 /Root 1 0 R >>
startxref
480
%%EOF`;
  return Buffer.from(pdf, "utf8");
}

/** Spreadsheet XML (Excel 2003 XML) — opens in Excel; placeholder only. */
export function placeholderXlsxSheet(title: string, header: string[], rows: string[][]): Buffer {
  const xmlRows = [
    `<Row><Cell><Data ss:Type="String">${NON_OFFICIAL_DISCLAIMER}</Data></Cell></Row>`,
    `<Row><Cell><Data ss:Type="String">${title}</Data></Cell></Row>`,
    `<Row>${header.map((h) => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join("")}</Row>`,
    ...rows.map(
      (r) =>
        `<Row>${r.map((c) => `<Cell><Data ss:Type="String">${String(c).replace(/&/g, "&amp;").replace(/</g, "&lt;")}</Data></Cell>`).join("")}</Row>`,
    ),
  ].join("");
  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Export"><Table>${xmlRows}</Table></Worksheet></Workbook>`;
  return Buffer.from(xml, "utf8");
}

export { NON_OFFICIAL_DISCLAIMER };
