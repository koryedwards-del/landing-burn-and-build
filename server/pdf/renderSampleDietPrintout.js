/**
 * B&B Sample Diet PDF (deliverable: docs/samples/b&bsamplediet.pdf).
 * 1982 Warner layout + food lists. Preview: scripts/render-sample-diet-preview.mjs
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { createPrintPdf } from './creator.js';
import { PDF_FRAME_FONTS } from './drawFrame.js';
import { SEMINAR_COLORS } from './drawSeminar.js';
import {
  begin1982Page,
  FRAME_1982,
  SAMPLE_DIET_BLUE,
  stamp1982Footers,
  TABLE_1982,
} from './draw1982Frame.js';
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
const SERVINGS_ANYTIME_NOTE = 'can be eaten any time of day.';
const SERVINGS_MEAL_COL_SPAN = Object.freeze({ from: 'breakfast', to: 'snack3' });

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
  pad,
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
  if (align === 'center' && !lineBreak && !cellText.includes('\n')) {
    const textW = doc.widthOfString(cellText);
    const innerW = cellW - pad * 2;
    if (textW <= innerW) {
      doc.text(cellText, cx + pad + (innerW - textW) / 2, textY, { lineBreak: false });
      return;
    }
  }
  doc.text(cellText, cx + pad, textY, {
    width: cellW - pad * 2,
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

function drawSectionBlock(doc, page, title, body) {
  const titleH = LAYOUT.sectionTitleSize + LAYOUT.headerGap;
  const bodyH = measureText(doc, body, page.width, {
    font: FONTS.regular,
    fontSize: LAYOUT.bodySize,
  });
  doc
    .font(FONTS.bold)
    .fontSize(LAYOUT.sectionTitleSize)
    .fillColor(SEMINAR_COLORS.body)
    .text(String(title), page.x, page.y, { width: page.width, lineGap: 0 });
  let y = doc.y + LAYOUT.headerGap;
  doc
    .font(FONTS.regular)
    .fontSize(LAYOUT.bodySize)
    .fillColor(SEMINAR_COLORS.body)
    .text(String(body), page.x, y, { width: page.width, lineGap: LAYOUT.lineGap, align: 'left' });
  return { ...page, y: doc.y + LAYOUT.paragraphGap + LAYOUT.sectionGap };
}

function layoutTableCellPad(col, defaultPad) {
  return col.cellPad ?? defaultPad;
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
      const cellPad = layoutTableCellPad(col, pad);
      const innerW = tableCellWidth(colWidths, columns, row, index) - cellPad * 2;
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
      const cellPad = layoutTableCellPad(col, pad);
      drawLayoutTableCellText(doc, {
        text: row[col.key],
        cx,
        cy,
        cellW: w,
        cellH: rh,
        pad: cellPad,
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
    let cx = x;
    columns.forEach((col, index) => {
      cx += colWidths[index];
      if (index < columns.length - 1) {
        doc
          .strokeColor(strokeColor)
          .lineWidth(0.5)
          .moveTo(cx, y)
          .lineTo(cx, y + totalH)
          .stroke();
      }
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
    .fillColor(SAMPLE_DIET_BLUE)
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

function drawWelcomePage(doc, payload) {
  const page = begin1982Page(doc, payload, 'Welcome');
  let current = drawParagraphs(doc, page, payload.welcome.intro);
  current = drawSectionBlock(doc, current, 'Lean Body Analysis', payload.welcome.leanBodyAnalysis);
  current = drawSectionBlock(doc, current, 'Food Plan', payload.welcome.foodPlan);
  drawSectionBlock(doc, current, 'Servings', payload.welcome.servings);
}

function drawLeanBodyAnalysisPage(doc, payload) {
  const lba = payload.leanBodyAnalysis;
  let page = begin1982Page(doc, payload, 'Lean Body Analysis');

  page = { ...page, y: drawLbaTodayBlock(doc, page.x, page.y, page.width, lba.todayRows) + LAYOUT.sectionGap };

  const bfCategories = lba.bfRangeCategories || [];
  if (bfCategories.length) {
    const bfCols = bfCategories.map((cat, index) => ({
      key: `c${index}`,
      width: 1 / bfCategories.length,
      align: 'center',
    }));
    const bfRow = Object.fromEntries(
      bfCategories.map((cat, index) => [`c${index}`, cat.label.toUpperCase()]),
    );
    const rangeRow = Object.fromEntries(
      bfCategories.map((cat, index) => [`c${index}`, cat.bfRangeLabel]),
    );
    page = {
      ...page,
      y: drawLayoutTable(doc, {
        x: page.x,
        y: page.y,
        width: page.width,
        columns: bfCols,
        rows: [bfRow, rangeRow],
        headerRows: 1,
      }) + LAYOUT.sectionGap,
    };
  }

  page = drawParagraphs(doc, page, [lba.aceRiskMessage]);
  page = drawParagraphs(doc, page, [lba.aceLead]);
  if (lba.lbmLead) page = drawParagraphs(doc, page, [lba.lbmLead]);
  if (lba.lbmStatus) page = drawStatusParagraph(doc, page, lba.lbmStatus);

  const weightRanges = lba.bfRangeWeightRanges || [];
  if (weightRanges.length) {
    const wtCols = weightRanges.map((_, index) => ({
      key: `c${index}`,
      width: 1 / weightRanges.length,
      align: 'center',
    }));
    const labelRow = Object.fromEntries(
      weightRanges.map((row, index) => [`c${index}`, row.label.toUpperCase()]),
    );
    const valueRow = Object.fromEntries(
      weightRanges.map((row, index) => [`c${index}`, row.weightRangeLabel]),
    );
    page = {
      ...page,
      y: drawLayoutTable(doc, {
        x: page.x,
        y: page.y + LAYOUT.sectionGap,
        width: page.width,
        columns: wtCols,
        rows: [labelRow, valueRow],
        headerRows: 1,
      }) + LAYOUT.sectionGap,
    };
  }

  drawParagraphs(doc, page, [lba.monitorCopy]);
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
    _colors: {
      todayPct: SAMPLE_DIET_BLUE,
      goalB: SAMPLE_DIET_BLUE,
    },
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

const MACRO_TABLE_GRAM_KEYS = Object.freeze(['proteinG', 'carbsG', 'fatG']);
const MACRO_TABLE_CAL_KEYS = Object.freeze(['proteinCal', 'carbsCal', 'fatCal']);
const MACRO_TABLE_GROUP_HEAD_KEYS = Object.freeze(['proteinG', 'carbsG', 'fatG', 'totalCal']);
/** Group title row — PROTEIN, CARBS, FATS, TOTAL. */
const MACRO_TABLE_GROUP_HEAD_SIZE = 13;
const MACRO_TABLE_GROUP_ROW_PAD = 2;
/** Sub-header row — grams / calories. */
const MACRO_TABLE_SUBHEAD_SIZE = 12;

function macroTableGroupHeadStyles() {
  return Object.fromEntries(
    MACRO_TABLE_GROUP_HEAD_KEYS.map((key) => [
      key,
      { font: FONTS.bold, fontSize: MACRO_TABLE_GROUP_HEAD_SIZE },
    ]),
  );
}

function macroTableSubheadStyles() {
  return Object.fromEntries(
    MACRO_TABLE_VALUE_KEYS.map((key) => [
      key,
      { font: FONTS.bold, fontSize: MACRO_TABLE_SUBHEAD_SIZE },
    ]),
  );
}

/** Extra inset on TOTAL column left/right — default cell pad feels tight at 12pt. */
const MACRO_TABLE_TOTAL_EXTRA_PAD = 4;

function macroTableTextWidth(doc, text, font, fontSize) {
  doc.font(font).fontSize(fontSize);
  return doc.widthOfString(String(text ?? ''));
}

function macroTableColumnWidths(doc, tableWidth, macroRows = []) {
  const pad = TABLE_1982.cellPad * 2;
  const gramsHeadingW = macroTableTextWidth(doc, 'grams', FONTS.bold, MACRO_TABLE_SUBHEAD_SIZE);
  const caloriesHeadingW = macroTableTextWidth(doc, 'calories', FONTS.bold, MACRO_TABLE_SUBHEAD_SIZE);

  let gramsMax = gramsHeadingW;
  let caloriesMax = caloriesHeadingW;
  let totalMax = Math.max(
    caloriesHeadingW,
    macroTableTextWidth(doc, 'TOTAL', FONTS.bold, MACRO_TABLE_GROUP_HEAD_SIZE),
  );
  let labelMax = 0;

  macroRows.forEach((row) => {
    const rowFont = row.label === 'Reduce current fat %' ? FONTS.bold : FONTS.regular;
    labelMax = Math.max(labelMax, macroTableTextWidth(doc, row.label, rowFont, LAYOUT.tableBodySize));
    MACRO_TABLE_GRAM_KEYS.forEach((key) => {
      gramsMax = Math.max(gramsMax, macroTableTextWidth(doc, row[key], rowFont, LAYOUT.tableBodySize));
    });
    MACRO_TABLE_CAL_KEYS.forEach((key) => {
      caloriesMax = Math.max(caloriesMax, macroTableTextWidth(doc, row[key], rowFont, LAYOUT.tableBodySize));
    });
    totalMax = Math.max(totalMax, macroTableTextWidth(doc, row.totalCal, rowFont, LAYOUT.tableBodySize));
  });

  const gramsColW = gramsMax + pad;
  const calColW = caloriesMax + pad;
  const totalCellPad = TABLE_1982.cellPad + MACRO_TABLE_TOTAL_EXTRA_PAD;
  const totalColW = totalMax + totalCellPad * 2;
  const macroColsW = 3 * gramsColW + 3 * calColW;
  const labelColW = Math.max(labelMax + pad, tableWidth - macroColsW - totalColW);

  const toFrac = (w) => w / tableWidth;
  return [
    { key: 'label', width: toFrac(labelColW), align: 'left' },
    { key: 'proteinG', width: toFrac(gramsColW), align: 'right' },
    { key: 'proteinCal', width: toFrac(calColW), align: 'right' },
    { key: 'carbsG', width: toFrac(gramsColW), align: 'right' },
    { key: 'carbsCal', width: toFrac(calColW), align: 'right' },
    { key: 'fatG', width: toFrac(gramsColW), align: 'right' },
    { key: 'fatCal', width: toFrac(calColW), align: 'right' },
    {
      key: 'totalCal',
      width: toFrac(totalColW),
      align: 'right',
      cellPad: totalCellPad,
    },
  ];
}

const MACRO_TABLE_GROUP_SPANS = Object.freeze([
  { from: 'proteinG', to: 'proteinCal' },
  { from: 'carbsG', to: 'carbsCal' },
  { from: 'fatG', to: 'fatCal' },
]);

const MACRO_TABLE_VALUE_KEYS = Object.freeze([
  'proteinG',
  'proteinCal',
  'carbsG',
  'carbsCal',
  'fatG',
  'fatCal',
  'totalCal',
]);

function macroTableBoldRowStyles() {
  return Object.fromEntries(
    ['label', ...MACRO_TABLE_VALUE_KEYS].map((key) => [
      key,
      { font: FONTS.bold, fontSize: LAYOUT.tableBodySize },
    ]),
  );
}

function macroTableBlankRow() {
  return Object.fromEntries(
    ['label', ...MACRO_TABLE_VALUE_KEYS].map((key) => [key, '']),
  );
}

const MACRO_TABLE_HEADER_ALIGNS = Object.freeze(
  Object.fromEntries(
    ['proteinG', 'carbsG', 'fatG', 'totalCal'].map((key) => [key, 'center']),
  ),
);

const MACRO_TABLE_SUBHEADER_ALIGNS = Object.freeze(
  Object.fromEntries(MACRO_TABLE_VALUE_KEYS.map((key) => [key, 'center'])),
);

function buildMacroTableLayoutRows(macroRows = []) {
  const groupHeader = {
    label: '',
    proteinG: 'PROTEIN',
    carbsG: 'CARBS',
    fatG: 'FATS',
    totalCal: 'TOTAL',
    _colSpans: MACRO_TABLE_GROUP_SPANS,
    _aligns: MACRO_TABLE_HEADER_ALIGNS,
    _styles: macroTableGroupHeadStyles(),
    _rowPad: MACRO_TABLE_GROUP_ROW_PAD,
    _valign: 'middle',
  };
  const subHeader = {
    label: '',
    proteinG: 'grams',
    proteinCal: 'calories',
    carbsG: 'grams',
    carbsCal: 'calories',
    fatG: 'grams',
    fatCal: 'calories',
    totalCal: 'calories',
    _aligns: MACRO_TABLE_SUBHEADER_ALIGNS,
    _styles: macroTableSubheadStyles(),
  };
  const bodyRows = [];
  macroRows.forEach((row) => {
    if (row.label === 'Reduce current fat %') {
      bodyRows.push({ ...row, _styles: macroTableBoldRowStyles() });
      bodyRows.push(macroTableBlankRow());
      return;
    }
    bodyRows.push({ ...row });
  });
  return [groupHeader, subHeader, ...bodyRows];
}

function drawMacroTable(doc, x, y, width, macroRows) {
  return drawLayoutTable(doc, {
    x,
    y,
    width,
    columns: macroTableColumnWidths(doc, width, macroRows),
    rows: buildMacroTableLayoutRows(macroRows),
    headerRows: 2,
    gridLines: 'full',
    strokeColor: SEMINAR_COLORS.body,
    radius: 0,
    lineBreak: false,
  });
}

function drawFoodPlanPage(doc, payload) {
  const fp = payload.foodPlan;
  let page = begin1982Page(doc, payload, 'Food Plan');

  page = drawParagraphs(doc, page, [fp.lead]);
  if (fp.exerciseParagraph) page = drawParagraphs(doc, page, [fp.exerciseParagraph]);

  if (fp.goalTable) {
    page = {
      ...page,
      y: drawGoalTable(doc, page.x, page.y + LAYOUT.sectionGap, page.width, fp.goalTable) + LAYOUT.sectionGap,
    };
  }

  if (fp.weeklyLine) page = drawParagraphs(doc, page, [fp.weeklyLine]);
  if (fp.macroIntro) page = drawParagraphs(doc, page, [fp.macroIntro]);

  if (fp.macroRows?.length) {
    page = {
      ...page,
      y: drawMacroTable(doc, page.x, page.y + LAYOUT.sectionGap, page.width, fp.macroRows) + LAYOUT.sectionGap,
    };
  }
}

const SERVINGS_COLUMNS = [
  { key: 'label', width: 0.18, align: 'left' },
  { key: 'daily', width: 0.1, align: 'center' },
  { key: 'breakfast', width: 0.12, align: 'center' },
  { key: 'snack1', width: 0.1, align: 'center' },
  { key: 'lunch', width: 0.1, align: 'center' },
  { key: 'snack2', width: 0.1, align: 'center' },
  { key: 'dinner', width: 0.12, align: 'center' },
  { key: 'snack3', width: 0.1, align: 'center' },
];

function servingsAnytimeRow(row) {
  return {
    ...row,
    breakfast: SERVINGS_ANYTIME_NOTE,
    snack1: '',
    lunch: '',
    snack2: '',
    dinner: '',
    snack3: '',
    _colSpan: SERVINGS_MEAL_COL_SPAN,
  };
}

function buildServingsRows(gridRows) {
  const header = {
    label: '',
    daily: 'Daily',
    breakfast: 'Breakfast',
    snack1: 'Snack',
    lunch: 'Lunch',
    snack2: 'Snack',
    dinner: 'Dinner',
    snack3: 'Snack',
  };
  const bodyRows = (gridRows || []).map((row) => (
    row.label === 'Veggies' ? servingsAnytimeRow(row) : row
  ));
  return [header, ...bodyRows];
}

function drawServingsPage(doc, payload) {
  const servings = payload.servings;
  let page = begin1982Page(doc, payload, 'Servings');
  page = drawParagraphs(doc, page, [servings.note]);
  drawLayoutTable(doc, {
    x: page.x,
    y: page.y + LAYOUT.sectionGap,
    width: page.width,
    columns: SERVINGS_COLUMNS,
    rows: buildServingsRows(servings.gridRows || []),
    headerRows: 1,
  });
}

const CONFIRMATION_TABLE_COLUMNS = Object.freeze([
  { key: 'label', width: 0.34 },
  { key: 'value', width: 0.66 },
]);

const SAMPLE_DAY_MENU_SERVING_SIZE_LABEL = 'serving size';
const SAMPLE_DAY_MENU_ROW_GAP = 10;
const SAMPLE_DAY_MENU_SECTION_GAP = 16;
const SAMPLE_DAY_MENU_TITLE_SECTION_GAP = 28;
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

function menuPlanRowHeight(rowGap) {
  return Math.max(LAYOUT.bodySize + 2 + rowGap, HANDWRITING_FONT_SIZE + 8);
}

function countMenuPlanRowGaps(sections) {
  return (sections || []).reduce(
    (sum, section) => sum + Math.max(0, (section.rows?.length || 0) - 1),
    0,
  );
}

function measureMenuPlanTitleHeight() {
  return LAYOUT.pageTitleSize + 2 + SAMPLE_DAY_MENU_TITLE_SECTION_GAP;
}

function measureMenuSectionHeight(section, rowGap) {
  const rowH = menuPlanRowHeight(rowGap);
  let height = 0;
  if (section.title) height += LAYOUT.sectionTitleSize + LAYOUT.headerGap;
  height += (section.rows?.length || 0) * rowH;
  const hasTimeLine = Boolean(section.time?.value) || !section.title;
  return Math.max(height, hasTimeLine ? 40 : 34);
}

function measureMenuPlanWorksheetNoteHeight(doc, note, width) {
  if (!note?.url) return 0;
  doc.font(FONTS.regular).fontSize(LAYOUT.bodySize);
  const text = `${note.lead || ''}${note.linkLabel || note.url}`;
  return doc.heightOfString(text, { width, lineGap: LAYOUT.lineGap }) + LAYOUT.paragraphGap;
}

function computeMenuPlanLayout(doc, menu, page, filled) {
  const sections = menu.sections || [];
  const baseSectionGap = SAMPLE_DAY_MENU_SECTION_GAP;
  const baseRowGap = SAMPLE_DAY_MENU_ROW_GAP;

  let baseHeight = measureMenuPlanTitleHeight();

  sections.forEach((section) => {
    baseHeight += measureMenuSectionHeight(section, baseRowGap);
    baseHeight += baseSectionGap;
  });

  const noteHeight = filled && menu.worksheetNote
    ? measureMenuPlanWorksheetNoteHeight(doc, menu.worksheetNote, page.width) + 8
    : 0;

  const contentTop = page.y;
  const contentBottom = page.bottom - noteHeight;
  const available = contentBottom - contentTop;
  const extra = Math.max(0, available - baseHeight);
  const gapCount = sections.length + countMenuPlanRowGaps(sections) + 1;
  const extraPerGap = gapCount > 0 ? extra / gapCount : 0;

  return {
    contentTop,
    noteY: page.bottom - noteHeight,
    titleSectionGap: SAMPLE_DAY_MENU_TITLE_SECTION_GAP + extraPerGap,
    sectionGap: baseSectionGap + extraPerGap,
    rowGap: baseRowGap + extraPerGap,
  };
}

function drawSampleDayMenuFillInRow(doc, x, y, width, row, filled, rowGap) {
  const fontSize = LAYOUT.bodySize;
  const lineYOffset = fontSize + 2;
  const labelText = String(row.label);
  const labelFont = row.labelBold ? FONTS.bold : FONTS.regular;
  doc.font(labelFont).fontSize(fontSize).fillColor(SEMINAR_COLORS.body);

  const gap = 5;
  const sizeLabel = SAMPLE_DAY_MENU_SERVING_SIZE_LABEL;
  const labelW = doc.widthOfString(labelText);
  doc.font(FONTS.regular).fontSize(fontSize);
  const sizeLabelW = doc.widthOfString(sizeLabel);
  doc.font(labelFont).fontSize(fontSize);

  const foodLineStart = x + labelW + gap;
  const sizeTextX = x + width * 0.62;
  const foodLineEnd = sizeTextX - gap;
  const sizeLineStart = sizeTextX + sizeLabelW + gap;
  const sizeLineEnd = x + width;

  const lineY = y + lineYOffset;

  doc.text(labelText, x, y, { lineBreak: false });
  doc.font(FONTS.regular).fontSize(fontSize).fillColor(SEMINAR_COLORS.body);
  doc.text(sizeLabel, sizeTextX, y, { lineBreak: false });

  doc
    .strokeColor(TABLE_1982.stroke)
    .lineWidth(0.75)
    .moveTo(foodLineStart, lineY)
    .lineTo(foodLineEnd, lineY)
    .stroke()
    .moveTo(sizeLineStart, lineY)
    .lineTo(sizeLineEnd, lineY)
    .stroke();

  if (filled) {
    drawHandwritingOnLine(doc, row.food, foodLineStart + 2, lineY, foodLineEnd - foodLineStart - 4);
    drawHandwritingOnLine(doc, row.servingSize, sizeLineStart + 2, lineY, sizeLineEnd - sizeLineStart - 4);
  }

  return lineY + rowGap;
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
  const sectionHeight = measureMenuSectionHeight(section, layout.rowGap);

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

  return y + Math.max(sectionHeight, mealY - y) + layout.sectionGap;
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
    .fillColor(SAMPLE_DIET_BLUE)
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

  const filled = Boolean(menu.filled);
  if (filled) registerHandwritingFont(doc);

  const page = begin1982Page(doc, payload, null, {
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

function drawAnswersConfirmationPage(doc, payload) {
  const confirmation = payload.answersConfirmation;
  if (!confirmation?.rows?.length) return;

  let page = begin1982Page(doc, payload, 'Questionnaire confirmation');

  if (confirmation.intro) {
    doc
      .font(FONTS.regular)
      .fontSize(LAYOUT.bodySize)
      .fillColor(SEMINAR_COLORS.body)
      .text(String(confirmation.intro), page.x, page.y, {
        width: page.width,
        lineGap: LAYOUT.lineGap,
      });
    page = { ...page, y: doc.y + LAYOUT.headerGap };
  }

  drawLayoutTable(doc, {
    x: page.x,
    y: page.y,
    width: page.width,
    columns: CONFIRMATION_TABLE_COLUMNS,
    rows: confirmation.rows.map((row) => ({
      label: row.label,
      value: row.value,
    })),
    headerRows: 0,
    tableRowPad: LAYOUT.tableRowPad + 1,
  });
}

export const SAMPLE_DIET_PRINTOUT_MIN_PAGES = 8;

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

  drawWelcomePage(doc, payload);
  drawLeanBodyAnalysisPage(doc, payload);
  drawFoodPlanPage(doc, payload);
  drawServingsPage(doc, payload);

  const foodListFrame = {
    startPage: (doc, payload, pageTitle) => begin1982Page(doc, payload, pageTitle ?? null),
    continuePage: (doc, payload) => begin1982Page(doc, payload, null),
  };
  drawStaplesFoodListPage(doc, payload, foodListFrame);
  drawVegFruitFoodListPage(doc, payload, foodListFrame);
  drawSampleDayMenuPage(doc, payload);
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
