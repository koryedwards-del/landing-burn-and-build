/**
 * Modern Food Plan page — gold/black layout matching the 2026 mockup.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { PDF_MARGIN } from './constants.js';
import { logoPath } from './draw.js';
import { drawWatermark } from './draw.js';
import { PDF_FRAME_CONTACT } from './drawFrame.js';

const FONT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fonts');

export const MODERN_FOOD_PLAN_FONTS = Object.freeze({
  regular: 'Montserrat',
  bold: 'Montserrat-Bold',
  italic: 'Montserrat-Italic',
  boldItalic: 'Montserrat-BoldItalic',
});

export const MODERN_FOOD_PLAN_COLORS = Object.freeze({
  body: '#111111',
  muted: '#5C5C5C',
  gold: '#C9A227',
  goldLight: '#F3E4B8',
  goldPale: '#FBF6E8',
  white: '#FFFFFF',
  rule: '#D8D8D8',
});

const LAYOUT = Object.freeze({
  logoWidth: 66,
  titleSize: 28,
  titleRule: 2.5,
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
  /** Center “you could lose” panel — low enough to let the page watermark show through. */
  lossPanelFillOpacity: 0.35,
});

let fontsRegistered = false;

export function registerModernFoodPlanFonts(doc) {
  if (fontsRegistered) return;
  doc.registerFont(MODERN_FOOD_PLAN_FONTS.regular, path.join(FONT_DIR, 'Montserrat-Regular.ttf'));
  doc.registerFont(MODERN_FOOD_PLAN_FONTS.bold, path.join(FONT_DIR, 'Montserrat-Bold.ttf'));
  doc.registerFont(MODERN_FOOD_PLAN_FONTS.italic, path.join(FONT_DIR, 'Montserrat-Italic.ttf'));
  doc.registerFont(MODERN_FOOD_PLAN_FONTS.boldItalic, path.join(FONT_DIR, 'Montserrat-BoldItalic.ttf'));
  fontsRegistered = true;
}

function modernContentBox(doc) {
  const { width, height } = doc.page;
  return {
    x: PDF_MARGIN.left,
    y: PDF_MARGIN.top,
    width: width - PDF_MARGIN.left - PDF_MARGIN.right,
    bottom: height - PDF_MARGIN.bottom,
  };
}

function addModernPage(doc) {
  doc.addPage({ size: 'LETTER', layout: 'portrait', margin: 0 });
  drawWatermark(doc);
  return modernContentBox(doc);
}

function titleCaseWords(text) {
  return String(text || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function formatPreparedDateUpper(value) {
  if (!value) return '';
  const isoMatch = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const monthIndex = Number(isoMatch[2]) - 1;
    const day = Number(isoMatch[3]);
    const month = new Date(year, monthIndex, 1).toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
    return `${month} ${day}, ${year}`;
  }
  return String(value).toUpperCase();
}

function drawModernHeader(doc, box, payload) {
  const fonts = MODERN_FOOD_PLAN_FONTS;
  const colors = MODERN_FOOD_PLAN_COLORS;
  const logoY = box.y;
  doc.image(logoPath, box.x, logoY, { width: LAYOUT.logoWidth });

  const name = titleCaseWords(payload.clientName);
  const date = formatPreparedDateUpper(payload.preparedDateLong || payload.preparedDate);
  const personalLine = `PERSONALIZED FOR: ${name.toUpperCase()}  •  ${date}`;
  doc
    .font(fonts.regular)
    .fontSize(7.5)
    .fillColor(colors.muted)
    .text(personalLine, box.x, logoY + 6, {
      width: box.width,
      align: 'right',
      lineGap: 0,
    });

  const titleY = logoY + LAYOUT.logoWidth + 14;
  doc.font(fonts.bold).fontSize(LAYOUT.titleSize).fillColor(colors.body);
  const foodW = doc.widthOfString('FOOD ');
  doc.text('FOOD ', box.x, titleY, { continued: true, lineGap: 0 });
  doc.fillColor(colors.gold).text('PLAN', { continued: false, lineGap: 0 });

  const ruleY = titleY + LAYOUT.titleSize + 6;
  doc
    .strokeColor(colors.gold)
    .lineWidth(LAYOUT.titleRule)
    .moveTo(box.x, ruleY)
    .lineTo(box.x + box.width, ruleY)
    .stroke();

  return ruleY + 12;
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

function drawPersonIcon(doc, cx, cy, { variant = 'lean' } = {}) {
  const r = 9;
  const fill = variant === 'fat' ? MODERN_FOOD_PLAN_COLORS.white : MODERN_FOOD_PLAN_COLORS.body;
  doc.save();
  if (variant === 'fat') {
    doc.circle(cx, cy, r).fill(MODERN_FOOD_PLAN_COLORS.gold);
  } else {
    doc.circle(cx, cy, r).fill('#E8E8E8');
  }
  const headR = variant === 'fat' ? 2.4 : 2.2;
  const bodyW = variant === 'fat' ? 7 : 5;
  doc.fillColor(fill);
  doc.circle(cx, cy - 3.2, headR).fill();
  doc.roundedRect(cx - bodyW / 2, cy - 0.5, bodyW, 7.5, 1.5).fill();
  doc.restore();
}

function drawScaleIcon(doc, cx, cy) {
  doc.save();
  doc.circle(cx, cy, 9).fill('#E8E8E8');
  doc.fillColor(MODERN_FOOD_PLAN_COLORS.body);
  doc.roundedRect(cx - 6, cy + 1.5, 12, 2.2, 0.8).fill(MODERN_FOOD_PLAN_COLORS.body);
  doc.roundedRect(cx - 0.8, cy - 4, 1.6, 6, 0.4).fill(MODERN_FOOD_PLAN_COLORS.body);
  doc.circle(cx - 4.5, cy - 1.5, 2.2).strokeColor(MODERN_FOOD_PLAN_COLORS.body).lineWidth(0.8).stroke();
  doc.circle(cx + 4.5, cy - 1.5, 2.2).stroke();
  doc.restore();
}

function drawDashboardMetricRow(doc, {
  x, y, width, label, pct, lbs, iconVariant,
}) {
  const fonts = MODERN_FOOD_PLAN_FONTS;
  const colors = MODERN_FOOD_PLAN_COLORS;
  const iconX = x + 14;
  const textX = x + 32;
  if (iconVariant === 'scale') drawScaleIcon(doc, iconX, y + 12);
  else drawPersonIcon(doc, iconX, y + 12, { variant: iconVariant });

  doc
    .font(fonts.bold)
    .fontSize(LAYOUT.dashboardHeadSize)
    .fillColor(colors.body)
    .text(label, textX, y + 2, { width: width - 36, lineBreak: false });

  doc
    .font(fonts.regular)
    .fontSize(LAYOUT.dashboardPctSize)
    .fillColor(colors.muted)
    .text(pct, textX, y + 12, { width: width - 36, lineBreak: false });

  doc
    .font(fonts.bold)
    .fontSize(LAYOUT.dashboardValueSize)
    .fillColor(colors.body)
    .text(lbs, textX, y + 21, { width: width - 36, lineBreak: false });

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

  doc.save();
  doc.opacity(LAYOUT.lossPanelFillOpacity);
  doc
    .roundedRect(centerX + 4, y + pad, centerW - 8, bodyH - pad * 2, 6)
    .fill(colors.goldPale);
  doc.restore();

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
    { label: 'LEAN', todayPct: lean.todayPct, todayLbs: lean.todayLbs, goalPct: lean.goalB, goalLbs: lean.goalC, icon: 'lean' },
    { label: 'FAT', todayPct: fat.todayPct, todayLbs: fat.todayLbs, goalPct: fat.goalB, goalLbs: fat.goalC, icon: 'fat' },
    { label: 'TOTAL', todayPct: total.todayPct, todayLbs: total.todayLbs, goalPct: total.goalB, goalLbs: total.goalC, icon: 'scale' },
  ];

  metrics.forEach((metric) => {
    drawDashboardMetricRow(doc, {
      x: leftX,
      y: rowY,
      width: sideW,
      label: metric.label,
      pct: metric.todayPct,
      lbs: metric.todayLbs,
      iconVariant: metric.icon,
    });
    drawDashboardMetricRow(doc, {
      x: rightX,
      y: rowY,
      width: sideW,
      label: metric.label,
      pct: metric.goalPct,
      lbs: metric.goalLbs,
      iconVariant: metric.icon,
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

/** Three-column footer used on the modern Food Plan page. */
export function drawModernFoodPlanFooter(doc, box, { page, total, contact = PDF_FRAME_CONTACT } = {}) {
  const fonts = MODERN_FOOD_PLAN_FONTS;
  const colors = MODERN_FOOD_PLAN_COLORS;
  const ruleY = box.bottom - 28;
  const textY = box.bottom - 16;
  const website = String(contact?.website || PDF_FRAME_CONTACT.website).toUpperCase();
  const email = String(contact?.email || PDF_FRAME_CONTACT.email).toUpperCase();

  doc
    .strokeColor(colors.rule)
    .lineWidth(0.75)
    .moveTo(box.x, ruleY)
    .lineTo(box.x + box.width, ruleY)
    .stroke();

  if (page != null && total != null) {
    doc.font(fonts.regular).fontSize(7.5).fillColor(colors.muted);
    doc.text('PAGE ', box.x, textY, { continued: true, lineGap: 0 });
    doc.font(fonts.bold).text(`${page} `, { continued: true });
    doc.font(fonts.regular).text(`OF ${total}`, { lineBreak: false });
  }

  doc
    .font(fonts.regular)
    .fontSize(7.5)
    .fillColor(colors.muted)
    .text(website, box.x, textY, { width: box.width, align: 'center', lineGap: 0 });

  doc
    .font(fonts.regular)
    .fontSize(7.5)
    .fillColor(colors.muted)
    .text(email, box.x, textY, { width: box.width, align: 'right', lineGap: 0 });
}

export function drawModernFoodPlanPage(doc, payload) {
  registerModernFoodPlanFonts(doc);
  const box = addModernPage(doc);
  const fp = payload.foodPlan || {};
  let y = drawModernHeader(doc, box, payload);

  y = drawBodyParagraph(doc, box.x, y, box.width, fp.lead);

  if (fp.exerciseParagraph) {
    const mixed = parseExerciseParagraph(fp.exerciseParagraph);
    y = mixed
      ? drawMixedParagraph(doc, box.x, y, box.width, mixed)
      : drawBodyParagraph(doc, box.x, y, box.width, fp.exerciseParagraph);
  }

  if (fp.goalTable) {
    const fatRow = fp.goalTable.rows?.find((row) => row.label === 'FAT');
    const fatLost = fatRow?.goalA?.match(/-([\d.]+)/)?.[1] ?? null;
    y = drawModernGoalDashboard(doc, box.x, y + LAYOUT.sectionGap, box.width, fp.goalTable, fatLost) + LAYOUT.sectionGap;
  }

  if (fp.weeklyLine) y = drawBodyParagraph(doc, box.x, y, box.width, fp.weeklyLine);
  if (fp.macroIntro) y = drawBodyParagraph(doc, box.x, y, box.width, fp.macroIntro);

  if (fp.macroRows?.length) {
    drawModernMacroTable(doc, box.x, y + LAYOUT.sectionGap, box.width, fp.macroRows);
  }
}
