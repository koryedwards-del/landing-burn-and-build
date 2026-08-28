/**
 * Modern Menu Plan page — vertical day timeline with category teaching rows.
 */
import { begin1982Page } from './draw1982Frame.js';
import {
  MODERN_REPORT_COLORS,
  MODERN_REPORT_FONTS,
  registerModernReportFonts,
} from './drawModernReportFrame.js';
import { SAMPLE_DAY_MENU_FRUIT_SNACK_LABEL } from '../../js/sampleDayMenuPrintoutData.js';

const LAYOUT = Object.freeze({
  introSize: 9.5,
  introGap: 10,
  timeColWidth: 56,
  timelineGap: 8,
  timelineWidth: 1.5,
  contentPadLeft: 10,
  timeSize: 10.5,
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

function formatTimeLabel(time) {
  if (!time?.value) return '';
  const period = String(time.period || '').toUpperCase();
  return `${time.value} ${period}`.trim();
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

function drawMenuRow(doc, x, y, width, row) {
  const fonts = MODERN_REPORT_FONTS;
  const colors = MODERN_REPORT_COLORS;
  const category = rowCategoryLabel(row);
  const food = simplifyFoodName(row.food);
  const serving = String(row.servingSize || '');

  doc.font(fonts.bold).fontSize(LAYOUT.rowSize);
  const servingW = serving ? doc.widthOfString(serving) : 0;
  const leftW = width - servingW - (serving ? 8 : 0);

  doc.font(fonts.bold).fontSize(LAYOUT.categorySize).fillColor(colors.body);
  doc.text(`${category} · `, x, y, { continued: true, lineBreak: false });
  doc.font(fonts.regular).fontSize(LAYOUT.rowSize).fillColor(colors.body);
  doc.text(food, { width: leftW, lineBreak: false });

  if (serving) {
    doc
      .font(fonts.bold)
      .fontSize(LAYOUT.rowSize)
      .fillColor(colors.body)
      .text(serving, x + width - servingW, y, { lineBreak: false });
  }

  return y + LAYOUT.rowSize + LAYOUT.rowGap + 2;
}

function drawModernMenuSection(doc, page, y, section, timelineX, contentX, contentWidth) {
  const fonts = MODERN_REPORT_FONTS;
  const colors = MODERN_REPORT_COLORS;
  const sectionTop = y;
  const mainMeal = isMainMeal(section);
  const heading = sectionHeading(section);
  const timeLabel = formatTimeLabel(section.time);

  doc
    .font(fonts.bold)
    .fontSize(LAYOUT.timeSize)
    .fillColor(colors.body)
    .text(timeLabel, page.x, y, {
      width: LAYOUT.timeColWidth,
      align: 'right',
      lineBreak: false,
    });

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
    mealY = drawMenuRow(doc, contentX, mealY, contentWidth, row);
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
