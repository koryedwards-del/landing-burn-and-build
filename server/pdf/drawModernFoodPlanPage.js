/**
 * Modern Food Plan page — gold/black layout matching the 2026 mockup.
 */
import { begin1982Page } from './draw1982Frame.js';
import {
  MODERN_REPORT_COLORS,
  MODERN_REPORT_FONTS,
  centeredBandTextY,
  modernReportContentBox,
} from './drawModernReportFrame.js';

export { drawModernReportFooter as drawModernFoodPlanFooter } from './drawModernReportFrame.js';

export const MODERN_FOOD_PLAN_FONTS = MODERN_REPORT_FONTS;
export const MODERN_FOOD_PLAN_COLORS = MODERN_REPORT_COLORS;

const LAYOUT = Object.freeze({
  bodySize: 9,
  bodyLineGap: 2,
  paragraphGap: 5,
  sectionGap: 6,
  tableHeadSize: 8,
  tableBodySize: 8,
  dashboardHeadSize: 7.5,
  dashboardValueSize: 10,
  dashboardPctSize: 7,
  lossValueSize: 22,
  cellPad: 5,
  footerReserve: 36,
});

function modernContentBox(doc) {
  return modernReportContentBox(doc);
}

function drawMixedParagraph(doc, x, y, width, parts, { fontSize, lineGap, paragraphGap } = {}) {
  const fonts = MODERN_FOOD_PLAN_FONTS;
  const colors = MODERN_FOOD_PLAN_COLORS;
  const size = fontSize || LAYOUT.bodySize;
  const gap = lineGap ?? LAYOUT.bodyLineGap;
  let cursorY = y;

  parts.forEach((paragraph) => {
    if (!paragraph?.length) return;
    let lineY = cursorY;
    let lineX = x;
    let lineMaxH = 0;
    paragraph.forEach((segment, index) => {
      const font = segment.bold ? fonts.bold : fonts.regular;
      doc.font(font).fontSize(size).fillColor(colors.body);
      const text = String(segment.text || '');
      const textW = doc.widthOfString(text);
      if (lineX + textW > x + width && lineX > x) {
        lineY += lineMaxH + gap;
        lineX = x;
        lineMaxH = 0;
      }
      doc.text(text, lineX, lineY, { lineBreak: false });
      const h = doc.currentLineHeight();
      lineMaxH = Math.max(lineMaxH, h);
      lineX += textW;
      if (index === paragraph.length - 1) {
        cursorY = lineY + lineMaxH + (paragraphGap ?? LAYOUT.paragraphGap);
      }
    });
  });

  return cursorY;
}

function drawBodyParagraph(doc, x, y, width, text) {
  const maxY = modernContentBox(doc).bottom - LAYOUT.footerReserve;
  const remaining = Math.max(40, maxY - y);
  doc
    .font(MODERN_FOOD_PLAN_FONTS.regular)
    .fontSize(LAYOUT.bodySize)
    .fillColor(MODERN_FOOD_PLAN_COLORS.body)
    .text(String(text || ''), x, y, {
      width,
      height: remaining,
      lineGap: LAYOUT.bodyLineGap,
      align: 'left',
    });
  return Math.min(doc.y + LAYOUT.paragraphGap, maxY);
}

function parseExerciseParagraph(text) {
  const raw = String(text || '');
  const loseMatch = raw.match(/(In eight weeks, you could (?:safely )?lose )([\d.]+)( pounds of fat\.)(.*)/i);
  if (!loseMatch) return null;
  const hoursMatch = loseMatch[4].match(/(.*?)([\d.]+)( hour\(s\) per week\.)(.*)/i);
  if (!hoursMatch) return null;
  return [[
    { text: loseMatch[1] },
    { text: `${loseMatch[2]}${loseMatch[3]}`, bold: true },
    { text: hoursMatch[1] },
    { text: `${hoursMatch[2]}${hoursMatch[3]}`, bold: true },
    { text: hoursMatch[4] },
  ]];
}

function drawDashboardMetricRow(doc, {
  x, y, width, label, pct, lbs,
}) {
  const fonts = MODERN_FOOD_PLAN_FONTS;
  const colors = MODERN_FOOD_PLAN_COLORS;
  const textX = x + 12;
  const textW = width - 24;

  doc
    .font(fonts.bold)
    .fontSize(LAYOUT.dashboardHeadSize)
    .fillColor(colors.body)
    .text(label, textX, y + 2, { width: textW, lineBreak: false });

  doc
    .font(fonts.regular)
    .fontSize(LAYOUT.dashboardPctSize)
    .fillColor(colors.muted)
    .text(pct, textX, y + 12, { width: textW, lineBreak: false });

  doc
    .font(fonts.bold)
    .fontSize(LAYOUT.dashboardValueSize)
    .fillColor(colors.body)
    .text(lbs, textX, y + 21, { width: textW, lineBreak: false });

  return y + 34;
}

function drawModernGoalDashboard(doc, x, y, width, goalTable, fatLostLbs) {
  if (!goalTable?.rows?.length) return y;
  const fonts = MODERN_FOOD_PLAN_FONTS;
  const colors = MODERN_FOOD_PLAN_COLORS;
  const pad = 8;
  const headH = 16;
  const rowH = 32;
  const bodyH = pad + headH + rowH * 3 + pad;
  const sideW = width * 0.31;
  const centerW = width - sideW * 2;
  const radius = 8;

  doc
    .strokeColor(colors.gold)
    .lineWidth(1.25)
    .roundedRect(x, y, width, bodyH, radius)
    .stroke();

  const leftX = x;
  const centerX = x + sideW;
  const rightX = x + sideW + centerW;

  [leftX, rightX].forEach((colX, index) => {
    const title = index === 0 ? 'TODAY' : '8-WEEK GOAL';
    const bandTop = y + pad;
    const bandW = sideW - pad * 2;
    doc
      .roundedRect(colX + pad, bandTop, bandW, headH, 4)
      .fill(colors.body);
    const titleY = centeredBandTextY(doc, bandTop, headH, {
      font: fonts.bold,
      fontSize: LAYOUT.dashboardHeadSize,
      text: title,
    });
    doc
      .font(fonts.bold)
      .fontSize(LAYOUT.dashboardHeadSize)
      .fillColor(colors.white)
      .text(title, colX + pad, titleY, {
        width: bandW,
        align: 'center',
        lineGap: 0,
      });
  });

  doc
    .roundedRect(centerX + 4, y + pad, centerW - 8, bodyH - pad * 2, 6)
    .fill(colors.goldPale);

  const lossText = fatLostLbs != null ? `-${Number(fatLostLbs).toFixed(1)}` : '—';
  doc
    .font(fonts.bold)
    .fontSize(8)
    .fillColor(colors.body)
    .text('YOU COULD LOSE', centerX, y + pad + 18, {
      width: centerW,
      align: 'center',
      lineGap: 0,
    });
  doc
    .font(fonts.bold)
    .fontSize(LAYOUT.lossValueSize)
    .fillColor(colors.body)
    .text(lossText, centerX, y + pad + 34, {
      width: centerW,
      align: 'center',
      lineGap: 0,
    });
  doc
    .font(fonts.bold)
    .fontSize(9)
    .fillColor(colors.body)
    .text('LBS FAT', centerX, y + pad + 64, {
      width: centerW,
      align: 'center',
      lineGap: 0,
    });

  const lean = goalTable.rows.find((row) => row.label === 'LEAN') || {};
  const fat = goalTable.rows.find((row) => row.label === 'FAT') || {};
  const total = goalTable.rows.find((row) => row.label === 'TOTAL') || {};

  let rowY = y + pad + headH + 4;
  const metrics = [
    { label: 'LEAN', todayPct: lean.todayPct, todayLbs: lean.todayLbs, goalPct: lean.goalB, goalLbs: lean.goalC },
    { label: 'FAT', todayPct: fat.todayPct, todayLbs: fat.todayLbs, goalPct: fat.goalB, goalLbs: fat.goalC },
    { label: 'TOTAL', todayPct: total.todayPct, todayLbs: total.todayLbs, goalPct: total.goalB, goalLbs: total.goalC },
  ];

  metrics.forEach((metric) => {
    drawDashboardMetricRow(doc, {
      x: leftX,
      y: rowY,
      width: sideW,
      label: metric.label,
      pct: metric.todayPct,
      lbs: metric.todayLbs,
    });
    drawDashboardMetricRow(doc, {
      x: rightX,
      y: rowY,
      width: sideW,
      label: metric.label,
      pct: metric.goalPct,
      lbs: metric.goalLbs,
    });
    rowY += rowH;
  });

  return y + bodyH;
}

const CALORIES_TABLE_LABEL_WIDTH = 0.22;

function caloriesTableColDefs(columns = []) {
  const dataW = (1 - CALORIES_TABLE_LABEL_WIDTH) / Math.max(columns.length, 1);
  return [
    { key: 'label', width: CALORIES_TABLE_LABEL_WIDTH, align: 'left' },
    ...columns.map((col) => ({ key: col.key, width: dataW, align: 'center' })),
  ];
}

function measureCaloriesTableRow(doc, row, colDefs, colWidths, { isHeader, rowPad, fonts }) {
  let maxH = rowPad * 2;
  colDefs.forEach((col, index) => {
    const innerW = colWidths[index] - LAYOUT.cellPad * 2;
    doc.font(isHeader || row._bold ? fonts.bold : fonts.regular).fontSize(
      isHeader ? LAYOUT.tableHeadSize : LAYOUT.tableBodySize,
    );
    const text = String(row[col.key] ?? '');
    maxH = Math.max(
      maxH,
      doc.heightOfString(text, { width: innerW, lineGap: 0 }) + rowPad * 2,
    );
  });
  return maxH;
}

function drawModernCaloriesTable(doc, x, y, width, caloriesTable) {
  const fonts = MODERN_FOOD_PLAN_FONTS;
  const colors = MODERN_FOOD_PLAN_COLORS;
  const columns = caloriesTable?.columns || [];
  const bodyRows = caloriesTable?.rows || [];
  if (!columns.length || !bodyRows.length) return y;

  const maxY = modernContentBox(doc).bottom - LAYOUT.footerReserve;
  const colDefs = caloriesTableColDefs(columns);
  const colWidths = colDefs.map((col) => col.width * width);
  const colXs = [];
  let cx = x;
  for (const w of colWidths) {
    colXs.push(cx);
    cx += w;
  }

  const rowPad = LAYOUT.cellPad;
  const headerRow = {
    label: '',
    ...Object.fromEntries(columns.map((col) => [col.key, col.label])),
  };
  const headerH = measureCaloriesTableRow(doc, headerRow, colDefs, colWidths, {
    isHeader: true,
    rowPad,
    fonts,
  });
  const bodyHeights = bodyRows.map((row) => measureCaloriesTableRow(doc, row, colDefs, colWidths, {
    isHeader: false,
    rowPad,
    fonts,
  }));
  const totalH = headerH + bodyHeights.reduce((sum, h) => sum + h, 0);
  if (y + totalH > maxY) {
    return y;
  }

  doc
    .strokeColor(colors.gold)
    .lineWidth(1.25)
    .roundedRect(x, y, width, totalH, 4)
    .stroke();

  let cy = y;
  doc.rect(x + 0.5, cy, width - 1, headerH).fill(colors.goldPale);
  colDefs.forEach((col, index) => {
    const text = String(headerRow[col.key] ?? '');
    if (!text) return;
    doc
      .font(fonts.bold)
      .fontSize(LAYOUT.tableHeadSize)
      .fillColor(colors.body)
      .text(text, colXs[index] + LAYOUT.cellPad, cy + rowPad, {
        width: colWidths[index] - LAYOUT.cellPad * 2,
        align: col.align || 'left',
        lineGap: 0,
      });
  });
  cy += headerH;
  doc
    .strokeColor(colors.gold)
    .lineWidth(0.75)
    .moveTo(x, cy)
    .lineTo(x + width, cy)
    .stroke();

  bodyRows.forEach((row, rowIndex) => {
    const rh = bodyHeights[rowIndex];
    colDefs.forEach((col, index) => {
      const cellText = String(row[col.key] ?? '');
      const isLabel = col.key === 'label';
      doc
        .font(isLabel ? fonts.bold : fonts.regular)
        .fontSize(LAYOUT.tableBodySize)
        .fillColor(colors.body)
        .text(cellText, colXs[index] + LAYOUT.cellPad, cy + rowPad, {
          width: colWidths[index] - LAYOUT.cellPad * 2,
          align: col.align || 'left',
          lineGap: 0,
        });
    });
    cy += rh;
    if (rowIndex < bodyRows.length - 1) {
      doc
        .strokeColor(colors.gold)
        .lineWidth(0.75)
        .moveTo(x, cy)
        .lineTo(x + width, cy)
        .stroke();
    }
  });

  return y + totalH;
}

export function drawModernFoodPlanPage(doc, payload) {
  const page = begin1982Page(doc, payload, 'Food Plan');
  const fp = payload.foodPlan || {};
  let y = page.y;

  y = drawBodyParagraph(doc, page.x, y, page.width, fp.lead);

  if (fp.exerciseParagraph) {
    const mixed = parseExerciseParagraph(fp.exerciseParagraph);
    y = mixed
      ? drawMixedParagraph(doc, page.x, y, page.width, mixed)
      : drawBodyParagraph(doc, page.x, y, page.width, fp.exerciseParagraph);
  }

  if (fp.goalTable) {
    const fatRow = fp.goalTable.rows?.find((row) => row.label === 'FAT');
    const fatLost = fatRow?.goalA?.match(/-([\d.]+)/)?.[1] ?? null;
    y = drawModernGoalDashboard(doc, page.x, y + LAYOUT.sectionGap, page.width, fp.goalTable, fatLost) + LAYOUT.sectionGap;
  }

  if (fp.weeklyLine) y = drawBodyParagraph(doc, page.x, y, page.width, fp.weeklyLine);
  if (fp.macroIntro) y = drawBodyParagraph(doc, page.x, y, page.width, fp.macroIntro);

  if (fp.caloriesTable?.rows?.length) {
    drawModernCaloriesTable(doc, page.x, y + LAYOUT.sectionGap, page.width, fp.caloriesTable);
  }
}
