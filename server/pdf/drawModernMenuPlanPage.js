/**
 * Modern Menu Plan page — vertical day timeline with category teaching rows.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { begin1982Page } from './draw1982Frame.js';
import {
  MODERN_REPORT_COLORS,
  MODERN_REPORT_FONTS,
  registerModernReportFonts,
} from './drawModernReportFrame.js';
import { SAMPLE_DAY_MENU_FRUIT_SNACK_LABEL } from '../../js/sampleDayMenuPrintoutData.js';

const HANDWRITING_FONT = 'Caveat';
const HANDWRITING_FONT_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'fonts/Caveat-Regular.ttf',
);
const HANDWRITING_FONT_SIZE = 16;
const HANDWRITING_INK_COLOR = '#184A94';
const HANDWRITING_BASELINE_NUDGE = 1.5;
const TIME_LINE_WIDTH = 42;

const LAYOUT = Object.freeze({
  introSize: 9.5,
  introGap: 10,
  timeColWidth: 58,
  timelineGap: 8,
  timelineWidth: 1.5,
  contentPadLeft: 10,
  mainMealBarH: 16,
  mainMealBarSize: 8,
  snackTitleSize: 8,
  rowSize: 8.5,
  categorySize: 7.5,
  rowGap: 5,
  sectionGap: 14,
  snackSectionGap: 10,
  calloutPad: 10,
  calloutTitleSize: 9,
  calloutBodySize: 8.5,
  footerReserve: 36,
});

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

function drawPeriodLabel(doc, x, y, label, selected) {
  const fonts = MODERN_REPORT_FONTS;
  const colors = MODERN_REPORT_COLORS;
  doc
    .font(fonts.regular)
    .fontSize(8)
    .fillColor(colors.body)
    .text(label, x, y, { lineBreak: false });

  if (!selected) return;

  const labelW = doc.widthOfString(label);
  const centerX = x + labelW / 2;
  const centerY = y + 4;
  doc
    .strokeColor(HANDWRITING_INK_COLOR)
    .lineWidth(0.85)
    .ellipse(centerX, centerY, labelW / 2 + 3, 5.5, 0)
    .stroke();
}

/** Filled-in time: short gold line, handwriting time, AM/PM stacked below. */
function drawFilledTimeColumn(doc, x, y, time) {
  const colors = MODERN_REPORT_COLORS;
  const lineY = y + 10;
  doc
    .strokeColor(colors.gold)
    .lineWidth(0.75)
    .moveTo(x, lineY)
    .lineTo(x + TIME_LINE_WIDTH, lineY)
    .stroke();

  if (time?.value) {
    drawHandwritingOnLine(doc, time.value, x + 1, lineY, TIME_LINE_WIDTH - 2, { align: 'center' });
  }

  const periodY = lineY + 8;
  drawPeriodLabel(doc, x, periodY, 'AM', time?.period === 'AM');
  drawPeriodLabel(doc, x + 22, periodY, 'PM', time?.period === 'PM');

  return periodY + 12;
}

function sectionHeading(section) {
  if (section.title) return String(section.title).toUpperCase();
  const snackRow = section.rows?.find((row) => row.label === SAMPLE_DAY_MENU_FRUIT_SNACK_LABEL);
  if (snackRow) return 'FRUIT SNACK';
  return '';
}

function isMainMeal(section) {
  return Boolean(section.title);
}

function rowCategoryLabel(row) {
  if (row.label === SAMPLE_DAY_MENU_FRUIT_SNACK_LABEL) return 'Fruit';
  return String(row.label || '');
}

function simplifyFoodName(name) {
  return String(name || '')
    .replace(/, white \(cooked\)/i, '')
    .replace(/ \(cooked\)/i, '')
    .replace(/ \(dry\)/i, '')
    .replace(/ \(whole, fresh\)/i, '');
}

function drawMenuRow(doc, page, contentX, y, contentWidth, row) {
  const fonts = MODERN_REPORT_FONTS;
  const colors = MODERN_REPORT_COLORS;
  const category = rowCategoryLabel(row);
  const food = simplifyFoodName(row.food);
  const serving = String(row.servingSize || '');
  const lineEndX = page.x + page.width * 0.5;
  const lineY = y + LAYOUT.categorySize + 2;

  doc
    .font(fonts.bold)
    .fontSize(LAYOUT.categorySize)
    .fillColor(colors.body)
    .text(category, contentX, y, { lineBreak: false });

  doc
    .strokeColor(colors.gold)
    .lineWidth(0.75)
    .moveTo(contentX, lineY)
    .lineTo(lineEndX, lineY)
    .stroke();

  const foodTop = lineY - LAYOUT.rowSize + 1;
  doc
    .font(fonts.regular)
    .fontSize(LAYOUT.rowSize)
    .fillColor(colors.body)
    .text(food, contentX + 2, foodTop, {
      width: lineEndX - contentX - 6,
      lineBreak: false,
    });

  if (serving) {
    doc.font(fonts.bold).fontSize(LAYOUT.rowSize);
    const servingW = doc.widthOfString(serving);
    doc
      .fillColor(colors.body)
      .text(serving, contentX + contentWidth - servingW, foodTop, { lineBreak: false });
  }

  return lineY + LAYOUT.rowGap + 4;
}

function drawModernMenuSection(doc, page, y, section, timelineX, contentX, contentWidth) {
  const fonts = MODERN_REPORT_FONTS;
  const colors = MODERN_REPORT_COLORS;
  const sectionTop = y;
  const mainMeal = isMainMeal(section);
  const heading = sectionHeading(section);

  drawFilledTimeColumn(doc, page.x, y, section.time);

  let mealY = y;
  if (mainMeal) {
    doc
      .roundedRect(contentX, mealY, contentWidth, LAYOUT.mainMealBarH, 3)
      .fill(colors.body);
    doc
      .font(fonts.bold)
      .fontSize(LAYOUT.mainMealBarSize)
      .fillColor(colors.white)
      .text(heading, contentX + 8, mealY + 4, {
        width: contentWidth - 16,
        lineBreak: false,
      });
    mealY += LAYOUT.mainMealBarH + 6;
  } else if (heading) {
    doc
      .font(fonts.bold)
      .fontSize(LAYOUT.snackTitleSize)
      .fillColor(colors.muted)
      .text(heading, contentX, mealY, { width: contentWidth, lineBreak: false });
    mealY += LAYOUT.snackTitleSize + 6;
  }

  (section.rows || []).forEach((row) => {
    if (!row.food) return;
    mealY = drawMenuRow(doc, page, contentX, mealY, contentWidth, row);
  });

  const sectionBottom = mealY + (mainMeal ? LAYOUT.sectionGap : LAYOUT.snackSectionGap);
  doc
    .strokeColor(colors.gold)
    .lineWidth(LAYOUT.timelineWidth)
    .moveTo(timelineX, sectionTop + 4)
    .lineTo(timelineX, sectionBottom - 4)
    .stroke();

  return sectionBottom;
}

function drawCalloutBox(doc, x, y, width, note) {
  const fonts = MODERN_REPORT_FONTS;
  const colors = MODERN_REPORT_COLORS;
  const pad = LAYOUT.calloutPad;
  const innerW = width - pad * 2;

  doc.font(fonts.bold).fontSize(LAYOUT.calloutTitleSize);
  const titleH = doc.heightOfString(note.calloutTitle || '', { width: innerW });
  doc.font(fonts.regular).fontSize(LAYOUT.calloutBodySize);
  const bodyH = doc.heightOfString(
    `${note.lead || ''} ${note.linkLabel || ''}`,
    { width: innerW, lineGap: 2 },
  );
  const boxH = pad * 2 + titleH + 4 + bodyH;

  doc
    .strokeColor(colors.gold)
    .lineWidth(1)
    .roundedRect(x, y, width, boxH, 4)
    .stroke();

  doc
    .font(fonts.bold)
    .fontSize(LAYOUT.calloutTitleSize)
    .fillColor(colors.body)
    .text(String(note.calloutTitle || ''), x + pad, y + pad, { width: innerW, lineGap: 0 });

  const bodyY = y + pad + titleH + 4;
  doc
    .font(fonts.regular)
    .fontSize(LAYOUT.calloutBodySize)
    .fillColor(colors.body)
    .text(String(note.lead || ''), x + pad, bodyY, {
      width: innerW,
      lineGap: 2,
      continued: true,
    });
  doc
    .font(fonts.bold)
    .fillColor(colors.body)
    .text(` ${String(note.linkLabel || note.url || '')}`, {
      link: note.url,
      underline: true,
      continued: false,
    });

  return y + boxH;
}

export function drawModernMenuPlanPage(doc, payload) {
  const menu = payload.sampleDayMenu;
  if (!menu?.sections?.length) return;

  registerModernReportFonts(doc);
  registerHandwritingFont(doc);
  const page = begin1982Page(doc, payload, 'Menu Plan', {
    personalized: !payload.worksheet,
  });

  const fonts = MODERN_REPORT_FONTS;
  const colors = MODERN_REPORT_COLORS;
  const maxY = page.bottom - LAYOUT.footerReserve;
  const calloutH = menu.worksheetNote ? 58 : 0;
  const timelineX = page.x + LAYOUT.timeColWidth + LAYOUT.timelineGap;
  const contentX = timelineX + LAYOUT.contentPadLeft;
  const contentWidth = page.width - (contentX - page.x);

  let y = page.y;
  if (menu.intro) {
    doc
      .font(fonts.regular)
      .fontSize(LAYOUT.introSize)
      .fillColor(colors.body)
      .text(String(menu.intro), page.x, y, {
        width: page.width,
        lineGap: 2,
      });
    y = doc.y + LAYOUT.introGap;
  }

  const contentBottom = maxY - calloutH;
  menu.sections.forEach((section) => {
    if (y >= contentBottom) return;
    y = drawModernMenuSection(doc, page, y, section, timelineX, contentX, contentWidth);
  });

  if (menu.worksheetNote) {
    drawCalloutBox(doc, page.x, maxY - calloutH + 4, page.width, menu.worksheetNote);
  }
}
