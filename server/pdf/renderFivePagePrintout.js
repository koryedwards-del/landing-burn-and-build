/**
 * B&B 5-page printout — 1982 Warner layout (Welcome → LBA → History → Food Plan → Servings).
 * Preview: scripts/render-five-page-preview.mjs
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

const FONTS = PDF_FRAME_FONTS;
const LAYOUT = FRAME_1982;

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
  return rows.map((row, rowIndex) => {
    const isHeader = rowIndex < headerRows;
    let maxH = tableRowPad * 2;
    columns.forEach((col) => {
      const colW = col.width * (rows._tableWidth || 1);
      const innerW = colW - pad * 2;
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
      const w = colWidths[index];
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
  const page = begin1982Page(doc, payload, 'Welcome', { fullHeader: true });
  let current = drawParagraphs(doc, page, payload.welcome.intro);
  current = drawSectionBlock(doc, current, 'Lean Body Analysis', payload.welcome.leanBodyAnalysis);
  current = drawSectionBlock(doc, current, 'History', payload.welcome.history);
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

function drawHistoryPage(doc, payload) {
  let page = begin1982Page(doc, payload, 'Body Composition History');
  const columns = [
    { key: 'testDate', width: 0.12, align: 'center' },
    { key: 'thigh', width: 0.1, align: 'center' },
    { key: 'waist', width: 0.1, align: 'center' },
    { key: 'weight', width: 0.12, align: 'center' },
    { key: 'lean', width: 0.12, align: 'center' },
    { key: 'fat', width: 0.12, align: 'center' },
    { key: 'percent', width: 0.12, align: 'center' },
    { key: 'activity', width: 0.2, align: 'center' },
  ];
  const headerRow = {
    testDate: 'TEST\nDATE',
    thigh: 'THIGH',
    waist: 'WAIST',
    weight: 'WEIGHT',
    lean: 'LEAN',
    fat: 'FAT',
    percent: 'PERCENT',
    activity: 'ACTIVITY',
  };
  const rows = [headerRow, ...(payload.history?.rows || [])];
  drawLayoutTable(doc, {
    x: page.x,
    y: page.y,
    width: page.width,
    columns,
    rows,
    headerRows: 1,
  });
}

function drawGoalTable(doc, x, y, width, goalTable) {
  if (!goalTable) return y;
  const columns = [
    { key: 'label', width: 0.12, align: 'left' },
    { key: 'todayPct', width: 0.14, align: 'center' },
    { key: 'todayLbs', width: 0.16, align: 'center' },
    { key: 'goalA', width: 0.2, align: 'center' },
    { key: 'goalB', width: 0.14, align: 'center' },
    { key: 'goalC', width: 0.24, align: 'center' },
  ];
  const head = {
    label: '',
    todayPct: 'TODAY',
    todayLbs: '',
    goalA: 'EIGHT WEEK GOAL',
    goalB: '',
    goalC: '',
  };
  return drawLayoutTable(doc, {
    x,
    y,
    width,
    columns,
    rows: [head, ...goalTable.rows],
    headerRows: 1,
  });
}

function drawMacroTable(doc, x, y, width, macroRows) {
  const columns = [
    { key: 'label', width: 0.22, align: 'left' },
    { key: 'proteinG', width: 0.08, align: 'center' },
    { key: 'proteinCal', width: 0.1, align: 'center' },
    { key: 'carbsG', width: 0.08, align: 'center' },
    { key: 'carbsCal', width: 0.1, align: 'center' },
    { key: 'fatG', width: 0.08, align: 'center' },
    { key: 'fatCal', width: 0.1, align: 'center' },
    { key: 'totalCal', width: 0.12, align: 'center' },
  ];
  const head1 = {
    label: '',
    proteinG: 'PROTEIN',
    proteinCal: '',
    carbsG: 'CARBS',
    carbsCal: '',
    fatG: 'FATS',
    fatCal: '',
    totalCal: 'TOTAL',
  };
  const head2 = {
    label: '',
    proteinG: 'grams',
    proteinCal: 'calories',
    carbsG: 'grams',
    carbsCal: 'calories',
    fatG: 'grams',
    fatCal: 'calories',
    totalCal: 'calories',
  };
  const body = macroRows.map((row) => ({ ...row }));
  return drawLayoutTable(doc, {
    x,
    y,
    width,
    columns,
    rows: [head1, head2, ...body],
    headerRows: 2,
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
  const extraRows = (extraFats || []).map((line, index) => ({
    label: index === 0 ? 'Extra Fats' : '',
    daily: line.value,
    breakfast: line.note,
    snack1: '',
    lunch: '',
    snack2: '',
    dinner: '',
    snack3: '',
  }));
  return [header, ...gridRows, ...extraRows];
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

export const FIVE_PAGE_PRINTOUT_PAGES = 5;

export function validateFivePagePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Five-page printout requires a payload object.');
  }
  if (payload.view !== 'fivepage') {
    throw new Error(`Expected view fivepage, got ${payload.view}`);
  }
  if (!payload.clientName || !payload.preparedDate) {
    throw new Error('clientName and preparedDate are required.');
  }
  return payload;
}

export async function renderFivePagePrintout(payload, { title, buildLabel } = {}) {
  validateFivePagePayload(payload);

  const creator = createPrintPdf({
    title: title || payload.title || 'B&B 5-Page Printout',
    author: 'Burn & Build Diet',
  });
  const doc = creator.doc;
  if (buildLabel) {
    doc.info.Subject = `B&B 5-page printout sample ${buildLabel}`;
  }

  drawWelcomePage(doc, payload);
  drawLeanBodyAnalysisPage(doc, payload);
  drawHistoryPage(doc, payload);
  drawFoodPlanPage(doc, payload);
  drawServingsPage(doc, payload);

  stamp1982Footers(doc, payload.header);

  const buffer = await creator.finish({ stampPageNumbers: false });
  const pages = (buffer.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  if (pages !== FIVE_PAGE_PRINTOUT_PAGES) {
    throw new Error(`Five-page printout expected ${FIVE_PAGE_PRINTOUT_PAGES} pages, got ${pages}`);
  }
  return buffer;
}
