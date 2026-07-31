import { PDF_SHOPPING, PDF_WEEK } from './constants.js';

export function measureTextHeight(doc, text, { width, font = 'Helvetica', fontSize = 10 } = {}) {
  doc.font(font).fontSize(fontSize);
  return doc.heightOfString(String(text || ''), { width, lineGap: 0 });
}

function measureWeekCellContentHeight(doc, lines, innerWidth) {
  if (!lines?.length) {
    return PDF_WEEK.foodSize;
  }

  let height = 0;
  lines.forEach((line, index) => {
    if (line.isMealTitle) {
      height += measureTextHeight(doc, line.foodName, {
        width: innerWidth,
        font: 'Helvetica-Bold',
        fontSize: PDF_WEEK.foodSize,
      });
    } else {
      height += measureTextHeight(doc, line.foodName, {
        width: innerWidth,
        font: 'Helvetica',
        fontSize: PDF_WEEK.foodSize,
      });
    }
    if (index < lines.length - 1) {
      height += PDF_WEEK.lineGap;
    }
  });

  return height;
}

function measureWeekRowHeadHeight(doc, row, cornerWidth) {
  const width = cornerWidth - 8;
  let height = 0;

  if (row.time) {
    height += measureTextHeight(doc, row.time, {
      width,
      font: 'Helvetica-Bold',
      fontSize: PDF_WEEK.mealTimeSize,
    }) + 1;
  }

  height += measureTextHeight(doc, String(row.label || '').toUpperCase(), {
    width,
    font: 'Helvetica-Bold',
    fontSize: PDF_WEEK.mealLabelSize,
  });

  return height + PDF_WEEK.cellPadY * 2;
}

export function measureWeekRowHeight(doc, row, dayIds, dayWidth, cornerWidth) {
  const innerWidth = Math.max(20, dayWidth - PDF_WEEK.cellPadX * 2);
  let maxCell = PDF_WEEK.foodSize;

  dayIds.forEach((dayId) => {
    const lines = row.cells?.[dayId] || [];
    maxCell = Math.max(maxCell, measureWeekCellContentHeight(doc, lines, innerWidth));
  });

  const contentHeight = maxCell + PDF_WEEK.cellPadY * 2;
  const headHeight = measureWeekRowHeadHeight(doc, row, cornerWidth);

  return Math.max(PDF_WEEK.minRowHeight, contentHeight, headHeight);
}

export function weekDayHeaderHeight() {
  return 18;
}

export function measureShoppingSectionHeaderHeight(doc, category, width) {
  return measureTextHeight(doc, String(category || '').toUpperCase(), {
    width,
    font: 'Helvetica-Bold',
    fontSize: PDF_SHOPPING.sectionSize,
  }) + 8;
}

export function measureShoppingRowHeight() {
  return PDF_SHOPPING.rowSize + PDF_SHOPPING.rowPadY * 2 + 0.5;
}
