/**
 * Modern Servings page — daily hero summary + distribution table.
 */
import { begin1982Page, TABLE_1982 } from './draw1982Frame.js';
import {
  MODERN_REPORT_COLORS,
  MODERN_REPORT_FONTS,
  modernFooterRuleY,
  registerModernReportFonts,
} from './drawModernReportFrame.js';
import { formatServingCell } from '../../js/servingsPrintout.js';

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
  introSize: 10,
  introGap: 14,
  sectionHeadingSize: 9,
  sectionHeadingGap: 8,
  heroNumberSize: 15,
  heroLabelSize: 10,
  heroGap: 16,
  tableTopGap: 12,
  tableRowPad: 7,
  cellPad: 6,
  labelSize: 9.5,
  dailySize: 12,
  mealSize: 9,
  headerMealSize: 8,
  headerDailySize: 9,
  noteSize: 8,
  noteGapAboveFooter: 10,
});

const HERO_ITEMS = Object.freeze([
  { key: 'protein', label: 'Protein' },
  { key: 'grainsStarches', label: 'Grains/Starches' },
  { key: 'vegetables', label: 'Veggie' },
  { key: 'fruits', label: 'Fruit' },
]);

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
    snack1: 'Snack',
    lunch: 'Lunch',
    snack2: 'Snack',
    dinner: 'Dinner',
    snack3: 'Snack',
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
          align = 'center';
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

function drawSectionHeading(doc, x, y, width, text) {
  doc
    .font(FONTS.bold)
    .fontSize(LAYOUT.sectionHeadingSize)
    .fillColor(COLORS.body)
    .text(String(text || ''), x, y, { width, lineBreak: false });
  return y + LAYOUT.sectionHeadingSize + LAYOUT.sectionHeadingGap;
}

function drawHeroDailySummary(doc, x, y, planServings) {
  let cursorX = x;
  const baseY = y;

  HERO_ITEMS.forEach((item, index) => {
    if (index > 0) {
      doc.font(FONTS.regular).fontSize(LAYOUT.heroLabelSize).fillColor(COLORS.muted);
      const sep = ' · ';
      doc.text(sep, cursorX, baseY + 2, { lineBreak: false });
      cursorX += doc.widthOfString(sep);
    }

    const amount = formatServingCell(planServings?.[item.key]);
    doc.font(FONTS.bold).fontSize(LAYOUT.heroNumberSize).fillColor(COLORS.body);
    doc.text(amount, cursorX, baseY, { lineBreak: false });
    cursorX += doc.widthOfString(amount);

    doc.font(FONTS.regular).fontSize(LAYOUT.heroLabelSize).fillColor(COLORS.body);
    const label = ` ${item.label}`;
    doc.text(label, cursorX, baseY + 2, { lineBreak: false });
    cursorX += doc.widthOfString(label) + LAYOUT.heroGap;
  });

  return baseY + LAYOUT.heroNumberSize + LAYOUT.sectionHeadingGap;
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

  if (servings.intro) {
    doc
      .font(FONTS.regular)
      .fontSize(LAYOUT.introSize)
      .fillColor(COLORS.body)
      .text(String(servings.intro), page.x, y, { width: page.width, lineGap: 2 });
    y = doc.y + LAYOUT.introGap;
  }

  if (servings.dailyHeading) {
    y = drawSectionHeading(doc, page.x, y, page.width, servings.dailyHeading);
  }

  if (servings.planServings) {
    y = drawHeroDailySummary(doc, page.x, y, servings.planServings);
  }

  if (servings.divideHeading) {
    y = drawSectionHeading(doc, page.x, y, page.width, servings.divideHeading);
  }

  y += LAYOUT.tableTopGap;
  drawServingsTable(doc, {
    x: page.x,
    y,
    width: page.width,
    rows: buildServingsRows(servings.gridRows),
  });

  drawPhysicianNote(doc, page, servings.note);
}
