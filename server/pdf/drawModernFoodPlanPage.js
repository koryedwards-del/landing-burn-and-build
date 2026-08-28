/**
 * Modern Food Plan page — gold/black layout matching the 2026 mockup.
 */
import { begin1982Page } from './draw1982Frame.js';
import {
  MODERN_REPORT_COLORS,
  MODERN_REPORT_FONTS,
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
  const loseMatch = raw.match(/(In eight weeks, you could safely lose )([\d.]+)( pounds of fat\.)(.*)/i);
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
    doc
      .roundedRect(colX + pad, y + pad, sideW - pad * 2, headH, 4)
      .fill(colors.body);
    doc
      .font(fonts.bold)
      .fontSize(LAYOUT.dashboardHeadSize)
      .fillColor(colors.white)
      .text(title, colX + pad, y + pad + 5, {
        width: sideW - pad * 2,
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

const MACRO_VALUE_KEYS = Object.freeze([
  'proteinG', 'proteinCal', 'carbsG', 'carbsCal', 'fatG', 'fatCal', 'totalCal',
]);

function macroColDefs() {
  const labelW = 0.33;
  const groupW = (1 - labelW) / 4;
  const pairW = groupW / 2;
  return [
    { key: 'label', width: labelW, align: 'left', singleLine: true },
    { key: 'proteinG', width: pairW, align: 'right' },
    { key: 'proteinCal', width: pairW, align: 'right' },
    { key: 'carbsG', width: pairW, align: 'right' },
    { key: 'carbsCal', width: pairW, align: 'right' },
    { key: 'fatG', width: pairW, align: 'right' },
    { key: 'fatCal', width: pairW, align: 'right' },
    { key: 'totalCal', width: groupW, align: 'right' },
  ];
}

function macroGroupHeaders() {
  return [
    { label: 'PROTEIN', keys: ['proteinG', 'proteinCal'] },
    { label: 'CARBS', keys: ['carbsG', 'carbsCal'] },
    { label: 'FATS', keys: ['fatG', 'fatCal'] },
    { label: 'TOTAL', keys: ['totalCal'] },
  ];
}

function macroSubHeaderRow() {
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

function isYourPlanRow(row) {
  return String(row?.label || '').startsWith('Reduce current fat %');
}

function drawModernMacroTable(doc, x, y, width, macroRows = []) {
  const fonts = MODERN_FOOD_PLAN_FONTS;
  const colors = MODERN_FOOD_PLAN_COLORS;
  const maxY = modernContentBox(doc).bottom - LAYOUT.footerReserve;
  const colDefs = macroColDefs();
  const colWidths = colDefs.map((col) => col.width * width);
  const colXs = [];
  let cx = x;
  for (const w of colWidths) {
    colXs.push(cx);
    cx += w;
  }

  const titleH = 18;
  const groupH = 15;
  const subH = 14;
  const rowPad = 4;
  const bodyRows = macroRows.map((row) => (
    isYourPlanRow(row) ? { ...row, label: 'Reduce current fat % (YOUR PLAN)' } : row
  ));

  doc.font(fonts.regular).fontSize(LAYOUT.tableBodySize);
  const bodyHeights = bodyRows.map((row) => {
    let maxH = rowPad * 2;
    colDefs.forEach((col, index) => {
      const innerW = colWidths[index] - 8;
      doc.font(isYourPlanRow(row) ? fonts.bold : fonts.regular);
      const text = String(row[col.key] ?? '');
      const textH = col.singleLine
        ? doc.heightOfString(text, { lineBreak: false })
        : doc.heightOfString(text, { width: innerW, lineGap: 0 });
      maxH = Math.max(maxH, textH + rowPad * 2);
    });
    return maxH;
  });
  const totalH = titleH + groupH + subH + bodyHeights.reduce((sum, h) => sum + h, 0);
  if (y + totalH > maxY) {
    return y;
  }

  doc
    .strokeColor(colors.rule)
    .lineWidth(0.75)
    .roundedRect(x, y, width, totalH, 4)
    .stroke();

  doc
    .roundedRect(x, y, width, titleH, 4)
    .fill(colors.body);
  doc
    .font(fonts.bold)
    .fontSize(LAYOUT.tableHeadSize)
    .fillColor(colors.white)
    .text('YOUR DAILY FOOD REQUIREMENTS', x, y + 6, {
      width,
      align: 'center',
      lineGap: 0,
    });

  let cy = y + titleH;
  doc
    .strokeColor(colors.rule)
    .lineWidth(0.5)
    .moveTo(x, cy)
    .lineTo(x + width, cy)
    .stroke();

  doc.font(fonts.bold).fontSize(LAYOUT.tableHeadSize).fillColor(colors.body);
  macroGroupHeaders().forEach((group) => {
    const startIndex = colDefs.findIndex((col) => col.key === group.keys[0]);
    const endIndex = colDefs.findIndex((col) => col.key === group.keys[group.keys.length - 1]);
    const groupX = colXs[startIndex];
    const groupW = colXs[endIndex] + colWidths[endIndex] - groupX;
    doc.text(group.label, groupX, cy + 4, {
      width: groupW,
      align: 'center',
      lineGap: 0,
    });
  });
  cy += groupH;
  doc.moveTo(x, cy).lineTo(x + width, cy).stroke();

  const subHeader = macroSubHeaderRow();
  colDefs.forEach((col, index) => {
    const text = String(subHeader[col.key] ?? '');
    if (!text) return;
    doc
      .font(fonts.bold)
      .fontSize(7.5)
      .fillColor(colors.muted)
      .text(text, colXs[index] + 4, cy + 4, {
        width: colWidths[index] - 8,
        align: col.align || 'left',
        lineGap: 0,
      });
  });
  cy += subH;
  doc.moveTo(x, cy).lineTo(x + width, cy).stroke();

  bodyRows.forEach((row, rowIndex) => {
    const rh = bodyHeights[rowIndex];
    if (isYourPlanRow(row)) {
      doc.rect(x + 0.5, cy, width - 1, rh).fill(colors.gold);
    }
    colDefs.forEach((col, index) => {
      const bold = isYourPlanRow(row);
      const cellText = String(row[col.key] ?? '');
      doc
        .font(bold ? fonts.bold : fonts.regular)
        .fontSize(LAYOUT.tableBodySize)
        .fillColor(colors.body)
        .text(cellText, colXs[index] + 4, cy + rowPad, {
          width: col.singleLine ? undefined : colWidths[index] - 8,
          align: col.align || 'left',
          lineGap: 0,
          lineBreak: !col.singleLine,
        });
    });
    cy += rh;
    if (rowIndex < bodyRows.length - 1) {
      doc.strokeColor(colors.rule).moveTo(x, cy).lineTo(x + width, cy).stroke();
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

  if (fp.macroRows?.length) {
    drawModernMacroTable(doc, page.x, y + LAYOUT.sectionGap, page.width, fp.macroRows);
  }
}
