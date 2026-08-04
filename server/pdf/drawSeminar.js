import { PDF_HEADER, PDF_MARGIN } from './constants.js';
import { drawWatermark, logoPath } from './draw.js';

export const SEMINAR_TOTAL_PAGES = 6;
export const SEMINAR_FOOTER_ZONE = 30;
export const SEMINAR_HEADER_LOGO_WIDTH = 68;
export const SEMINAR_HEADER_LOGO_GAP = 16;

export const SEMINAR_PDF = {
  bodySize: 9,
  headerContactSize: 8,
  headerMetaSize: 9,
  personalizationSize: 12,
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

export function addSeminarTemplatePage(doc) {
  doc.addPage({ size: 'LETTER', layout: 'portrait', margin: 0 });
  drawWatermark(doc);
  return seminarContentBox(doc);
}

function titleCaseWords(text) {
  return String(text || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function drawGoldDivider(doc, x, y, width) {
  doc
    .strokeColor(SEMINAR_COLORS.gold)
    .lineWidth(1.5)
    .moveTo(x, y)
    .lineTo(x + width, y)
    .stroke();
}

function ordinalSuffix(day) {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

function formatPreparedDateOrdinal(value) {
  if (!value) return '';
  const isoMatch = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const d = new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T12:00:00`);
    const month = d.toLocaleDateString('en-US', { month: 'long' });
    const day = d.getDate();
    return `${month} ${day}${ordinalSuffix(day)}, ${d.getFullYear()}`;
  }
  const longMatch = String(value).match(/^(\w+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (longMatch) {
    const day = Number(longMatch[2]);
    return `${longMatch[1]} ${day}${ordinalSuffix(day)}, ${longMatch[3]}`;
  }
  return String(value);
}

export function drawPersonalizationHeader(doc, payload, box) {
  const clientName = titleCaseWords(payload.clientName);
  const preparedDate = formatPreparedDateOrdinal(payload.preparedDateLong || payload.preparedDate);
  const logoY = box.y;
  const logoWidth = SEMINAR_HEADER_LOGO_WIDTH;
  const logoX = box.x + (box.width - logoWidth) / 2;
  const metaSize = SEMINAR_PDF.personalizationSize;

  doc.image(logoPath, logoX, logoY, { width: logoWidth });

  const rowY = logoY + logoWidth + SEMINAR_HEADER_LOGO_GAP;
  doc
    .font('Helvetica-Bold')
    .fontSize(metaSize)
    .fillColor(SEMINAR_COLORS.body)
    .text(`Personalized exclusively for: ${clientName}`, box.x, rowY, {
      width: box.width * 0.64,
      align: 'left',
      lineGap: 0,
    });
  doc
    .font('Helvetica-Bold')
    .fontSize(metaSize)
    .text(`On: ${preparedDate}`, box.x + box.width * 0.64, rowY, {
      width: box.width * 0.36,
      align: 'right',
      lineGap: 0,
    });

  const y = Math.max(doc.y, rowY + 14) + 10;
  drawGoldDivider(doc, box.x, y, box.width);
  return y + SEMINAR_PDF.ruleGap;
}

/** @deprecated Use drawPersonalizationHeader — page titles belong in body content. */
export function drawSeminarTemplateHeader(doc, payload, _pageTitle, box) {
  return drawPersonalizationHeader(doc, payload, box);
}

export function drawContentPageTitle(doc, title, x, y, width) {
  doc
    .font('Helvetica-Bold')
    .fontSize(SEMINAR_PDF.sectionTitleSize + 2)
    .fillColor(SEMINAR_COLORS.body)
    .text(titleCaseWords(title), x, y, { width, lineGap: 0 });
  return doc.y + SEMINAR_PDF.sectionGap;
}

export function drawSeminarTemplateFooter(doc, payload, box) {
  const { header } = payload;
  const footerTextY = box.bottom - 12;
  const ruleY = footerTextY - 12;

  drawGoldDivider(doc, box.x, ruleY, box.width);

  doc
    .font('Helvetica')
    .fontSize(SEMINAR_PDF.headerContactSize)
    .fillColor(SEMINAR_COLORS.muted)
    .text(`${header.website} · ${header.email}`, box.x, footerTextY, {
      width: box.width,
      align: 'center',
      lineGap: 0,
    });

  return ruleY;
}

export function seminarTemplateBodyBottom(box) {
  return box.bottom - SEMINAR_FOOTER_ZONE;
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

export function drawSeminarLetterhead(doc, payload, box) {
  const { header, clientName, preparedDate } = payload;
  const x = box.x;
  const w = box.width;
  const third = w / 3;
  let y = box.y;

  const drawRule = (ry) => {
    doc
      .strokeColor(SEMINAR_COLORS.rule)
      .lineWidth(0.75)
      .moveTo(x, ry)
      .lineTo(x + w, ry)
      .stroke();
  };

  drawRule(y);
  y += 8;

  doc.font('Helvetica').fontSize(SEMINAR_PDF.headerContactSize).fillColor(SEMINAR_COLORS.muted);
  doc.text(String(header.phone || ''), x, y, { width: third, align: 'left', lineGap: 0 });
  doc.text(String(header.website || ''), x + third, y, { width: third, align: 'center', lineGap: 0 });
  doc.text(String(header.email || ''), x + third * 2, y, { width: third, align: 'right', lineGap: 0 });

  y += 14;
  drawRule(y);
  y += 10;

  doc
    .font('Helvetica-Bold')
    .fontSize(SEMINAR_PDF.headerMetaSize + 1)
    .fillColor(SEMINAR_COLORS.body)
    .text(`Prepared exclusively for: ${clientName}`, x, y, { width: w * 0.68, lineGap: 0 });
  doc
    .font('Helvetica-Bold')
    .fontSize(SEMINAR_PDF.headerMetaSize + 1)
    .text(`On: ${preparedDate}`, x + w * 0.68, y, { width: w * 0.32, align: 'right', lineGap: 0 });

  y += 16;
  drawRule(y);

  return y + SEMINAR_PDF.sectionGap;
}

export function drawStartHereBox(doc, copy, x, y, width) {
  const items = copy.startHere || [];
  const pad = 16;
  const labelH = 16;
  const lineH = 15;
  const boxH = pad * 2 + labelH + 8 + items.length * lineH;

  doc.save();
  doc.roundedRect(x, y, width, boxH, 6).fill(SEMINAR_COLORS.startHere);
  doc.restore();

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(SEMINAR_COLORS.startHereText)
    .text(String(copy.startHereLabel || 'START HERE'), x + pad, y + pad, {
      width: width - pad * 2,
      characterSpacing: 1,
    });

  let itemY = y + pad + labelH + 6;
  items.forEach((line, index) => {
    const circleX = x + pad;
    const circleY = itemY - 1;
    doc.save();
    doc.circle(circleX + 6, circleY + 6, 6).fill(SEMINAR_COLORS.startHereText);
    doc.restore();
    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(SEMINAR_COLORS.startHere)
      .text(String(index + 1), circleX + 3, circleY + 1, { width: 8, align: 'center', lineGap: 0 });
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(SEMINAR_COLORS.startHereText)
      .text(String(line), x + pad + 20, itemY, { width: width - pad * 2 - 20, lineGap: 0 });
    itemY += lineH;
  });

  return y + boxH;
}

export function drawGettingStartedPage(doc, payload, box) {
  const bodyTop = drawPersonalizationHeader(doc, payload, box);

  drawContentPageTitle(doc, 'Getting Started', box.x, bodyTop, box.width);
  drawSeminarTemplateFooter(doc, payload, box);
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
