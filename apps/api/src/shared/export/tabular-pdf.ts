import PDFDocument from "pdfkit";
import { NON_OFFICIAL_DISCLAIMER } from "./tabular-export.js";

export type TabularPdfOptions = {
  title: string;
  header: string[];
  rows: string[][];
  disclaimer?: string;
  generatedAt?: Date;
};

const PAGE_BOTTOM = 740;
const ROW_HEIGHT = 14;
const HEADER_HEIGHT = 20;
const FONT_SIZE = 8;
const TITLE_SIZE = 12;

function fitCell(text: string, maxWidth: number, doc: InstanceType<typeof PDFDocument>): string {
  const raw = text.replace(/\s+/g, " ").trim();
  if (doc.widthOfString(raw) <= maxWidth) return raw;
  let lo = 0;
  let hi = raw.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const slice = `${raw.slice(0, mid)}…`;
    if (doc.widthOfString(slice) <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return lo > 0 ? `${raw.slice(0, lo)}…` : "…";
}

/** Tabular PDF with pagination, headers, disclaimer, and page numbers — full row set (no silent truncation). */
export function buildTabularPdf(options: TabularPdfOptions): Promise<Buffer> {
  const { title, header, rows } = options;
  const disclaimer = options.disclaimer ?? NON_OFFICIAL_DISCLAIMER;
  const generatedAt = (options.generatedAt ?? new Date()).toISOString();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 40, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.info.Title = title;
    doc.info.Subject = disclaimer;
    doc.info.Creator = "ITDMS";

    const colCount = Math.max(1, header.length);
    const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colWidth = tableWidth / colCount;

    const drawPageHeader = () => {
      doc.fontSize(TITLE_SIZE).font("Helvetica-Bold").text(title, { continued: false });
      doc
        .fontSize(7)
        .font("Helvetica")
        .fillColor("#444444")
        .text(disclaimer, { width: tableWidth });
      doc.text(`Generated: ${generatedAt} · Rows: ${rows.length}`, { width: tableWidth });
      doc.fillColor("#000000");
      doc.moveDown(0.5);
    };

    const drawTableHeader = (y: number) => {
      doc.fontSize(FONT_SIZE).font("Helvetica-Bold");
      let x = doc.page.margins.left;
      for (let i = 0; i < colCount; i++) {
        const label = header[i] ?? "";
        doc.text(fitCell(label, colWidth - 4, doc), x + 2, y, {
          width: colWidth - 4,
          lineBreak: false,
        });
        x += colWidth;
      }
      doc
        .moveTo(doc.page.margins.left, y + HEADER_HEIGHT - 4)
        .lineTo(doc.page.width - doc.page.margins.right, y + HEADER_HEIGHT - 4)
        .strokeColor("#cccccc")
        .stroke();
      doc.strokeColor("#000000");
      return y + HEADER_HEIGHT;
    };

    drawPageHeader();
    let y = drawTableHeader(doc.y);

    doc.font("Helvetica").fontSize(FONT_SIZE);
    for (const row of rows) {
      if (y + ROW_HEIGHT > PAGE_BOTTOM) {
        doc.addPage();
        drawPageHeader();
        y = drawTableHeader(doc.y);
        doc.font("Helvetica").fontSize(FONT_SIZE);
      }
      let x = doc.page.margins.left;
      for (let i = 0; i < colCount; i++) {
        const cell = String(row[i] ?? "");
        doc.text(fitCell(cell, colWidth - 4, doc), x + 2, y, {
          width: colWidth - 4,
          lineBreak: false,
        });
        x += colWidth;
      }
      y += ROW_HEIGHT;
    }

    const pages = doc.bufferedPageRange();
    for (let i = pages.start; i < pages.start + pages.count; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor("#666666")
        .text(`Page ${i - pages.start + 1} of ${pages.count}`, 40, PAGE_BOTTOM + 24, {
          align: "right",
          width: tableWidth,
        });
      doc.fillColor("#000000");
    }

    doc.end();
  });
}
