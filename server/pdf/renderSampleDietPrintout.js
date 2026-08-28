/**
 * Burn & Build Diet PDF — 7-page program report (purchased + landing sample).
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { createPrintPdf } from './creator.js';
import { PDF_FRAME_FONTS } from './drawFrame.js';
import { SEMINAR_COLORS } from './drawSeminar.js';
import {
  begin1982Page,
  FRAME_1982,
  stamp1982Footers,
  TABLE_1982,
} from './draw1982Frame.js';
import { drawAnswersConfirmationPage } from './drawAnswersConfirmationPage.js';
import { drawModernFoodPlanPage } from './drawModernFoodPlanPage.js';
import { drawModernMenuPlanPage } from './drawModernMenuPlanPage.js';
import { drawModernLeanBodyAnalysisPage } from './drawModernLeanBodyAnalysisPage.js';
import { drawModernServingsPage } from './drawModernServingsPage.js';
import {
  drawStaplesFoodListPage,
  drawVegFruitFoodListPage,
} from './drawStaplesFoodListPages.js';
import { buildMenuPlanWorksheetPayload } from '../../js/sampleDayMenuPrintoutData.js';
import { SAMPLE_DAY_MENU_PAGE_TITLE } from '../../js/sampleDietPrintoutCopyData.js';

const FONTS = PDF_FRAME_FONTS;
const LAYOUT = FRAME_1982;
const HANDWRITING_FONT = 'Caveat';
const HANDWRITING_FONT_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'fonts/Caveat-Regular.ttf',
);
const HANDWRITING_FONT_SIZE = 16;
/** Ballpoint ink — not SAMPLE_DIET_BLUE (PDF accent). */
const HANDWRITING_INK_COLOR = '#184A94';
const HANDWRITING_BASELINE_NUDGE = 1.5;

function getRowColSpans(row) {
  if (Array.isArray(row._colSpans) && row._colSpans.length) return row._colSpans;
  if (row._colSpan) return [row._colSpan];
  return [];
}

function tableColumnSpanBounds(columns, colSpan) {
  if (!colSpan?.from || !colSpan?.to) return null;
  const fromIndex = columns.findIndex((col) => col.key === colSpan.from);
  const toIndex = columns.findIndex((col) => col.key === colSpan.to);
  if (fromIndex < 0 || toIndex < fromIndex) return null;
  return { fromIndex, toIndex };
}

function tableColumnSpanWidth(colWidths, spanBounds) {
  return colWidths.slice(spanBounds.fromIndex, spanBounds.toIndex + 1).reduce((sum, w) => sum + w, 0);
}

function isTableColumnSpanned(columns, row, colIndex) {
  for (const span of getRowColSpans(row)) {
    const bounds = tableColumnSpanBounds(columns, span);
    if (!bounds) continue;
    if (colIndex > bounds.fromIndex && colIndex <= bounds.toIndex) return true;
  }
  return false;
}

function isTableColumnBorderSpanned(columns, row, boundaryAfterColIndex) {
  for (const span of getRowColSpans(row)) {
    const bounds = tableColumnSpanBounds(columns, span);
    if (!bounds) continue;
    if (boundaryAfterColIndex >= bounds.fromIndex && boundaryAfterColIndex < bounds.toIndex) {
      return true;
    }
  }
  return false;
}

function tableCellStartsSpan(columns, row, colIndex) {
  return getRowColSpans(row).some((span) => {
    const bounds = tableColumnSpanBounds(columns, span);
    return bounds && bounds.fromIndex === colIndex;
  });
}

function tableCellWidth(colWidths, columns, row, colIndex) {
  for (const span of getRowColSpans(row)) {
    const bounds = tableColumnSpanBounds(columns, span);
    if (bounds && colIndex === bounds.fromIndex) {
      return tableColumnSpanWidth(colWidths, bounds);
    }
  }
  return colWidths[colIndex];
}

function drawLayoutTableCellText(doc, {
  text,
  cx,
  cy,
  cellW,
  cellH,
  padLeft,
  padRight,
  tableRowPad,
  style,
  fillColor,
  align,
  lineBreak,
  valign = 'top',
}) {
  doc
    .font(style.font)
    .fontSize(style.fontSize)
    .fillColor(fillColor);
  const cellText = String(text ?? '');
  let textY = cy + tableRowPad;
  if (valign === 'middle' && cellH) {
    const textH = doc.heightOfString(cellText, { width: cellW, lineBreak: false });
    textY = cy + Math.max(0, (cellH - textH) / 2);
  }
  const innerW = cellW - padLeft - padRight;
  if (align === 'center' && !lineBreak && !cellText.includes('\n')) {
    const textW = doc.widthOfString(cellText);
    if (textW <= innerW) {
      doc.text(cellText, cx + padLeft + (innerW - textW) / 2, textY, { lineBreak: false });
      return;
    }
  }
  doc.text(cellText, cx + padLeft, textY, {
    width: innerW,
    lineGap: 0,
    align,
    lineBreak,
  });
}

function measureText(doc, text, width, { font, fontSize, lineGap = LAYOUT.lineGap } = {}) {
  doc.font(font || FONTS.regular).fontSize(fontSize || LAYOUT.bodySize);
  return doc.heightOfString(String(text || ''), { width, lineGap });
}

function drawParagraphs(doc, page, paragraphs, {
  font = FONTS.regular,
  fontSize = LAYOUT.bodySize,
  lineGap = LAYOUT.lineGap,
  paragraphGap = LAYOUT.paragraphGap,
  align = 'left',
} = {}) {
  let y = page.y;
  (paragraphs || []).forEach((paragraph) => {
    if (!paragraph) return;
    doc.font(font).fontSize(fontSize).fillColor(SEMINAR_COLORS.body);
    doc.text(String(paragraph), page.x, y, { width: page.width, lineGap, align });
    y = doc.y + paragraphGap;
  });
  return { ...page, y };
}

function layoutTableCellPads(col, defaultPad) {
  const uniform = col.cellPad ?? defaultPad;
  return {
    left: col.padLeft ?? uniform,
    right: col.padRight ?? uniform,
  };
}

function layoutTableRowHeights(doc, { columns, rows, headerRows = 1, tableRowPad = LAYOUT.tableRowPad }) {
  const pad = TABLE_1982.cellPad;
  const tableWidth = rows._tableWidth || 1;
  const colWidths = columns.map((col) => col.width * tableWidth);
  return rows.map((row, rowIndex) => {
    const isHeader = rowIndex < headerRows;
    const rowPad = row._rowPad ?? tableRowPad;
    let maxH = rowPad * 2;
    columns.forEach((col, index) => {
      if (isTableColumnSpanned(columns, row, index)) return;
      const { left: padLeft, right: padRight } = layoutTableCellPads(col, pad);
      const innerW = tableCellWidth(colWidths, columns, row, index) - padLeft - padRight;
      const defaultStyle = {
        font: isHeader ? FONTS.bold : FONTS.regular,
        fontSize: isHeader ? LAYOUT.tableHeadSize : LAYOUT.tableBodySize,
      };
      const style = { ...defaultStyle, ...row._styles?.[col.key] };
      doc.font(style.font).fontSize(style.fontSize);
      maxH = Math.max(
        maxH,
        doc.heightOfString(String(row[col.key] ?? ''), { width: innerW, lineGap: 0 }) + rowPad * 2,
      );
    });
    return maxH;
  });
}

function drawLayoutTable(doc, {
  x,
  y,
  width,
  columns,
  rows,
  headerRows = 1,
  tableRowPad = LAYOUT.tableRowPad,
  gridLines = 'horizontal',
  strokeColor = TABLE_1982.stroke,
  radius = TABLE_1982.radius,
  lineBreak = true,
} = {}) {
  rows._tableWidth = width;
  const colWidths = columns.map((col) => col.width * width);
  const rowHeights = layoutTableRowHeights(doc, { columns, rows, headerRows, tableRowPad });
  const totalH = rowHeights.reduce((sum, h) => sum + h, 0);
  const pad = TABLE_1982.cellPad;
  const fullGrid = gridLines === 'full';

  doc.strokeColor(strokeColor).lineWidth(fullGrid ? 0.75 : 1.25);
  if (fullGrid) {
    doc.rect(x, y, width, totalH).stroke();
  } else {
    doc.roundedRect(x, y, width, totalH, radius).stroke();
  }

  let cy = y;
  rows.forEach((row, rowIndex) => {
    const rh = rowHeights[rowIndex];
    const isHeader = rowIndex < headerRows;
    let cx = x;
    columns.forEach((col, index) => {
      if (isTableColumnSpanned(columns, row, index)) return;
      const w = tableCellWidth(colWidths, columns, row, index);
      const rowPad = row._rowPad ?? tableRowPad;
      const defaultStyle = {
        font: isHeader ? FONTS.bold : FONTS.regular,
        fontSize: isHeader ? LAYOUT.tableHeadSize : LAYOUT.tableBodySize,
      };
      const style = { ...defaultStyle, ...row._styles?.[col.key] };
      const align = row._aligns?.[col.key] || col.align || 'left';
      const { left: padLeft, right: padRight } = layoutTableCellPads(col, pad);
      drawLayoutTableCellText(doc, {
        text: row[col.key],
        cx,
        cy,
        cellW: w,
        cellH: rh,
        padLeft,
        padRight,
        tableRowPad: rowPad,
        style,
        fillColor: row._colors?.[col.key] || SEMINAR_COLORS.body,
        align,
        lineBreak,
        valign: row._valign || 'top',
      });
      cx += w;
    });
    cy += rh;
    if (rowIndex < rows.length - 1) {
      doc
        .strokeColor(strokeColor)
        .lineWidth(0.5)
        .moveTo(fullGrid ? x : x + radius, cy)
        .lineTo(fullGrid ? x + width : x + width - radius, cy)
        .stroke();
    }
  });

  if (fullGrid) {
    const colBoundaries = [x];
    let boundaryX = x;
    columns.forEach((col, index) => {
      boundaryX += colWidths[index];
      colBoundaries.push(boundaryX);
    });

    let rowY = y;
    rows.forEach((row, rowIndex) => {
      const rh = rowHeights[rowIndex];
      for (let i = 1; i < colBoundaries.length - 1; i += 1) {
        if (isTableColumnBorderSpanned(columns, row, i - 1)) continue;
        doc
          .strokeColor(strokeColor)
          .lineWidth(0.5)
          .moveTo(colBoundaries[i], rowY)
          .lineTo(colBoundaries[i], rowY + rh)
          .stroke();
      }
      rowY += rh;
    });
  }

  return y + totalH;
}

function lbaTodayPctDisplay(pct) {
  const raw = String(pct ?? '').trim().replace(/%$/, '');
  return raw ? `${raw} %` : '—';
}

function drawLbaTodayBlock(doc, x, y, width, todayRows) {
  const pad = 8;
  const labelSize = 9;
  const dataSize = 10;
  const rowPad = 4;

  doc.font(FONTS.bold).fontSize(labelSize);
  const labelColW = todayRows.reduce(
    (max, row) => Math.max(max, doc.widthOfString(String(row.label || ''))),
    doc.widthOfString('TOTAL'),
  );
  doc.font(FONTS.regular).fontSize(dataSize);
  const pctColW = todayRows.reduce(
    (max, row) => Math.max(max, doc.widthOfString(lbaTodayPctDisplay(row.pct))),
    doc.widthOfString('100.00 %'),
  );
  const lbsColW = todayRows.reduce(
    (max, row) => Math.max(max, doc.widthOfString(String(row.lbs || ''))),
    doc.widthOfString('184.0 lbs.'),
  );
  const gap = 18;
  const blockW = labelColW + gap + pctColW + gap + lbsColW;
  const rowH = Math.max(labelSize, dataSize) + rowPad * 2;
  const titleH = 10;
  const totalH = pad + titleH + 4 + rowH * todayRows.length + pad;

  doc
    .strokeColor(TABLE_1982.stroke)
    .lineWidth(1.25)
    .roundedRect(x, y, width, totalH, TABLE_1982.radius)
    .stroke();

  let cy = y + pad;
  doc
    .font(FONTS.bold)
    .fontSize(titleH)
    .fillColor(SEMINAR_COLORS.body)
    .text('--TODAY--', x, cy, { width, align: 'center', lineGap: 0 });
  cy += titleH + 4;

  const blockX = x + (width - blockW) / 2;
  const pctX = blockX + labelColW + gap;
  const lbsX = pctX + pctColW + gap;

  todayRows.forEach((row) => {
    doc.font(FONTS.bold).fontSize(labelSize).fillColor(SEMINAR_COLORS.body);
    doc.text(String(row.label), blockX, cy + rowPad, { lineBreak: false });
    doc.font(FONTS.regular).fontSize(dataSize);
    const pctText = lbaTodayPctDisplay(row.pct);
    doc.text(pctText, pctX + pctColW - doc.widthOfString(pctText), cy + rowPad, { lineBreak: false });
    const lbsText = String(row.lbs);
    doc.text(lbsText, lbsX + lbsColW - doc.widthOfString(lbsText), cy + rowPad, { lineBreak: false });
    cy += rowH;
  });

  return y + totalH;
}

function parseStatusPrefix(text) {
  const str = String(text || '');
  for (const prefix of ['CONGRATULATIONS!', 'ALERT!']) {
    if (str.startsWith(prefix)) {
      return {
        prefix,
        rest: str.slice(prefix.length),
        color: prefix === 'CONGRATULATIONS!' ? '#1B7A3E' : '#8B0000',
      };
    }
  }
  return null;
}

function drawStatusParagraph(doc, page, paragraph) {
  const status = parseStatusPrefix(paragraph);
  if (!status) {
    return drawParagraphs(doc, page, [paragraph]);
  }
  doc
    .font(FONTS.bold)
    .fontSize(LAYOUT.bodySize)
    .fillColor(status.color)
    .text(status.prefix, page.x, page.y, { continued: true, lineGap: LAYOUT.lineGap });
  doc
    .font(FONTS.regular)
    .fontSize(LAYOUT.bodySize)
    .fillColor(SEMINAR_COLORS.body)
    .text(status.rest, { width: page.width, lineGap: LAYOUT.lineGap, align: 'left' });
  return { ...page, y: doc.y + LAYOUT.paragraphGap };
}

function drawLeanBodyAnalysisPage(doc, payload) {
  drawModernLeanBodyAnalysisPage(doc, payload);
}

function drawGoalTable(doc, x, y, width, goalTable) {
  if (!goalTable) return y;
  // 6 columns — 1982 layout: label | TODAY % | TODAY lbs | fat loss | goal % | goal lbs
  const columns = [
    { key: 'label', width: 0.11, align: 'left' },
    { key: 'todayPct', width: 0.13, align: 'center' },
    { key: 'todayLbs', width: 0.15, align: 'center' },
    { key: 'goalA', width: 0.24, align: 'center' },
    { key: 'goalB', width: 0.14, align: 'center' },
    { key: 'goalC', width: 0.23, align: 'center' },
  ];
  const head = {
    label: '',
    todayPct: 'TODAY',
    todayLbs: '',
    goalA: '',
    goalB: 'EIGHT WEEK GOAL',
    goalC: '',
    _colSpans: [
      { from: 'todayPct', to: 'todayLbs' },
      { from: 'goalB', to: 'goalC' },
    ],
  };
  return drawLayoutTable(doc, {
    x,
    y,
    width,
    columns,
    rows: [
      head,
      ...goalTable.rows.map((row) => (
        row.label === 'FAT'
          ? { ...row, _styles: { ...row._styles, goalA: { font: FONTS.bold } } }
          : row
      )),
    ],
    headerRows: 1,
  });
}

const MACRO_TABLE_VALUE_KEYS = Object.freeze([
  'proteinG',
  'proteinCal',
  'carbsG',
  'carbsCal',
  'fatG',
  'fatCal',
  'totalCal',
]);

const MACRO_TABLE_LABEL_WIDTH = 0.28;
/** Equal width for PROTEIN, CARBS, FATS, and TOTAL column groups. */
const MACRO_TABLE_GROUP_WIDTH = (1 - MACRO_TABLE_LABEL_WIDTH) / 4;
const MACRO_TABLE_PAIR_COL_WIDTH = MACRO_TABLE_GROUP_WIDTH / 2;

function macroTableColDefs() {
  return [
    { key: 'label', width: MACRO_TABLE_LABEL_WIDTH, align: 'left' },
    { key: 'proteinG', width: MACRO_TABLE_PAIR_COL_WIDTH, align: 'right' },
    { key: 'proteinCal', width: MACRO_TABLE_PAIR_COL_WIDTH, align: 'right' },
    { key: 'carbsG', width: MACRO_TABLE_PAIR_COL_WIDTH, align: 'right' },
    { key: 'carbsCal', width: MACRO_TABLE_PAIR_COL_WIDTH, align: 'right' },
    { key: 'fatG', width: MACRO_TABLE_PAIR_COL_WIDTH, align: 'right' },
    { key: 'fatCal', width: MACRO_TABLE_PAIR_COL_WIDTH, align: 'right' },
    { key: 'totalCal', width: MACRO_TABLE_GROUP_WIDTH, align: 'right' },
  ];
}

function macroTableCellPad(col, side) {
  const key = col.key;
  if (key.endsWith('G')) {
    return side === 'left' ? 4 : 1;
  }
  if (key.endsWith('Cal') && key !== 'totalCal') {
    return side === 'left' ? 1 : 4;
  }
  return 4;
}

function macroTableCellInsets(col, colWidth) {
  const left = macroTableCellPad(col, 'left');
  const right = macroTableCellPad(col, 'right');
  return { left, right, innerW: colWidth - left - right };
}

function macroTableTextBox(col, index, colXs, insets) {
  return { x: colXs[index] + insets.left, width: insets.innerW };
}

function macroTableGroupHeaders() {
  return [
    { label: 'PROTEIN', keys: ['proteinG', 'proteinCal'] },
    { label: 'CARBS', keys: ['carbsG', 'carbsCal'] },
    { label: 'FATS', keys: ['fatG', 'fatCal'] },
    { label: 'TOTAL', keys: ['totalCal'] },
  ];
}

function macroTableSubHeaderRow() {
  return {
    label: '',
    proteinG: 'grams',
    proteinCal: 'calories',
    carbsG: 'grams',
    carbsCal: 'calories',
    fatG: 'grams',
    fatCal: 'calories',
    totalCal: 'calories',
  };
}

function macroTableBlankRow() {
  return Object.fromEntries(
    ['label', ...MACRO_TABLE_VALUE_KEYS].map((key) => [key, '']),
  );
}

function buildMacroTableBodyRows(macroRows = []) {
  const bodyRows = [];
  macroRows.forEach((row) => {
    if (row.label === 'Reduce current fat %') {
      bodyRows.push({ ...row, _bold: true });
      bodyRows.push(macroTableBlankRow());
      return;
    }
    bodyRows.push({ ...row });
  });
  return bodyRows;
}

function measureMacroTableRow(doc, row, colDefs, width, { isHeader, tableRowPad }) {
  let maxH = tableRowPad * 2;
  colDefs.forEach((col, index) => {
    const colW = col.width * width;
    const insets = macroTableCellInsets(col, colW);
    const { width: innerW } = macroTableTextBox(col, index, [], insets);
    const bold = row._bold && !isHeader;
    doc.font(bold ? FONTS.bold : (isHeader ? FONTS.bold : FONTS.regular)).fontSize(
      isHeader ? LAYOUT.tableHeadSize : LAYOUT.tableBodySize,
    );
    maxH = Math.max(
      maxH,
      doc.heightOfString(String(row[col.key] ?? ''), { width: innerW, lineGap: 0 }) + tableRowPad * 2,
    );
  });
  return maxH;
}

function drawMacroTable(doc, x, y, width, macroRows) {
  const colDefs = macroTableColDefs();
  const colWidths = colDefs.map((col) => col.width * width);
  const colXs = [];
  let cx = x;
  for (const w of colWidths) {
    colXs.push(cx);
    cx += w;
  }

  const tableRowPad = 8;
  const cellPad = 8;
  const subHeader = macroTableSubHeaderRow();
  const bodyRows = buildMacroTableBodyRows(macroRows);
  const groupHeaderH = LAYOUT.tableHeadSize + tableRowPad * 2;
  const subHeaderH = measureMacroTableRow(doc, subHeader, colDefs, width, {
    isHeader: true,
    tableRowPad,
  });
  const bodyHeights = bodyRows.map((row) => measureMacroTableRow(doc, row, colDefs, width, {
    isHeader: false,
    tableRowPad,
  }));
  const totalH = groupHeaderH + subHeaderH + bodyHeights.reduce((sum, h) => sum + h, 0);

  doc
    .strokeColor(TABLE_1982.stroke)
    .lineWidth(1.25)
    .roundedRect(x, y, width, totalH, TABLE_1982.radius)
    .stroke();

  let cy = y;

  doc.font(FONTS.bold).fontSize(LAYOUT.tableHeadSize).fillColor(SEMINAR_COLORS.body);
  macroTableGroupHeaders().forEach((group) => {
    const startIndex = colDefs.findIndex((col) => col.key === group.keys[0]);
    const endIndex = colDefs.findIndex((col) => col.key === group.keys[group.keys.length - 1]);
    const groupX = colXs[startIndex];
    const groupW = colXs[endIndex] + colWidths[endIndex] - groupX;
    doc.text(group.label, groupX + cellPad, cy + tableRowPad, {
      width: groupW - cellPad * 2,
      align: 'center',
      lineGap: 0,
    });
  });
  cy += groupHeaderH;
  doc
    .strokeColor(TABLE_1982.stroke)
    .lineWidth(0.5)
    .moveTo(x + TABLE_1982.radius, cy)
    .lineTo(x + width - TABLE_1982.radius, cy)
    .stroke();

  doc.font(FONTS.bold).fontSize(LAYOUT.tableHeadSize).fillColor(SEMINAR_COLORS.body);
  colDefs.forEach((col, index) => {
    const text = String(subHeader[col.key] ?? '');
    if (!text) return;
    const insets = macroTableCellInsets(col, colWidths[index]);
    const { x: textX, width: textW } = macroTableTextBox(col, index, colXs, insets);
    doc.text(text, textX, cy + tableRowPad, {
      width: textW,
      lineGap: 0,
      align: col.align || 'left',
      lineBreak: false,
    });
  });
  cy += subHeaderH;
  doc
    .strokeColor(TABLE_1982.stroke)
    .lineWidth(0.5)
    .moveTo(x + TABLE_1982.radius, cy)
    .lineTo(x + width - TABLE_1982.radius, cy)
    .stroke();

  bodyRows.forEach((row, rowIndex) => {
    const rh = bodyHeights[rowIndex];
    colDefs.forEach((col, index) => {
      const insets = macroTableCellInsets(col, colWidths[index]);
      const { x: textX, width: textW } = macroTableTextBox(col, index, colXs, insets);
      doc
        .font(row._bold ? FONTS.bold : FONTS.regular)
        .fontSize(LAYOUT.tableBodySize)
        .fillColor(SEMINAR_COLORS.body)
        .text(String(row[col.key] ?? ''), textX, cy + tableRowPad, {
          width: textW,
          align: col.align || 'left',
          lineGap: 0,
        });
    });
    cy += rh;
    if (rowIndex < bodyRows.length - 1) {
      doc
        .strokeColor(TABLE_1982.stroke)
        .lineWidth(0.5)
        .moveTo(x + TABLE_1982.radius, cy)
        .lineTo(x + width - TABLE_1982.radius, cy)
        .stroke();
    }
  });

  return y + totalH;
}

function drawFoodPlanPage(doc, payload) {
  drawModernFoodPlanPage(doc, payload);
}

function drawServingsPage(doc, payload) {
  drawModernServingsPage(doc, payload);
}

const SAMPLE_DAY_MENU_SERVING_SIZE_LABEL = 'serving size';
/** Serving-size label column — left edge as fraction of meal row width (room for food names). */
const SAMPLE_DAY_MENU_SERVING_COL_RATIO = 0.48;
const SAMPLE_DAY_MENU_MIN_ROW_GAP = 7;
const SAMPLE_DAY_MENU_MIN_SECTION_GAP = 10;
const SAMPLE_DAY_MENU_MIN_TITLE_SECTION_GAP = 16;
const SAMPLE_DAY_MENU_TIME_COL_WIDTH = 58;
const SAMPLE_DAY_MENU_TIME_MEAL_GAP = 14;
const SAMPLE_DAY_MENU_TIME_LINE_WIDTH = 42;

function registerHandwritingFont(doc) {
  doc.registerFont(HANDWRITING_FONT, HANDWRITING_FONT_PATH);
}

function handwritingTopForLine(doc, lineY) {
  doc.font(HANDWRITING_FONT).fontSize(HANDWRITING_FONT_SIZE);
  const ascent = doc.heightOfString('Ag', { lineGap: 0 });
  return lineY - ascent + HANDWRITING_BASELINE_NUDGE;
}

function drawHandwritingOnLine(doc, text, x, lineY, width, { align = 'left' } = {}) {
  if (!text) return;
  const textY = handwritingTopForLine(doc, lineY);
  doc
    .font(HANDWRITING_FONT)
    .fontSize(HANDWRITING_FONT_SIZE)
    .fillColor(HANDWRITING_INK_COLOR)
    .text(String(text), x, textY, { width, align, lineBreak: false });
}

function drawPeriodLabel(doc, x, y, label, selected, filled) {
  doc
    .font(FONTS.regular)
    .fontSize(8)
    .fillColor(SEMINAR_COLORS.body)
    .text(label, x, y, { lineBreak: false });

  if (!filled || !selected) return;

  const labelW = doc.widthOfString(label);
  const centerX = x + labelW / 2;
  const centerY = y + 4;
  doc
    .strokeColor(HANDWRITING_INK_COLOR)
    .lineWidth(0.85)
    .ellipse(centerX, centerY, labelW / 2 + 3, 5.5, 0)
    .stroke();
}

function drawTimeColumn(doc, x, y, time, filled) {
  const lineY = y + LAYOUT.bodySize;
  doc
    .strokeColor(TABLE_1982.stroke)
    .lineWidth(0.75)
    .moveTo(x, lineY)
    .lineTo(x + SAMPLE_DAY_MENU_TIME_LINE_WIDTH, lineY)
    .stroke();

  if (filled && time?.value) {
    drawHandwritingOnLine(doc, time.value, x + 1, lineY, SAMPLE_DAY_MENU_TIME_LINE_WIDTH - 2, { align: 'center' });
  }

  const periodY = lineY + 8;
  drawPeriodLabel(doc, x, periodY, 'AM', time?.period === 'AM', filled);
  drawPeriodLabel(doc, x + 22, periodY, 'PM', time?.period === 'PM', filled);

  return periodY + 12;
}

function measureTimeColumnHeight(y) {
  const lineY = y + LAYOUT.bodySize;
  const periodY = lineY + 8;
  return periodY + 12 - y;
}

function menuPlanRowLayout(doc, x, width, row) {
  const fontSize = LAYOUT.bodySize;
  const gap = 5;
  const sizeLabel = SAMPLE_DAY_MENU_SERVING_SIZE_LABEL;
  const labelText = String(row.label);
  const labelFont = row.labelBold ? FONTS.bold : FONTS.regular;
  doc.font(labelFont).fontSize(fontSize);
  const labelW = doc.widthOfString(labelText);
  doc.font(FONTS.regular).fontSize(fontSize);
  const sizeLabelW = doc.widthOfString(sizeLabel);

  const sizeTextX = x + width * SAMPLE_DAY_MENU_SERVING_COL_RATIO;
  const foodLineStart = x + labelW + gap;
  const foodLineEnd = sizeTextX - gap;
  const sizeLineStart = sizeTextX + sizeLabelW + gap;
  const sizeLineEnd = x + width;

  return {
    fontSize,
    gap,
    labelText,
    labelFont,
    labelW,
    sizeLabel,
    sizeLabelW,
    sizeTextX,
    foodLineStart,
    foodLineEnd,
    sizeLineStart,
    sizeLineEnd,
  };
}

function measureMenuPlanServingBottom(doc, layout, lineY, servingSize) {
  if (!servingSize) return lineY;
  const servingWidth = layout.sizeLineEnd - layout.sizeLineStart - 4;
  doc.font(HANDWRITING_FONT).fontSize(HANDWRITING_FONT_SIZE);
  const servingTop = handwritingTopForLine(doc, lineY);
  const textH = doc.heightOfString(String(servingSize), { width: servingWidth, lineGap: 1 });
  return servingTop + textH;
}

function advanceMenuPlanRowY(doc, x, width, y, row, filled, rowGap) {
  const layout = menuPlanRowLayout(doc, x, width, row);
  const lineYOffset = layout.fontSize + 2;
  const lineY = y + lineYOffset;
  let contentBottom = lineY;
  if (filled && row?.servingSize) {
    contentBottom = measureMenuPlanServingBottom(doc, layout, lineY, row.servingSize);
  }
  return Math.max(y + rowGap + lineYOffset, contentBottom + 2);
}

function measureMenuSectionBlock(doc, mealX, mealWidth, section, filled, rowGap) {
  let mealY = 0;
  if (section.title) {
    mealY += LAYOUT.sectionTitleSize + LAYOUT.headerGap;
  }
  (section.rows || []).forEach((row) => {
    mealY = advanceMenuPlanRowY(doc, mealX, mealWidth, mealY, row, filled, rowGap);
  });
  return Math.max(mealY, measureTimeColumnHeight(0));
}

function measureMenuPlanTitleRowHeight() {
  return LAYOUT.pageTitleSize + 2;
}

function measureMenuPlanWorksheetNoteHeight(doc, note, width) {
  if (!note?.url) return 0;
  doc.font(FONTS.regular).fontSize(LAYOUT.bodySize);
  const text = `${note.lead || ''}${note.linkLabel || note.url}`;
  return doc.heightOfString(text, { width, lineGap: LAYOUT.lineGap }) + LAYOUT.paragraphGap;
}

function measureMenuPlanContentHeight(doc, menu, page, filled, rowGap, sectionGap, titleSectionGap) {
  const sections = menu.sections || [];
  const mealX = page.x + SAMPLE_DAY_MENU_TIME_COL_WIDTH + SAMPLE_DAY_MENU_TIME_MEAL_GAP;
  const mealWidth = page.width - SAMPLE_DAY_MENU_TIME_COL_WIDTH - SAMPLE_DAY_MENU_TIME_MEAL_GAP;
  let height = measureMenuPlanTitleRowHeight() + titleSectionGap;
  sections.forEach((section) => {
    height += measureMenuSectionBlock(doc, mealX, mealWidth, section, filled, rowGap);
    height += sectionGap;
  });
  return height;
}

function computeMenuPlanLayout(doc, menu, page, filled) {
  const sections = menu.sections || [];
  const noteHeight = filled && menu.worksheetNote
    ? measureMenuPlanWorksheetNoteHeight(doc, menu.worksheetNote, page.width) + 8
    : 0;

  const contentTop = page.y;
  const contentBottom = page.bottom - noteHeight;
  const available = contentBottom - contentTop;

  let rowGap = SAMPLE_DAY_MENU_MIN_ROW_GAP;
  let sectionGap = SAMPLE_DAY_MENU_MIN_SECTION_GAP;
  let titleSectionGap = SAMPLE_DAY_MENU_MIN_TITLE_SECTION_GAP;

  let height = measureMenuPlanContentHeight(doc, menu, page, filled, rowGap, sectionGap, titleSectionGap);
  if (height < available && sections.length > 0) {
    const extra = available - height;
    const flexSlots = sections.length + 1;
    const per = extra / flexSlots;
    titleSectionGap += per;
    sectionGap += per;
    height = measureMenuPlanContentHeight(doc, menu, page, filled, rowGap, sectionGap, titleSectionGap);
  }

  if (height > available) {
    const overflow = height - available;
    const rowCount = sections.reduce((sum, section) => sum + (section.rows?.length || 0), 0);
    if (rowCount > 0) {
      rowGap = Math.max(4, rowGap - overflow / rowCount);
      height = measureMenuPlanContentHeight(doc, menu, page, filled, rowGap, sectionGap, titleSectionGap);
    }
  }

  return {
    contentTop,
    noteY: page.bottom - noteHeight,
    titleSectionGap,
    sectionGap,
    rowGap,
    contentBottom,
  };
}

function drawHandwritingInBand(doc, text, x, topY, width) {
  if (!text) return topY;
  doc
    .font(HANDWRITING_FONT)
    .fontSize(HANDWRITING_FONT_SIZE)
    .fillColor(HANDWRITING_INK_COLOR)
    .text(String(text), x, topY, { width, lineBreak: true, lineGap: 1 });
  return doc.y;
}

function drawSampleDayMenuFillInRow(doc, x, y, width, row, filled, rowGap) {
  const layout = menuPlanRowLayout(doc, x, width, row);
  const lineYOffset = layout.fontSize + 2;
  const lineY = y + lineYOffset;

  doc.font(layout.labelFont).fontSize(layout.fontSize).fillColor(SEMINAR_COLORS.body);
  doc.text(layout.labelText, x, y, { lineBreak: false });
  doc.font(FONTS.regular).fontSize(layout.fontSize).fillColor(SEMINAR_COLORS.body);
  doc.text(layout.sizeLabel, layout.sizeTextX, y, { lineBreak: false });

  doc
    .strokeColor(TABLE_1982.stroke)
    .lineWidth(0.75)
    .moveTo(layout.foodLineStart, lineY)
    .lineTo(layout.foodLineEnd, lineY)
    .stroke()
    .moveTo(layout.sizeLineStart, lineY)
    .lineTo(layout.sizeLineEnd, lineY)
    .stroke();

  if (filled) {
    drawHandwritingOnLine(
      doc,
      row.food,
      layout.foodLineStart + 2,
      lineY,
      layout.foodLineEnd - layout.foodLineStart - 4,
    );
    const servingTop = handwritingTopForLine(doc, lineY);
    const servingWidth = layout.sizeLineEnd - layout.sizeLineStart - 4;
    drawHandwritingInBand(doc, row.servingSize, layout.sizeLineStart + 2, servingTop, servingWidth);
  }

  return advanceMenuPlanRowY(doc, x, width, y, row, filled, rowGap);
}

function drawMenuPlanTitleRow(doc, x, y, width, title, value, filled) {
  const fontSize = LAYOUT.pageTitleSize;
  const lineYOffset = fontSize + 2;
  doc.font(FONTS.bold).fontSize(fontSize).fillColor(SEMINAR_COLORS.body);

  const gap = 5;
  const labelText = String(title || SAMPLE_DAY_MENU_PAGE_TITLE);
  const labelW = doc.widthOfString(labelText);
  const lineStart = x + labelW + gap;
  const lineEnd = x + width;
  const lineY = y + lineYOffset;

  doc.text(labelText, x, y, { lineBreak: false });
  doc
    .strokeColor(TABLE_1982.stroke)
    .lineWidth(0.75)
    .moveTo(lineStart, lineY)
    .lineTo(lineEnd, lineY)
    .stroke();

  if (filled && value) {
    drawHandwritingOnLine(doc, value, lineStart + 4, lineY, lineEnd - lineStart - 8);
  }

  return lineY;
}

function drawMenuSection(doc, page, y, section, filled, layout) {
  const mealX = page.x + SAMPLE_DAY_MENU_TIME_COL_WIDTH + SAMPLE_DAY_MENU_TIME_MEAL_GAP;
  const mealWidth = page.width - SAMPLE_DAY_MENU_TIME_COL_WIDTH - SAMPLE_DAY_MENU_TIME_MEAL_GAP;

  drawTimeColumn(doc, page.x, y, section.time, filled);

  let mealY = y;
  if (section.title) {
    doc
      .font(FONTS.bold)
      .fontSize(LAYOUT.sectionTitleSize)
      .fillColor(SEMINAR_COLORS.body)
      .text(String(section.title), mealX, mealY, { width: mealWidth, lineGap: 0 });
    mealY = doc.y + LAYOUT.headerGap;
  }

  (section.rows || []).forEach((row) => {
    mealY = drawSampleDayMenuFillInRow(doc, mealX, mealY, mealWidth, row, filled, layout.rowGap);
  });

  const blockHeight = Math.max(mealY - y, measureTimeColumnHeight(y));
  return y + blockHeight + layout.sectionGap;
}

function drawMenuPlanWorksheetNote(doc, x, y, width, note) {
  if (!note?.url) return y;

  doc
    .font(FONTS.regular)
    .fontSize(LAYOUT.bodySize)
    .fillColor(SEMINAR_COLORS.body)
    .text(String(note.lead || 'You can download blank Menu Plans at '), x, y, {
      width,
      lineGap: LAYOUT.lineGap,
      continued: true,
    });

  doc
    .fillColor(SEMINAR_COLORS.body)
    .text(String(note.linkLabel || note.url), {
      link: note.url,
      underline: true,
      continued: false,
    });

  doc.fillColor(SEMINAR_COLORS.body);
  return doc.y + LAYOUT.paragraphGap;
}

function drawSampleDayMenuPage(doc, payload) {
  const menu = payload.sampleDayMenu;
  if (!menu?.sections?.length) return;

  if (menu.filled || payload.worksheet) {
    drawModernMenuPlanPage(doc, payload);
    return;
  }

  const filled = Boolean(menu.filled);
  if (filled) registerHandwritingFont(doc);

  const page = begin1982Page(doc, payload, 'Menu Plan', {
    personalized: !payload.worksheet,
  });
  const layout = computeMenuPlanLayout(doc, menu, page, filled);
  let y = drawMenuPlanTitleRow(
    doc,
    page.x,
    layout.contentTop,
    page.width,
    menu.pageTitle || SAMPLE_DAY_MENU_PAGE_TITLE,
    menu.planFor?.value,
    filled,
  );
  y += layout.titleSectionGap;

  menu.sections.forEach((section) => {
    y = drawMenuSection(doc, page, y, section, filled, layout);
  });

  if (filled && menu.worksheetNote) {
    drawMenuPlanWorksheetNote(doc, page.x, layout.noteY, page.width, menu.worksheetNote);
  }
}

export const SAMPLE_DIET_PRINTOUT_MIN_PAGES = 7;

export function validateSampleDietPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Sample diet printout requires a payload object.');
  }
  if (payload.view !== 'samplediet') {
    throw new Error(`Expected view samplediet, got ${payload.view}`);
  }
  if (!payload.clientName || !payload.preparedDate) {
    throw new Error('clientName and preparedDate are required.');
  }
  return payload;
}

export async function renderSampleDietPrintout(payload, { title, buildLabel } = {}) {
  validateSampleDietPayload(payload);

  const creator = createPrintPdf({
    title: title || payload.title || 'B&B Sample Diet',
    author: 'Burn & Build Diet',
  });
  const doc = creator.doc;
  if (buildLabel) {
    doc.info.Subject = `B&B Sample Diet ${buildLabel}`;
  }

  drawFoodPlanPage(doc, payload);
  drawSampleDayMenuPage(doc, payload);
  drawServingsPage(doc, payload);

  const foodListFrame = {
    startPage: (doc, payload, pageTitle) => begin1982Page(doc, payload, pageTitle ?? null),
    continuePage: (doc, payload) => begin1982Page(doc, payload, null),
  };
  drawStaplesFoodListPage(doc, payload, foodListFrame);
  drawVegFruitFoodListPage(doc, payload, foodListFrame);
  drawLeanBodyAnalysisPage(doc, payload);
  drawAnswersConfirmationPage(doc, payload);

  stamp1982Footers(doc, payload.header);

  const buffer = await creator.finish({ stampPageNumbers: false });
  const pages = (buffer.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  if (pages < SAMPLE_DIET_PRINTOUT_MIN_PAGES) {
    throw new Error(`Sample diet printout expected at least ${SAMPLE_DIET_PRINTOUT_MIN_PAGES} pages, got ${pages}`);
  }
  return buffer;
}

export async function renderMenuPlanWorksheet(payload = null) {
  const menuPayload = payload || buildMenuPlanWorksheetPayload();

  const creator = createPrintPdf({
    title: menuPayload.title || 'Burn & Build Menu Plan',
    author: 'Burn & Build Diet',
  });
  const doc = creator.doc;

  drawSampleDayMenuPage(doc, menuPayload);
  stamp1982Footers(doc, menuPayload.header, { pageNumbers: false });

  const buffer = await creator.finish({ stampPageNumbers: false });
  const pages = (buffer.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  if (pages !== 1) {
    throw new Error(`Menu Plan worksheet expected 1 page, got ${pages}`);
  }
  return buffer;
}
