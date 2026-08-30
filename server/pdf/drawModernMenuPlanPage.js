/**
 * Modern Menu Plan page — vertical day timeline with category teaching rows.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { begin1982Page } from './draw1982Frame.js';
import {
  MODERN_REPORT_COLORS,
  MODERN_REPORT_FONTS,
  MODERN_REPORT_FOOTER_LAYOUT,
  centeredBandTextY,
  modernFooterRuleY,
  registerModernReportFonts,
} from './drawModernReportFrame.js';
import { SAMPLE_DAY_MENU_FRUIT_SNACK_LABEL } from '../../js/sampleDayMenuPrintoutData.js';

const HANDWRITING_FONT = 'Caveat';
const HANDWRITING_FONT_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'fonts/Caveat-Regular.ttf',
);
const HANDWRITING_FONT_SIZE = 12;
const HANDWRITING_FONT_SIZE_TIME = 12;
const HANDWRITING_INK_COLOR = '#184A94';
const HANDWRITING_BASELINE_NUDGE = 1.5;
const TIME_LINE_WIDTH = 42;
const SERVING_SIZE_LABEL = 'Serving size';
/** Food write line ends where the serving-size label begins (legacy ~48% row split). */
const SERVING_LABEL_COL_RATIO = 0.48;

const LAYOUT = Object.freeze({
  introSize: 9.5,
  introGap: 6,
  timeColWidth: 58,
  timelineGap: 8,
  timelineWidth: 1.5,
  contentPadLeft: 10,
  mainMealBarH: 14,
  mainMealBarSize: 8,
  rowSize: 8.5,
  categorySize: 7.5,
  rowTail: 2,
  minPostBarGap: 2,
  minCategoryPadAfterBar: 4,
  minCategoryRowGap: 3,
  minMealSectionGap: 4,
  lastMealSectionGap: 2,
  timeColumnHeight: 28,
  calloutPad: 10,
  calloutTitleSize: 9,
  calloutBodySize: 8.5,
  calloutGapAboveFooter: MODERN_REPORT_FOOTER_LAYOUT.contentGapAboveRule,
});

function registerHandwritingFont(doc) {
  doc.registerFont(HANDWRITING_FONT, HANDWRITING_FONT_PATH);
}

function handwritingTopForLine(doc, lineY, fontSize = HANDWRITING_FONT_SIZE) {
  doc.font(HANDWRITING_FONT).fontSize(fontSize);
  const ascent = doc.heightOfString('Ag', { lineGap: 0 });
  return lineY - ascent + HANDWRITING_BASELINE_NUDGE;
}

function drawHandwritingOnLine(doc, text, x, lineY, width, {
  align = 'left',
  fontSize = HANDWRITING_FONT_SIZE,
} = {}) {
  if (!text) return;
  const textY = handwritingTopForLine(doc, lineY, fontSize);
  doc
    .font(HANDWRITING_FONT)
    .fontSize(fontSize)
    .fillColor(HANDWRITING_INK_COLOR)
    .text(String(text), x, textY, { width, align, lineBreak: false });
}

function measureHandwritingBandHeight(doc, text, width, fontSize = HANDWRITING_FONT_SIZE) {
  if (!text) return 0;
  doc.font(HANDWRITING_FONT).fontSize(fontSize);
  return doc.heightOfString(String(text), { width, lineGap: 1 });
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
    drawHandwritingOnLine(
      doc,
      time.value,
      x + 1,
      lineY,
      TIME_LINE_WIDTH - 2,
      { align: 'center', fontSize: HANDWRITING_FONT_SIZE_TIME },
    );
  }

  const periodY = lineY + 8;
  drawPeriodLabel(doc, x, periodY, 'AM', time?.period === 'AM');
  drawPeriodLabel(doc, x + 22, periodY, 'PM', time?.period === 'PM');

  return periodY + 12;
}

function sectionHeading(section) {
  if (section.title) return String(section.title).toUpperCase();
  const snackRow = section.rows?.find((row) => row.label === SAMPLE_DAY_MENU_FRUIT_SNACK_LABEL);
  if (snackRow) return 'FRUIT';
  return '';
}

function drawMealBar(doc, contentX, y, contentWidth, heading) {
  const fonts = MODERN_REPORT_FONTS;
  const colors = MODERN_REPORT_COLORS;
  const barH = LAYOUT.mainMealBarH;
  doc
    .roundedRect(contentX, y, contentWidth, barH, 3)
    .fill(colors.body);
  const label = String(heading || '');
  const textY = centeredBandTextY(doc, y, barH, {
    font: fonts.bold,
    fontSize: LAYOUT.mainMealBarSize,
    text: label,
  });
  doc
    .font(fonts.bold)
    .fontSize(LAYOUT.mainMealBarSize)
    .fillColor(colors.white)
    .text(label, contentX + 8, textY, {
      width: contentWidth - 16,
      lineBreak: false,
    });
  return y + barH;
}

function measureMenuRowHeight(doc, contentX, contentWidth, row, filled, categoryRowGap) {
  const lineY = LAYOUT.rowSize + 2;
  let bottom = lineY + LAYOUT.rowTail;
  if (!filled || !doc) return bottom + categoryRowGap;

  const category = rowCategoryLabel(row);
  const layout = menuRowLayout(doc, contentX, contentWidth, category);
  const foodTextW = layout.foodLineEnd - layout.foodLineStart - 4;
  const servingWidth = contentX + contentWidth - layout.servingLineStart;

  let inkBottom = lineY;
  if (row.food) {
    const foodTop = handwritingTopForLine(doc, lineY);
    const foodH = measureHandwritingBandHeight(doc, row.food, foodTextW);
    inkBottom = Math.max(inkBottom, foodTop + foodH);
  }
  if (row.servingSize) {
    const servingTop = handwritingTopForLine(doc, lineY);
    const servingH = measureHandwritingBandHeight(doc, row.servingSize, servingWidth - 4);
    inkBottom = Math.max(inkBottom, servingTop + servingH);
  }
  return inkBottom + categoryRowGap;
}

function menuRowStride(categoryRowGap, rowHeight) {
  return Math.max(LAYOUT.rowSize + 2 + categoryRowGap + LAYOUT.rowTail, rowHeight);
}

function measureSectionBlockHeight(doc, section, spacing, filled, contentX, contentWidth) {
  const heading = sectionHeading(section);
  const rows = section.rows || [];
  let mealH = 0;
  if (heading) {
    mealH = LAYOUT.mainMealBarH + spacing.postBarGap + spacing.categoryPadAfterBar;
  }
  if (rows.length > 0) {
    mealH += rows.reduce((total, row) => (
      total + menuRowStride(
        spacing.categoryRowGap,
        measureMenuRowHeight(doc, contentX, contentWidth, row, filled, spacing.categoryRowGap),
      )
    ), 0);
  }
  return Math.max(LAYOUT.timeColumnHeight, mealH);
}

function measureMenuPlanHeight(sections, spacing, measureOpts = {}) {
  const { doc, filled = false, contentX = 0, contentWidth = 1 } = measureOpts;
  return sections.reduce((total, section, index) => {
    const sectionH = measureSectionBlockHeight(
      doc,
      section,
      spacing,
      filled,
      contentX,
      contentWidth,
    );
    const gap = index < sections.length - 1
      ? spacing.mealSectionGap
      : spacing.lastMealSectionGap;
    return total + sectionH + gap;
  }, 0);
}

function clampSpacing(value, floor) {
  return Math.max(floor, value);
}

/** Distribute vertical space: grouped categories within each meal; shrink to fit callout. */
export function computeMenuPlanSpacing(sections, contentTop, contentBottom, measureOpts = {}) {
  const absoluteMin = {
    postBarGap: LAYOUT.minPostBarGap,
    categoryPadAfterBar: LAYOUT.minCategoryPadAfterBar,
    categoryRowGap: LAYOUT.minCategoryRowGap,
    mealSectionGap: LAYOUT.minMealSectionGap,
    lastMealSectionGap: LAYOUT.lastMealSectionGap,
  };
  if (!sections?.length) return { ...absoluteMin };

  const available = Math.max(0, contentBottom - contentTop);
  let spacing = { ...absoluteMin };
  let height = measureMenuPlanHeight(sections, spacing, measureOpts);

  if (height < available) {
    let extra = available - height;
    const rowCount = sections.reduce((sum, section) => sum + (section.rows?.length || 0), 0);
    const interSectionCount = Math.max(1, sections.length - 1);

    const mealShare = extra * 0.55;
    spacing.mealSectionGap += mealShare / interSectionCount;
    extra -= mealShare;

    const categoryPadShare = extra * 0.65;
    spacing.categoryPadAfterBar += categoryPadShare / sections.length;
    extra -= categoryPadShare;

    if (rowCount > 0) {
      spacing.categoryRowGap += extra / rowCount;
    } else {
      spacing.mealSectionGap += extra / interSectionCount;
    }

    height = measureMenuPlanHeight(sections, spacing, measureOpts);
    const remainder = available - height;
    if (remainder > 0.5) {
      spacing.mealSectionGap += remainder / interSectionCount;
    }
  }

  for (let pass = 0; pass < 24 && height > available + 0.5; pass += 1) {
    const overflow = height - available;
    const rowCount = sections.reduce((sum, section) => sum + (section.rows?.length || 0), 0);
    const interSectionCount = Math.max(1, sections.length - 1);

    const reducible = {
      mealSectionGap: Math.max(0, spacing.mealSectionGap - absoluteMin.mealSectionGap) * interSectionCount,
      categoryPadAfterBar: Math.max(0, spacing.categoryPadAfterBar - absoluteMin.categoryPadAfterBar) * sections.length,
      categoryRowGap: Math.max(0, spacing.categoryRowGap - absoluteMin.categoryRowGap) * rowCount,
      postBarGap: Math.max(0, spacing.postBarGap - absoluteMin.postBarGap) * sections.length,
      lastMealSectionGap: Math.max(0, spacing.lastMealSectionGap - absoluteMin.lastMealSectionGap),
    };
    const totalReducible = Object.values(reducible).reduce((sum, value) => sum + value, 0);
    if (totalReducible <= 0) break;

    const take = Math.min(overflow, totalReducible);
    spacing.mealSectionGap -= take * (reducible.mealSectionGap / totalReducible) / interSectionCount;
    spacing.categoryPadAfterBar -= take * (reducible.categoryPadAfterBar / totalReducible) / sections.length;
    if (rowCount > 0) {
      spacing.categoryRowGap -= take * (reducible.categoryRowGap / totalReducible) / rowCount;
    }
    spacing.postBarGap -= take * (reducible.postBarGap / totalReducible) / sections.length;
    spacing.lastMealSectionGap -= take * (reducible.lastMealSectionGap / totalReducible);

    spacing = {
      postBarGap: clampSpacing(spacing.postBarGap, absoluteMin.postBarGap),
      categoryPadAfterBar: clampSpacing(spacing.categoryPadAfterBar, absoluteMin.categoryPadAfterBar),
      categoryRowGap: clampSpacing(spacing.categoryRowGap, absoluteMin.categoryRowGap),
      mealSectionGap: clampSpacing(spacing.mealSectionGap, absoluteMin.mealSectionGap),
      lastMealSectionGap: clampSpacing(spacing.lastMealSectionGap, absoluteMin.lastMealSectionGap),
    };
    height = measureMenuPlanHeight(sections, spacing, measureOpts);
  }

  return spacing;
}

function rowCategoryLabel(row) {
  if (row.label === SAMPLE_DAY_MENU_FRUIT_SNACK_LABEL) return 'Fruit';
  return String(row.label || '');
}

function menuRowLayout(doc, contentX, contentWidth, category) {
  const fonts = MODERN_REPORT_FONTS;
  const lineGap = 5;
  doc.font(fonts.bold).fontSize(LAYOUT.categorySize);
  const categoryW = doc.widthOfString(category);
  doc.font(fonts.regular).fontSize(LAYOUT.rowSize);
  const sizeLabelW = doc.widthOfString(SERVING_SIZE_LABEL);

  const sizeLabelX = contentX + contentWidth * SERVING_LABEL_COL_RATIO;
  const foodLineStart = contentX + categoryW + lineGap;
  const foodLineEnd = sizeLabelX - lineGap;
  const servingLineStart = sizeLabelX + sizeLabelW + lineGap;

  return {
    lineGap,
    sizeLabelX,
    sizeLabelW,
    foodLineStart,
    foodLineEnd,
    servingLineStart,
  };
}

function drawMenuRow(doc, page, contentX, y, contentWidth, row, categoryRowGap, filled) {
  const fonts = MODERN_REPORT_FONTS;
  const colors = MODERN_REPORT_COLORS;
  const category = rowCategoryLabel(row);
  const marginRight = page.x + page.width;
  const layout = menuRowLayout(doc, contentX, contentWidth, category);
  const lineY = y + LAYOUT.rowSize + 2;

  doc
    .font(fonts.bold)
    .fontSize(LAYOUT.categorySize)
    .fillColor(colors.body)
    .text(category, contentX, y, { lineBreak: false });

  doc
    .font(fonts.regular)
    .fontSize(LAYOUT.rowSize)
    .fillColor(colors.body)
    .text(SERVING_SIZE_LABEL, layout.sizeLabelX, y, { lineBreak: false });

  doc
    .strokeColor(colors.gold)
    .lineWidth(0.75)
    .moveTo(layout.foodLineStart, lineY)
    .lineTo(layout.foodLineEnd, lineY)
    .stroke();

  doc
    .strokeColor(colors.gold)
    .lineWidth(0.75)
    .moveTo(layout.servingLineStart, lineY)
    .lineTo(marginRight, lineY)
    .stroke();

  if (filled) {
    if (row.food) {
      drawHandwritingOnLine(
        doc,
        row.food,
        layout.foodLineStart + 2,
        lineY,
        layout.foodLineEnd - layout.foodLineStart - 4,
      );
    }
    if (row.servingSize) {
      const servingTop = handwritingTopForLine(doc, lineY);
      doc
        .font(HANDWRITING_FONT)
        .fontSize(HANDWRITING_FONT_SIZE)
        .fillColor(HANDWRITING_INK_COLOR)
        .text(String(row.servingSize), layout.servingLineStart + 2, servingTop, {
          width: marginRight - layout.servingLineStart - 4,
          lineGap: 1,
        });
    }
  }

  const rowH = measureMenuRowHeight(doc, contentX, contentWidth, row, filled, categoryRowGap);
  return y + rowH;
}

function drawModernMenuSection(doc, page, y, section, timelineX, contentX, contentWidth, spacing, filled, isLastSection) {
  const colors = MODERN_REPORT_COLORS;
  const sectionTop = y;
  const heading = sectionHeading(section);

  drawFilledTimeColumn(doc, page.x, y, section.time);

  let mealY = y;
  if (heading) {
    mealY = drawMealBar(doc, contentX, mealY, contentWidth, heading)
      + spacing.postBarGap
      + spacing.categoryPadAfterBar;
  }

  (section.rows || []).forEach((row) => {
    mealY = drawMenuRow(
      doc,
      page,
      contentX,
      mealY,
      contentWidth,
      row,
      spacing.categoryRowGap,
      filled,
    );
  });

  const sectionGap = isLastSection ? spacing.lastMealSectionGap : spacing.mealSectionGap;
  const sectionBottom = mealY + sectionGap;
  doc
    .strokeColor(colors.gold)
    .lineWidth(LAYOUT.timelineWidth)
    .moveTo(timelineX, sectionTop + 4)
    .lineTo(timelineX, sectionBottom - 4)
    .stroke();

  return sectionBottom;
}

function measureCalloutBoxHeight(doc, width, note) {
  const fonts = MODERN_REPORT_FONTS;
  const pad = LAYOUT.calloutPad;
  const innerW = width - pad * 2;

  doc.font(fonts.bold).fontSize(LAYOUT.calloutTitleSize);
  const titleH = doc.heightOfString(note.calloutTitle || '', { width: innerW });
  doc.font(fonts.regular).fontSize(LAYOUT.calloutBodySize);
  const bodyH = doc.heightOfString(
    `${note.lead || ''} ${note.linkLabel || ''}`,
    { width: innerW, lineGap: 2 },
  );
  return pad * 2 + titleH + 4 + bodyH;
}

function drawCalloutBox(doc, x, y, width, note) {
  const fonts = MODERN_REPORT_FONTS;
  const colors = MODERN_REPORT_COLORS;
  const pad = LAYOUT.calloutPad;
  const innerW = width - pad * 2;
  const boxH = measureCalloutBoxHeight(doc, width, note);

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

  doc.font(fonts.bold).fontSize(LAYOUT.calloutTitleSize);
  const titleH = doc.heightOfString(note.calloutTitle || '', { width: innerW });
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

/** Bottom edge of the Menu Plan timeline/content band (top of callout when present). */
export function menuPlanContentBottomY(page, menu, doc) {
  const footerRuleY = modernFooterRuleY(page.box);
  if (!menu?.worksheetNote) {
    return footerRuleY - LAYOUT.calloutGapAboveFooter;
  }
  const calloutH = measureCalloutBoxHeight(doc, page.width, menu.worksheetNote);
  return footerRuleY - LAYOUT.calloutGapAboveFooter - calloutH;
}

export function menuPlanCalloutY(page, menu, doc) {
  if (!menu?.worksheetNote) return null;
  const calloutH = measureCalloutBoxHeight(doc, page.width, menu.worksheetNote);
  const footerRuleY = modernFooterRuleY(page.box);
  return footerRuleY - LAYOUT.calloutGapAboveFooter - calloutH;
}

export function drawModernMenuPlanPage(doc, payload) {
  const menu = payload.sampleDayMenu;
  if (!menu?.sections?.length) return;

  const filled = Boolean(menu.filled);
  registerModernReportFonts(doc);
  if (filled) registerHandwritingFont(doc);
  const page = begin1982Page(doc, payload, 'Menu Plan', {
    personalized: !payload.worksheet,
  });

  const fonts = MODERN_REPORT_FONTS;
  const colors = MODERN_REPORT_COLORS;
  const contentBottom = menuPlanContentBottomY(page, menu, doc);
  const calloutY = menuPlanCalloutY(page, menu, doc);
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

  const spacing = computeMenuPlanSpacing(menu.sections, y, contentBottom, {
    doc,
    filled,
    contentX,
    contentWidth,
  });

  menu.sections.forEach((section, index) => {
    y = drawModernMenuSection(
      doc,
      page,
      y,
      section,
      timelineX,
      contentX,
      contentWidth,
      spacing,
      filled,
      index === menu.sections.length - 1,
    );
  });

  if (calloutY != null) {
    drawCalloutBox(doc, page.x, calloutY, page.width, menu.worksheetNote);
  }
}
