import { PDF_HEADER, PDF_MARGIN } from './constants.js';
import { logoPath } from './draw.js';

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
  gold: '#fdc500',
  brand: '#888888',
  panel: '#111111',
  panelMuted: '#cccccc',
  startHere: '#fdc500',
  startHereText: '#111111',
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

export function drawStepsToSuccessHeader(doc, payload, box) {
  const { header, clientName, preparedDate } = payload;
  const logoY = box.y;
  const textX = box.x + PDF_HEADER.logoWidth + 14;
  const textWidth = box.width - PDF_HEADER.logoWidth - 14;

  doc.image(logoPath, box.x, logoY, { width: PDF_HEADER.logoWidth });

  doc
    .font('Helvetica-Bold')
    .fontSize(SEMINAR_PDF.headerContactSize)
    .fillColor(SEMINAR_COLORS.brand)
    .text('BURN & BUILD DIET', textX, logoY + 1, {
      width: textWidth,
      characterSpacing: 1.2,
    });

  doc
    .font('Helvetica')
    .fontSize(SEMINAR_PDF.headerContactSize)
    .fillColor(SEMINAR_COLORS.muted)
    .text(
      `${header.phone}  ·  ${header.website}  ·  ${header.email}`,
      textX,
      doc.y + 3,
      { width: textWidth, lineGap: 0 },
    );

  doc
    .font('Helvetica')
    .fontSize(SEMINAR_PDF.headerMetaSize)
    .fillColor(SEMINAR_COLORS.body)
    .text(
      `Prepared exclusively for: ${clientName}  ·  ${preparedDate}`,
      textX,
      doc.y + 4,
      { width: textWidth, lineGap: 0 },
    );

  let y = Math.max(doc.y, logoY + PDF_HEADER.logoWidth) + SEMINAR_PDF.sectionGap;
  doc
    .font('Helvetica-Bold')
    .fontSize(SEMINAR_PDF.sectionTitleSize + 2)
    .fillColor(SEMINAR_COLORS.body)
    .text('Steps to Success', box.x, y, { width: box.width, lineGap: 0 });

  y = doc.y + 6;
  doc
    .strokeColor(SEMINAR_COLORS.gold)
    .lineWidth(2)
    .moveTo(box.x, y)
    .lineTo(box.x + box.width, y)
    .stroke();

  return y + SEMINAR_PDF.ruleGap;
}

function drawStartHereBlock(doc, step, x, y, width) {
  const items = step.startHere || [];
  if (!items.length) return y;

  const pad = 10;
  const labelH = 14;
  const lineH = 13;
  const boxH = pad * 2 + labelH + items.length * lineH;
  doc.save();
  doc.roundedRect(x, y, width, boxH, 3).fill(SEMINAR_COLORS.startHere);
  doc.restore();

  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(SEMINAR_COLORS.startHereText)
    .text(String(step.startHereLabel || 'Start here').toUpperCase(), x + pad, y + pad, {
      width: width - pad * 2,
      characterSpacing: 0.8,
    });

  let itemY = y + pad + labelH;
  items.forEach((line, index) => {
    doc
      .font('Helvetica-Bold')
      .fontSize(SEMINAR_PDF.bodySize)
      .fillColor(SEMINAR_COLORS.startHereText)
      .text(`${index + 1}.`, x + pad, itemY, { continued: true, lineGap: 0 });
    doc
      .font('Helvetica')
      .text(`  ${line}`, { width: width - pad * 2 - 12, lineGap: 0 });
    itemY = doc.y + 3;
  });

  return y + boxH + 8;
}

export function drawNumberedSteps(doc, steps, x, y, width) {
  const numberCol = 22;
  const gap = 10;
  const textX = x + numberCol + gap;
  const textWidth = width - numberCol - gap;
  let cy = y;

  (steps || []).forEach((step, index) => {
    const number = String(index + 1);
    const titleY = cy;
    const title = step.title || step.text || '';

    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor(SEMINAR_COLORS.gold)
      .text(number, x, titleY, { width: numberCol, align: 'right', lineGap: 0 });

    doc
      .font('Helvetica-Bold')
      .fontSize(SEMINAR_PDF.subsectionSize)
      .fillColor(SEMINAR_COLORS.body)
      .text(String(title), textX, titleY, { width: textWidth, lineGap: 0 });

    let blockY = doc.y + 2;
    if (step.body) {
      doc
        .font('Helvetica')
        .fontSize(SEMINAR_PDF.bodySize)
        .fillColor(SEMINAR_COLORS.muted)
        .text(String(step.body), textX, blockY, {
          width: textWidth,
          lineGap: SEMINAR_PDF.lineGap,
        });
      blockY = doc.y + 6;
    }

    if (step.startHere?.length) {
      blockY = drawStartHereBlock(doc, step, textX, blockY, textWidth);
    }

    cy = blockY + 6;
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
