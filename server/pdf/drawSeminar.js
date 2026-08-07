import { PDF_HEADER, PDF_MARGIN } from './constants.js';
import { drawWatermark, logoPath } from './draw.js';
import {
  addFramePage,
  drawFrameFooter,
  drawFrameHeader,
  drawFramePageTitle,
  drawGoldDivider,
  frameContentContainer,
  PDF_FRAME_FONTS,
  PDF_FRAME_TAGLINE,
} from './drawFrame.js';

export { PDF_FRAME_TAGLINE };

export const SEMINAR_TOTAL_PAGES = 6;
export const SEMINAR_FOOTER_ZONE = 30;
export const SEMINAR_HEADER_LOGO_WIDTH = 68;
export const SEMINAR_HEADER_LOGO_GAP = 16;

export const SEMINAR_FONTS = PDF_FRAME_FONTS;

export const SEMINAR_PDF = {
  bodySize: 9,
  headerContactSize: 8,
  headerMetaSize: 9,
  personalizationSize: 12,
  contentPageTitleSize: 18,
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
  return addFramePage(doc);
}

function titleCaseWords(text) {
  return String(text || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export { drawGoldDivider };

export function drawPersonalizationHeader(doc, payload, box) {
  return drawFrameHeader(doc, box, {
    personalized: true,
    clientName: payload.clientName,
    preparedDateLong: payload.preparedDateLong,
    preparedDate: payload.preparedDate,
  });
}

/** @deprecated Use drawPersonalizationHeader — page titles belong in body content. */
export function drawSeminarTemplateHeader(doc, payload, _pageTitle, box) {
  return drawPersonalizationHeader(doc, payload, box);
}

export function drawContentPageTitle(doc, title, x, y, width) {
  return drawFramePageTitle(doc, title, x, y, width);
}

export function drawSeminarTemplateFooter(doc, payload, box) {
  return drawFrameFooter(doc, box, payload.header);
}

export function seminarTemplateBodyBottom(box) {
  return box.bottom - SEMINAR_FOOTER_ZONE;
}

export function drawSeminarHeader(doc, payload, sectionTitle, box) {
  const { header, clientName, preparedDate } = payload;
  let y = box.y;

  doc
    .font(SEMINAR_FONTS.regular)
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
    .font(SEMINAR_FONTS.regular)
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
    .font(SEMINAR_FONTS.bold)
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
      .font(SEMINAR_FONTS.regular)
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

  doc.font(SEMINAR_FONTS.regular).fontSize(SEMINAR_PDF.headerContactSize).fillColor(SEMINAR_COLORS.muted);
  doc.text(String(header.phone || ''), x, y, { width: third, align: 'left', lineGap: 0 });
  doc.text(String(header.website || ''), x + third, y, { width: third, align: 'center', lineGap: 0 });
  doc.text(String(header.email || ''), x + third * 2, y, { width: third, align: 'right', lineGap: 0 });

  y += 14;
  drawRule(y);
  y += 10;

  doc
    .font(SEMINAR_FONTS.bold)
    .fontSize(SEMINAR_PDF.headerMetaSize + 1)
    .fillColor(SEMINAR_COLORS.body)
    .text(`Prepared exclusively for: ${clientName}`, x, y, { width: w * 0.68, lineGap: 0 });
  doc
    .font(SEMINAR_FONTS.bold)
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
    .font(SEMINAR_FONTS.bold)
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
      .font(SEMINAR_FONTS.bold)
      .fontSize(8)
      .fillColor(SEMINAR_COLORS.startHere)
      .text(String(index + 1), circleX + 3, circleY + 1, { width: 8, align: 'center', lineGap: 0 });
    doc
      .font(SEMINAR_FONTS.regular)
      .fontSize(10)
      .fillColor(SEMINAR_COLORS.startHereText)
      .text(String(line), x + pad + 20, itemY, { width: width - pad * 2 - 20, lineGap: 0 });
    itemY += lineH;
  });

  return y + boxH;
}

export function drawGettingStartedPage(doc, payload, box) {
  const topGoldY = drawPersonalizationHeader(doc, payload, box);
  const container = frameContentContainer(box, topGoldY);

  drawContentPageTitle(doc, 'Getting Started', box.x, container.top, box.width);
}

export function drawStepsToSuccessHeader(doc, payload, box) {
  const { header, clientName, preparedDate } = payload;
  const logoY = box.y;
  const textX = box.x + PDF_HEADER.logoWidth + 14;
  const textWidth = box.width - PDF_HEADER.logoWidth - 14;

  doc.image(logoPath, box.x, logoY, { width: PDF_HEADER.logoWidth });

  doc
    .font(SEMINAR_FONTS.bold)
    .fontSize(SEMINAR_PDF.headerContactSize)
    .fillColor(SEMINAR_COLORS.brand)
    .text('BURN & BUILD DIET', textX, logoY + 1, {
      width: textWidth,
      characterSpacing: 1.2,
    });

  doc
    .font(SEMINAR_FONTS.regular)
    .fontSize(SEMINAR_PDF.headerContactSize)
    .fillColor(SEMINAR_COLORS.muted)
    .text(
      `${header.phone}  ·  ${header.website}  ·  ${header.email}`,
      textX,
      doc.y + 3,
      { width: textWidth, lineGap: 0 },
    );

  doc
    .font(SEMINAR_FONTS.regular)
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
    .font(SEMINAR_FONTS.bold)
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
    .font(SEMINAR_FONTS.bold)
    .fontSize(8)
    .fillColor(SEMINAR_COLORS.startHereText)
    .text(String(step.startHereLabel || 'Start here').toUpperCase(), x + pad, y + pad, {
      width: width - pad * 2,
      characterSpacing: 0.8,
    });

  let itemY = y + pad + labelH;
  items.forEach((line, index) => {
    doc
      .font(SEMINAR_FONTS.bold)
      .fontSize(SEMINAR_PDF.bodySize)
      .fillColor(SEMINAR_COLORS.startHereText)
      .text(`${index + 1}.`, x + pad, itemY, { continued: true, lineGap: 0 });
    doc
      .font(SEMINAR_FONTS.regular)
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
      .font(SEMINAR_FONTS.bold)
      .fontSize(14)
      .fillColor(SEMINAR_COLORS.gold)
      .text(number, x, titleY, { width: numberCol, align: 'right', lineGap: 0 });

    doc
      .font(SEMINAR_FONTS.bold)
      .fontSize(SEMINAR_PDF.subsectionSize)
      .fillColor(SEMINAR_COLORS.body)
      .text(String(title), textX, titleY, { width: textWidth, lineGap: 0 });

    let blockY = doc.y + 2;
    if (step.body) {
      doc
        .font(SEMINAR_FONTS.regular)
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
    .font(SEMINAR_FONTS.bold)
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
      const font = isHeader ? SEMINAR_FONTS.bold : SEMINAR_FONTS.regular;
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
        .font(isHeader ? SEMINAR_FONTS.bold : SEMINAR_FONTS.regular)
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

const MACRO_SIGNAL_PDF = {
  bg: '#e8e8e8',
  border: SEMINAR_COLORS.gold,
  headerH: 26,
  rowH: 54,
  iconSize: 22,
  radius: 8,
};

function drawMacroSignalPdfIcon(doc, id, x, y, size) {
  const scale = size / 40;
  doc.save();
  doc.translate(x, y);
  doc.scale(scale);
  doc.fillColor(SEMINAR_COLORS.body);

  if (id === 'protein') {
    doc.moveTo(6, 28)
      .bezierCurveTo(6, 20, 10, 14, 16, 12)
      .bezierCurveTo(18, 6, 24, 4, 30, 6)
      .bezierCurveTo(34, 14, 32, 24, 26, 30)
      .bezierCurveTo(20, 36, 12, 38, 6, 28)
      .fill();
    doc.moveTo(30, 10)
      .bezierCurveTo(32, 16, 30, 22, 26, 26)
      .lineWidth(2)
      .strokeColor(SEMINAR_COLORS.body)
      .stroke();
  } else if (id === 'carbohydrates') {
    doc.roundedRect(4, 14, 16, 20, 3).fill(SEMINAR_COLORS.body);
    doc.fillColor('#666666').roundedRect(22, 10, 16, 20, 3).fill();
  } else {
    doc.moveTo(20, 6)
      .bezierCurveTo(30, 6, 36, 14, 36, 24)
      .bezierCurveTo(36, 34, 30, 42, 20, 42)
      .bezierCurveTo(10, 42, 4, 34, 4, 24)
      .bezierCurveTo(4, 14, 10, 6, 20, 6)
      .fill();
    doc.fillColor(MACRO_SIGNAL_PDF.bg).circle(20, 24, 6).fill();
  }

  doc.restore();
}

export function drawMacroSignalTable(doc, { x, y, width, rows }) {
  const { bg, border, headerH, rowH, iconSize, radius } = MACRO_SIGNAL_PDF;
  const tableH = headerH + rowH * rows.length;
  const colWidths = [width * 0.36, width * 0.32, width * 0.32];
  const headers = ['The Macros', 'Too Much', 'Too Little'];

  doc.save();
  doc.roundedRect(x, y, width, tableH, radius)
    .lineWidth(2)
    .strokeColor(border)
    .stroke();
  doc.restore();

  doc.save();
  doc.roundedRect(x, y, width, headerH, radius).clip();
  doc.rect(x, y, width, headerH).fill(border);
  doc.restore();

  let cx = x;
  headers.forEach((label, index) => {
    doc
      .font(SEMINAR_FONTS.bold)
      .fontSize(8)
      .fillColor(SEMINAR_COLORS.startHereText)
      .text(label.toUpperCase(), cx + 4, y + 9, {
        width: colWidths[index] - 8,
        align: 'center',
        lineGap: 0,
      });
    if (index < headers.length - 1) {
      const edge = cx + colWidths[index];
      doc
        .moveTo(edge, y)
        .lineTo(edge, y + headerH)
        .strokeColor('#d9c04d')
        .lineWidth(0.5)
        .stroke();
    }
    cx += colWidths[index];
  });

  let rowY = y + headerH;
  rows.forEach((row, rowIndex) => {
    cx = x;
    colWidths.forEach((colWidth, colIndex) => {
      doc.rect(cx, rowY, colWidth, rowH).fill(bg);
      if (colIndex < colWidths.length - 1) {
        doc
          .moveTo(cx + colWidth, rowY)
          .lineTo(cx + colWidth, rowY + rowH)
          .strokeColor(SEMINAR_COLORS.rule)
          .lineWidth(0.5)
          .stroke();
      }
      cx += colWidth;
    });

    if (rowIndex > 0) {
      doc
        .moveTo(x, rowY)
        .lineTo(x + width, rowY)
        .strokeColor(SEMINAR_COLORS.rule)
        .lineWidth(0.5)
        .stroke();
    }

    const iconX = x + 14;
    const iconY = rowY + (rowH - iconSize) / 2;
    drawMacroSignalPdfIcon(doc, row.id, iconX, iconY, iconSize);

    doc
      .font(SEMINAR_FONTS.bold)
      .fontSize(7.5)
      .fillColor(SEMINAR_COLORS.body)
      .text(row.label, iconX + iconSize + 8, rowY + rowH / 2 - 4, {
        width: colWidths[0] - iconSize - 28,
        lineGap: 0,
      });

    [
      { text: row.tooMuch, arrow: '↑' },
      { text: row.tooLittle, arrow: '↓' },
    ].forEach((cell, cellIndex) => {
      const cellX = x + colWidths.slice(0, cellIndex + 1).reduce((sum, w) => sum + w, 0);
      doc
        .font(SEMINAR_FONTS.bold)
        .fontSize(7.5)
        .fillColor(SEMINAR_COLORS.body)
        .text(cell.text, cellX + 4, rowY + 12, {
          width: colWidths[cellIndex + 1] - 8,
          align: 'center',
          lineGap: 0,
        });
      doc
        .font(SEMINAR_FONTS.bold)
        .fontSize(16)
        .fillColor(border)
        .text(cell.arrow, cellX + 4, rowY + 28, {
          width: colWidths[cellIndex + 1] - 8,
          align: 'center',
          lineGap: 0,
        });
    });

    rowY += rowH;
  });

  return y + tableH;
}
