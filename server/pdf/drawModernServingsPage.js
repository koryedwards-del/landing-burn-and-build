/**
 * Modern Servings page — daily table + getting started guidance.
 */
import { begin1982Page, TABLE_1982 } from './draw1982Frame.js';
import {
  MODERN_REPORT_COLORS,
  MODERN_REPORT_FONTS,
  modernFooterRuleY,
  registerModernReportFonts,
} from './drawModernReportFrame.js';

const FONTS = MODERN_REPORT_FONTS;
const COLORS = MODERN_REPORT_COLORS;

const SERVINGS_ANYTIME_NOTE = 'can be eaten any time of day.';
const MEAL_COL_SPAN = Object.freeze({ from: 'breakfast', to: 'snack3' });

const TABLE_COLUMNS = Object.freeze([
  { key: 'label', width: 0.18 },
  { key: 'daily', width: 0.1, hero: true },
  { key: 'breakfast', width: 0.12 },
  { key: 'snack1', width: 0.1 },
  { key: 'lunch', width: 0.1 },
  { key: 'snack2', width: 0.1 },
  { key: 'dinner', width: 0.12 },
  { key: 'snack3', width: 0.1 },
]);

const LAYOUT = Object.freeze({
  taglineSize: 9.5,
  taglineGap: 10,
  tableTopGap: 12,
  tableRowPad: 7,
  cellPad: 6,
  labelSize: 9.5,
  dailySize: 12,
  mealSize: 9,
  headerMealSize: 8,
  headerDailySize: 9,
  sectionHeadingGap: 8,
  gettingStartedHeadingSize: 10.5,
  gettingStartedRuleGap: 3,
  gettingStartedRuleWidth: 1.25,
  gettingStartedHeadingGap: 10,
  tipsHeadingSize: 9,
  tipsHeadingColor: '#444444',
  sectionGap: 16,
  bulletSize: 9.5,
  bulletGap: 5,
  bulletIndent: 12,
  tipsHeadingGap: 10,
  tipsTitleSize: 9,
  tipsBodySize: 9,
  tipsItemGap: 8,
  noteSize: 8,
  noteGapAboveFooter: 10,
});

function columnWidths(columns, tableWidth) {
  return columns.map((col) => col.width * tableWidth);
}

function spanBounds(columns, span) {
  const fromIndex = columns.findIndex((col) => col.key === span.from);
  const toIndex = columns.findIndex((col) => col.key === span.to);
  if (fromIndex < 0 || toIndex < fromIndex) return null;
  return { fromIndex, toIndex };
}

function isSpannedColumn(columns, row, colIndex) {
  const spans = row._colSpan ? [row._colSpan] : [];
  for (const span of spans) {
    const bounds = spanBounds(columns, span);
    if (!bounds) continue;
    if (colIndex > bounds.fromIndex && colIndex <= bounds.toIndex) return true;
  }
  return false;
}

function spanWidth(colWidths, bounds) {
  return colWidths.slice(bounds.fromIndex, bounds.toIndex + 1).reduce((sum, w) => sum + w, 0);
}

function buildServingsRows(gridRows) {
  const header = {
    label: '',
    daily: 'Daily',
    breakfast: 'Breakfast',
    snack1: 'Fruit',
    lunch: 'Lunch',
    snack2: 'Fruit',
    dinner: 'Dinner',
    snack3: 'Fruit',
    _isHeader: true,
  };
  const bodyRows = (gridRows || []).map((row) => (
    row.label === 'Veggies'
      ? {
        ...row,
        breakfast: SERVINGS_ANYTIME_NOTE,
        snack1: '',
        lunch: '',
        snack2: '',
        dinner: '',
        snack3: '',
        _colSpan: MEAL_COL_SPAN,
        _spanAlign: 'left',
      }
      : row
  ));
  return [header, ...bodyRows];
}

function cellStyle(row, col, { isHeader = false } = {}) {
  if (isHeader) {
    if (col.hero) {
      return { font: FONTS.bold, fontSize: LAYOUT.headerDailySize, color: COLORS.body, fill: COLORS.goldPale };
    }
    if (col.key === 'label') {
      return { font: FONTS.regular, fontSize: LAYOUT.headerMealSize, color: COLORS.muted };
    }
    return { font: FONTS.regular, fontSize: LAYOUT.headerMealSize, color: COLORS.muted };
  }

  if (col.hero) {
    return { font: FONTS.bold, fontSize: LAYOUT.dailySize, color: COLORS.body, fill: COLORS.goldPale };
  }
  if (col.key === 'label') {
    return { font: FONTS.regular, fontSize: LAYOUT.labelSize, color: COLORS.body };
  }
  return { font: FONTS.regular, fontSize: LAYOUT.mealSize, color: COLORS.muted };
}

function measureServingsTable(doc, rows, tableWidth) {
  const colWidths = columnWidths(TABLE_COLUMNS, tableWidth);
  return rows.map((row) => {
    const isHeader = Boolean(row._isHeader);
    let maxH = LAYOUT.tableRowPad * 2;
    TABLE_COLUMNS.forEach((col, index) => {
      if (isSpannedColumn(TABLE_COLUMNS, row, index)) return;
      const style = cellStyle(row, col, { isHeader });
      doc.font(style.font).fontSize(style.fontSize);
      let innerW = colWidths[index] - LAYOUT.cellPad * 2;
      if (row._colSpan) {
        const bounds = spanBounds(TABLE_COLUMNS, row._colSpan);
        if (bounds && index === bounds.fromIndex) {
          innerW = spanWidth(colWidths, bounds) - LAYOUT.cellPad * 2;
        }
      }
      const text = String(row[col.key] ?? '');
      maxH = Math.max(
        maxH,
        doc.heightOfString(text, { width: innerW, lineGap: 0 }) + LAYOUT.tableRowPad * 2,
      );
    });
    return maxH;
  });
}

function drawServingsTable(doc, { x, y, width, rows }) {
  const colWidths = columnWidths(TABLE_COLUMNS, width);
  const rowHeights = measureServingsTable(doc, rows, width);
  const totalH = rowHeights.reduce((sum, height) => sum + height, 0);

  doc
    .strokeColor(TABLE_1982.stroke)
    .lineWidth(1.25)
    .roundedRect(x, y, width, totalH, TABLE_1982.radius)
    .stroke();

  let cy = y;
  rows.forEach((row, rowIndex) => {
    const rowH = rowHeights[rowIndex];
    const isHeader = Boolean(row._isHeader);
    let cx = x;

    TABLE_COLUMNS.forEach((col, index) => {
      if (isSpannedColumn(TABLE_COLUMNS, row, index)) return;

      const style = cellStyle(row, col, { isHeader });
      let cellW = colWidths[index];
      let text = String(row[col.key] ?? '');
      let align = col.key === 'label' ? 'left' : 'center';

      if (row._colSpan) {
        const bounds = spanBounds(TABLE_COLUMNS, row._colSpan);
        if (bounds && index === bounds.fromIndex) {
          cellW = spanWidth(colWidths, bounds);
          align = row._spanAlign === 'left' ? 'left' : 'center';
        }
      }

      if (style.fill) {
        doc.save();
        doc.rect(cx, cy, cellW, rowH).fill(style.fill);
        doc.restore();
      }

      doc.font(style.font).fontSize(style.fontSize).fillColor(style.color);
      const textW = cellW - LAYOUT.cellPad * 2;
      let textX = cx + LAYOUT.cellPad;
      if (align === 'center') {
        const renderedW = doc.widthOfString(text);
        if (renderedW < textW) textX = cx + (cellW - renderedW) / 2;
      }
      doc.text(text, textX, cy + LAYOUT.tableRowPad, {
        width: textW,
        align: align === 'center' ? 'center' : 'left',
        lineGap: 0,
      });
      cx += cellW;
    });

    cy += rowH;
    if (rowIndex < rows.length - 1) {
      doc
        .strokeColor(TABLE_1982.stroke)
        .lineWidth(0.75)
        .moveTo(x, cy)
        .lineTo(x + width, cy)
        .stroke();
    }
  });

  return y + totalH;
}

function drawGettingStartedHeading(doc, x, y, width, text) {
  const label = String(text || '');
  doc
    .font(FONTS.bold)
    .fontSize(LAYOUT.gettingStartedHeadingSize)
    .fillColor(COLORS.body)
    .text(label, x, y, { width, lineBreak: false });

  const textW = doc.widthOfString(label);
  const ruleY = y + LAYOUT.gettingStartedHeadingSize + LAYOUT.gettingStartedRuleGap;
  doc
    .strokeColor(COLORS.gold)
    .lineWidth(LAYOUT.gettingStartedRuleWidth)
    .moveTo(x, ruleY)
    .lineTo(x + textW, ruleY)
    .stroke();

  return ruleY + LAYOUT.gettingStartedHeadingGap;
}

function drawQuietSectionHeading(doc, x, y, width, text) {
  doc
    .font(FONTS.bold)
    .fontSize(LAYOUT.tipsHeadingSize)
    .fillColor(LAYOUT.tipsHeadingColor)
    .text(String(text || ''), x, y, { width, lineBreak: false });
  return y + LAYOUT.tipsHeadingSize + LAYOUT.sectionHeadingGap;
}

function drawBulletList(doc, x, y, width, items) {
  let cursorY = y;
  const bullet = '•';
  doc.font(FONTS.regular).fontSize(LAYOUT.bulletSize).fillColor(COLORS.body);

  (items || []).forEach((item) => {
    const text = String(item || '');
    if (!text) return;
    const textX = x + LAYOUT.bulletIndent;
    const textW = width - LAYOUT.bulletIndent;
    doc.text(bullet, x, cursorY, { lineBreak: false });
    doc.text(text, textX, cursorY, { width: textW, lineGap: 1 });
    cursorY = doc.y + LAYOUT.bulletGap;
  });

  return cursorY;
}

function drawHelpfulTips(doc, x, y, width, helpfulTips) {
  if (!helpfulTips?.items?.length) return y;

  let cursorY = y;
  if (helpfulTips.heading) {
    cursorY = drawQuietSectionHeading(doc, x, cursorY, width, helpfulTips.heading);
    cursorY += LAYOUT.tipsHeadingGap - LAYOUT.sectionHeadingGap;
  }

  helpfulTips.items.forEach((item, index) => {
    if (!item?.title || !item?.body) return;
    doc.font(FONTS.bold).fontSize(LAYOUT.tipsTitleSize).fillColor(COLORS.body);
    doc.text(String(item.title), x, cursorY, { width, lineGap: 0 });
    cursorY = doc.y + 2;
    doc.font(FONTS.regular).fontSize(LAYOUT.tipsBodySize).fillColor(COLORS.body);
    doc.text(String(item.body), x, cursorY, { width, lineGap: 1 });
    cursorY = doc.y + (index < helpfulTips.items.length - 1 ? LAYOUT.tipsItemGap : 0);
  });

  return cursorY;
}

function drawPhysicianNote(doc, page, note) {
  if (!note) return;
  const ruleY = modernFooterRuleY(page.box);
  const noteY = ruleY - LAYOUT.noteGapAboveFooter - LAYOUT.noteSize;
  doc
    .font(FONTS.regular)
    .fontSize(LAYOUT.noteSize)
    .fillColor(COLORS.muted)
    .text(String(note), page.x, noteY, {
      width: page.width,
      align: 'left',
      lineGap: 0,
    });
}

export function drawModernServingsPage(doc, payload) {
  const servings = payload.servings;
  if (!servings?.gridRows?.length) return;

  registerModernReportFonts(doc);
  const page = begin1982Page(doc, payload, 'Servings');
  let y = page.y;

  if (servings.tagline) {
    doc
      .font(FONTS.regular)
      .fontSize(LAYOUT.taglineSize)
      .fillColor(COLORS.body)
      .text(String(servings.tagline), page.x, y, { width: page.width, lineGap: 1 });
    y = doc.y + LAYOUT.taglineGap;
  }

  y += LAYOUT.tableTopGap;
  y = drawServingsTable(doc, {
    x: page.x,
    y,
    width: page.width,
    rows: buildServingsRows(servings.gridRows),
  });

  if (servings.gettingStarted?.rules?.length) {
    y += LAYOUT.sectionGap;
    if (servings.gettingStarted.heading) {
      y = drawGettingStartedHeading(doc, page.x, y, page.width, servings.gettingStarted.heading);
    }
    y = drawBulletList(doc, page.x, y, page.width, servings.gettingStarted.rules);
  }

  if (servings.helpfulTips?.items?.length) {
    y += LAYOUT.sectionGap;
    y = drawHelpfulTips(doc, page.x, y, page.width, servings.helpfulTips);
  }

  drawPhysicianNote(doc, page, servings.note);
}
