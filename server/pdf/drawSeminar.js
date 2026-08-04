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

export function drawProgramCoverPage(doc, payload) {
  const cover = payload.stepsToSuccess;
  const { clientName, preparedDate } = payload;
  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const leftW = pageW * 0.36;
  const pad = 40;
  const rightPad = 32;
  const rightX = leftW + rightPad;
  const rightW = pageW - leftW - rightPad * 2;

  doc.rect(0, 0, leftW, pageH).fill(SEMINAR_COLORS.panel);

  doc
    .save()
    .rect(pad - 8, pad - 8, 22, 22)
    .fill(SEMINAR_COLORS.gold)
    .restore();
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(SEMINAR_COLORS.panel)
    .text('1', pad - 8, pad - 5, { width: 22, align: 'center', lineGap: 0 });

  doc.image(logoPath, pad, pad + 22, { width: 46 });

  doc
    .font('Helvetica-Bold')
    .fontSize(7.5)
    .fillColor(SEMINAR_COLORS.panelMuted)
    .text('BURN & BUILD PROGRAM', pad, pad + 74, {
      width: leftW - pad * 2,
      characterSpacing: 1.4,
    });

  const titleY = pageH * 0.38;
  doc
    .font('Helvetica-Bold')
    .fontSize(26)
    .fillColor('#ffffff')
    .text('YOUR ', pad, titleY, { continued: true, lineGap: 0 });
  doc
    .fillColor(SEMINAR_COLORS.gold)
    .text('BURN &\n', { continued: true, lineGap: 2 });
  doc
    .fillColor('#ffffff')
    .text('BUILD\nPROGRAM', { width: leftW - pad * 2, lineGap: 2 });

  const metaY = pageH - pad - 52;
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(SEMINAR_COLORS.panelMuted)
    .text('Prepared exclusively for', pad, metaY, { width: leftW - pad * 2, lineGap: 0 });
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor('#ffffff')
    .text(String(clientName || 'YOU'), pad, doc.y + 4, { width: leftW - pad * 2, lineGap: 0 });
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(SEMINAR_COLORS.panelMuted)
    .text(`Prepared on ${String(preparedDate || '')}`, pad, doc.y + 10, {
      width: leftW - pad * 2,
      lineGap: 0,
    });

  let y = pad + 18;
  doc
    .font('Helvetica-Bold')
    .fontSize(28)
    .fillColor(SEMINAR_COLORS.body)
    .text('WELCOME', rightX, y, { width: rightW, lineGap: 0 });

  y = doc.y + 16;
  (cover.intro || []).forEach((paragraph) => {
    doc
      .font('Helvetica')
      .fontSize(9.5)
      .fillColor(SEMINAR_COLORS.muted)
      .text(String(paragraph), rightX, y, { width: rightW, lineGap: 4 });
    y = doc.y + 12;
  });

  const boxPad = 14;
  const boxX = rightX;
  const boxW = rightW;
  const labelH = 18;
  const steps = cover.steps || [];
  const stepLineH = 14;
  const boxH = boxPad * 2 + labelH + 8 + steps.length * stepLineH;

  doc.save();
  doc.roundedRect(boxX, y, boxW, boxH, 4).fill(SEMINAR_COLORS.startHere);
  doc.restore();

  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(SEMINAR_COLORS.startHereText)
    .text(String(cover.startHereLabel || 'START HERE'), boxX + boxPad, y + boxPad, {
      width: boxW - boxPad * 2,
      characterSpacing: 1.2,
    });

  let stepY = y + boxPad + labelH + 4;
  steps.forEach((step, index) => {
    const line = step.text || step.title || '';
    doc
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .fillColor(SEMINAR_COLORS.startHereText)
      .text(`${index + 1}.`, boxX + boxPad, stepY, { continued: true, lineGap: 0 });
    doc
      .font('Helvetica')
      .text(`  ${line}`, { width: boxW - boxPad * 2 - 12, lineGap: 0 });
    stepY = doc.y + 4;
  });

  y = y + boxH + 16;
  const motto = String(cover.motto || '');
  if (motto) {
    const mottoPad = 12;
    const mottoH = 36;
    doc
      .roundedRect(boxX, y, boxW, mottoH, 3)
      .strokeColor(SEMINAR_COLORS.body)
      .lineWidth(1)
      .stroke();
    doc
      .font('Helvetica-BoldOblique')
      .fontSize(10)
      .fillColor(SEMINAR_COLORS.body)
      .text(motto, boxX + mottoPad, y + mottoPad - 2, {
        width: boxW - mottoPad * 2,
        align: 'center',
        lineGap: 0,
      });
  }

  const footerY = pageH - 28;
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(SEMINAR_COLORS.muted)
    .text(
      `Prepared for ${String(clientName || 'You')} · ${String(preparedDate || '')}`,
      pad,
      footerY,
      { width: pageW - pad * 2, align: 'center', lineGap: 0 },
    );
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

export function drawNumberedSteps(doc, steps, x, y, width) {
  const numberCol = 22;
  const gap = 10;
  const textX = x + numberCol + gap;
  const textWidth = width - numberCol - gap;
  let cy = y;

  (steps || []).forEach((step, index) => {
    const number = String(index + 1);
    const titleY = cy;

    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor(SEMINAR_COLORS.gold)
      .text(number, x, titleY, { width: numberCol, align: 'right', lineGap: 0 });

    doc
      .font('Helvetica-Bold')
      .fontSize(SEMINAR_PDF.subsectionSize)
      .fillColor(SEMINAR_COLORS.body)
      .text(String(step.title || ''), textX, titleY, { width: textWidth, lineGap: 0 });

    const bodyY = doc.y + 2;
    doc
      .font('Helvetica')
      .fontSize(SEMINAR_PDF.bodySize)
      .fillColor(SEMINAR_COLORS.muted)
      .text(String(step.body || ''), textX, bodyY, {
        width: textWidth,
        lineGap: SEMINAR_PDF.lineGap,
      });

    cy = doc.y + 10;
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
