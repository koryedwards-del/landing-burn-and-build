/**
 * B&B Sample Diet PDF (deliverable: docs/samples/b&bsamplediet.pdf).
 * 1982 Warner layout + food lists. Preview: scripts/render-sample-diet-preview.mjs
 */
import { createPrintPdf } from './creator.js';
import { PDF_FRAME_FONTS } from './drawFrame.js';
import { SEMINAR_COLORS } from './drawSeminar.js';
import {
  begin1982Page,
  FRAME_1982,
  stamp1982Footers,
  TABLE_1982,
} from './draw1982Frame.js';
import {
  drawStaplesFoodListPage,
  drawVegFruitFoodListPage,
} from './drawStaplesFoodListPages.js';

const FONTS = PDF_FRAME_FONTS;
const LAYOUT = FRAME_1982;
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

function tableCellWidth(colWidths, columns, row, colIndex) {
  for (const span of getRowColSpans(row)) {
    const bounds = tableColumnSpanBounds(columns, span);
    if (bounds && colIndex === bounds.fromIndex) {
      return tableColumnSpanWidth(colWidths, bounds);
    }
  }
  return colWidths[colIndex];
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

function layoutTableRowHeights(doc, { columns, rows, headerRows = 1, tableRowPad = LAYOUT.tableRowPad }) {
  const pad = TABLE_1982.cellPad;
  const tableWidth = rows._tableWidth || 1;
  const colWidths = columns.map((col) => col.width * tableWidth);
  return rows.map((row, rowIndex) => {
    const isHeader = rowIndex < headerRows;
    let maxH = tableRowPad * 2;
    columns.forEach((col, index) => {
      if (isTableColumnSpanned(columns, row, index)) return;
      const innerW = tableCellWidth(colWidths, columns, row, index) - pad * 2;
      const style = row._styles?.[col.key] || {
        font: isHeader ? FONTS.bold : FONTS.regular,
        fontSize: isHeader ? LAYOUT.tableHeadSize : LAYOUT.tableBodySize,
      };
      doc.font(style.font).fontSize(style.fontSize);
      maxH = Math.max(
        maxH,
        doc.heightOfString(String(row[col.key] ?? ''), { width: innerW, lineGap: 0 }) + tableRowPad * 2,
      );
    });
    return maxH;
  });
}

function drawLayoutTable(doc, { x, y, width, columns, rows, headerRows = 1, tableRowPad = LAYOUT.tableRowPad }) {
  rows._tableWidth = width;
  const colWidths = columns.map((col) => col.width * width);
  const rowHeights = layoutTableRowHeights(doc, { columns, rows, headerRows, tableRowPad });
  const totalH = rowHeights.reduce((sum, h) => sum + h, 0);
  const pad = TABLE_1982.cellPad;

  doc
    .strokeColor(TABLE_1982.stroke)
    .lineWidth(1.25)
    .roundedRect(x, y, width, totalH, TABLE_1982.radius)
    .stroke();

  let cy = y;
  rows.forEach((row, rowIndex) => {
    const rh = rowHeights[rowIndex];
    const isHeader = rowIndex < headerRows;
    let cx = x;
    columns.forEach((col, index) => {
      if (isTableColumnSpanned(columns, row, index)) return;
      const w = tableCellWidth(colWidths, columns, row, index);
      const style = row._styles?.[col.key] || {
        font: isHeader ? FONTS.bold : FONTS.regular,
        fontSize: isHeader ? LAYOUT.tableHeadSize : LAYOUT.tableBodySize,
      };
      doc
        .font(style.font)
        .fontSize(style.fontSize)
        .fillColor(row._colors?.[col.key] || SEMINAR_COLORS.body)
        .text(String(row[col.key] ?? ''), cx + pad, cy + tableRowPad, {
          width: w - pad * 2,
          lineGap: 0,
          align: col.align || 'left',
        });
      cx += w;
    });
    cy += rh;
    if (rowIndex < rows.length - 1) {
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

function lbaTodayPctDisplay(pct) {
  const raw = String(pct ?? '').trim().replace(/%$/, '');
  return raw ? `${raw} %` : '—';
}

function drawLbaTodayBlock(doc, x, y, width, todayRows) {
  const blue = '#2F6FA8';
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
    .fillColor(blue)
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

  doc
    .font(FONTS.regular)
    .fontSize(LAYOUT.bodySize)
    .fillColor(SEMINAR_COLORS.body)
    .text(lba.profileLine, page.x, page.y, { width: page.width, lineGap: 0 });
  page = { ...page, y: doc.y + LAYOUT.sectionGap };

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

function macroTableColDefs() {
  return [
    { key: 'label', width: 0.24, align: 'left' },
    { key: 'proteinG', width: 0.09, align: 'center' },
    { key: 'proteinCal', width: 0.108, align: 'center' },
    { key: 'carbsG', width: 0.09, align: 'center' },
    { key: 'carbsCal', width: 0.108, align: 'center' },
    { key: 'fatG', width: 0.09, align: 'center' },
    { key: 'fatCal', width: 0.108, align: 'center' },
    { key: 'totalCal', width: 0.166, align: 'center' },
  ];
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

function measureMacroTableRow(doc, row, colDefs, width, { isHeader, tableRowPad, cellPad }) {
  let maxH = tableRowPad * 2;
  colDefs.forEach((col) => {
    const colW = col.width * width;
    const innerW = colW - cellPad * 2;
    doc.font(isHeader ? FONTS.bold : FONTS.regular).fontSize(
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
  const bodyRows = macroRows.map((row) => ({ ...row }));
  const groupHeaderH = LAYOUT.tableHeadSize + tableRowPad * 2;
  const subHeaderH = measureMacroTableRow(doc, subHeader, colDefs, width, {
    isHeader: true,
    tableRowPad,
    cellPad,
  });
  const bodyHeights = bodyRows.map((row) => measureMacroTableRow(doc, row, colDefs, width, {
    isHeader: false,
    tableRowPad,
    cellPad,
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
    doc.text(text, colXs[index] + cellPad, cy + tableRowPad, {
      width: colWidths[index] - cellPad * 2,
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
      doc
        .font(FONTS.regular)
        .fontSize(LAYOUT.tableBodySize)
        .fillColor(SEMINAR_COLORS.body)
        .text(String(row[col.key] ?? ''), colXs[index] + cellPad, cy + tableRowPad, {
          width: colWidths[index] - cellPad * 2,
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

function buildServingsRows(gridRows, extraFats) {
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
  const extraRows = (extraFats || []).map((line, index) => ({
    label: index === 0 ? 'Extra Fats' : '',
    daily: line.value,
    breakfast: line.note,
    snack1: '',
    lunch: '',
    snack2: '',
    dinner: '',
    snack3: '',
    _colSpan: { from: 'breakfast', to: 'snack3' },
  }));
  return [header, ...bodyRows, ...extraRows];
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
    rows: buildServingsRows(servings.gridRows || [], servings.extraFats || []),
    headerRows: 1,
  });
}

export const SAMPLE_DIET_PRINTOUT_MIN_PAGES = 6;

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

  stamp1982Footers(doc, payload.header);

  const buffer = await creator.finish({ stampPageNumbers: false });
  const pages = (buffer.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  if (pages < SAMPLE_DIET_PRINTOUT_MIN_PAGES) {
    throw new Error(`Sample diet printout expected at least ${SAMPLE_DIET_PRINTOUT_MIN_PAGES} pages, got ${pages}`);
  }
  return buffer;
}
