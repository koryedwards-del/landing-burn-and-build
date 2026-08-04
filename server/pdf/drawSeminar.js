import { PDF_MARGIN } from './constants.js';

export const SEMINAR_TOTAL_PAGES = 5;

export const SEMINAR_PDF = {
  bodySize: 9,
  headerContactSize: 8,
  headerMetaSize: 9,
  sectionTitleSize: 12,
  subsectionSize: 10,
  tableHeadSize: 7.5,
  tableBodySize: 8,
  lineGap: 3,
  paragraphGap: 8,
  sectionGap: 12,
  tableRowPad: 4,
  headerGap: 6,
  ruleGap: 10,
};

export const SEMINAR_COLORS = {
  body: '#111111',
  muted: '#444444',
  rule: '#cccccc',
  tableHead: '#f2f2f2',
};

export function seminarContentBox(doc) {
  const { width, height } = doc.page;
  return {
    x: PDF_MARGIN.left,
    y: PDF_MARGIN.top,
    width: width - PDF_MARGIN.left - PDF_MARGIN.right,
    height: height - PDF_MARGIN.top - PDF_MARGIN.bottom,
    bottom: height - PDF_MARGIN.bottom,
  };
}

export function addSeminarPage(doc) {
  doc.addPage({ size: 'LETTER', layout: 'portrait', margin: 0 });
  return seminarContentBox(doc);
}

export function drawSeminarHeader(doc, payload, sectionTitle, box) {
  const { header, clientName, preparedDate } = payload;
  let y = box.y;

  doc
    .font('Helvetica')
    .fontSize(SEMINAR_PDF.headerContactSize)
    .fillColor(SEMINAR_COLORS.muted)
    .text(
      `${header.phone}\t${header.website}\t${header.email}`,
      box.x,
      y,
      { width: box.width, lineGap: 0 },
    );

  y = doc.y + SEMINAR_PDF.headerGap;
  doc
    .font('Helvetica')
    .fontSize(SEMINAR_PDF.headerMetaSize)
    .fillColor(SEMINAR_COLORS.body)
    .text(
      `Prepared exclusively for: ${clientName}  On: ${preparedDate}`,
      box.x,
      y,
      { width: box.width, lineGap: 0 },
    );

  y = doc.y + SEMINAR_PDF.sectionGap;
  doc
    .font('Helvetica-Bold')
    .fontSize(SEMINAR_PDF.sectionTitleSize)
    .fillColor(SEMINAR_COLORS.body)
    .text(String(sectionTitle || ''), box.x, y, { width: box.width, lineGap: 0 });

  y = doc.y + SEMINAR_PDF.ruleGap;
  return y;
}

export function drawParagraphs(doc, paragraphs, x, y, width) {
  let cy = y;
  (paragraphs || []).forEach((paragraph) => {
    if (!paragraph) return;
    doc
      .font('Helvetica')
      .fontSize(SEMINAR_PDF.bodySize)
      .fillColor(SEMINAR_COLORS.body)
      .text(String(paragraph), x, cy, {
        width,
        lineGap: SEMINAR_PDF.lineGap,
        align: 'left',
      });
    cy = doc.y + SEMINAR_PDF.paragraphGap;
  });
  return cy;
}

export function drawSubsectionTitle(doc, title, x, y, width) {
  doc
    .font('Helvetica-Bold')
    .fontSize(SEMINAR_PDF.subsectionSize)
    .fillColor(SEMINAR_COLORS.body)
    .text(String(title || ''), x, y, { width, lineGap: 0 });
  return doc.y + SEMINAR_PDF.headerGap;
}

export function drawTable(doc, {
  x,
  y,
  width,
  columns,
  rows,
  headerRows = 1,
}) {
  const colWidths = columns.map((col) => col.width * width);
  const rowHeight = (row, isHeader) => {
    let maxH = SEMINAR_PDF.tableBodySize + SEMINAR_PDF.tableRowPad * 2;
    columns.forEach((col, index) => {
      const cell = row[col.key] ?? '';
      const font = isHeader ? 'Helvetica-Bold' : 'Helvetica';
      const size = isHeader ? SEMINAR_PDF.tableHeadSize : SEMINAR_PDF.tableBodySize;
      const h = doc.font(font).fontSize(size).heightOfString(String(cell), {
        width: colWidths[index] - 8,
        lineGap: 0,
      });
      maxH = Math.max(maxH, h + SEMINAR_PDF.tableRowPad * 2);
    });
    return maxH;
  };

  let cy = y;
  rows.forEach((row, rowIndex) => {
    const isHeader = rowIndex < headerRows;
    const rh = rowHeight(row, isHeader);
    let cx = x;
    columns.forEach((col, index) => {
      const w = colWidths[index];
      if (isHeader) {
        doc.save();
        doc.rect(cx, cy, w, rh).fill(SEMINAR_COLORS.tableHead);
        doc.restore();
      }
      doc
        .rect(cx, cy, w, rh)
        .strokeColor(SEMINAR_COLORS.rule)
        .lineWidth(0.5)
        .stroke();
      doc
        .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(isHeader ? SEMINAR_PDF.tableHeadSize : SEMINAR_PDF.tableBodySize)
        .fillColor(SEMINAR_COLORS.body)
        .text(String(row[col.key] ?? ''), cx + 4, cy + SEMINAR_PDF.tableRowPad, {
          width: w - 8,
          lineGap: 0,
          align: col.align || 'left',
        });
      cx += w;
    });
    cy += rh;
  });

  return cy;
}
