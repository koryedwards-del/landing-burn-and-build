import { PDF_COLORS, PDF_FOOD_LIST } from './constants.js';
import {
  addGenericSheet,
  collectPdfBuffer,
  createPortraitPdf,
  drawQaItem,
} from './draw.js';
import {
  FOOD_LIST_PRINT_PAGES,
  foodListLabel,
  foodsForFoodListColumn,
  tipsForColumn,
} from './foodListData.js';

function columnLayout(box, columnCount) {
  const gap = PDF_FOOD_LIST.columnGap;
  const colWidth = (box.width - gap * (columnCount - 1)) / columnCount;
  return Array.from({ length: columnCount }, (_, index) => ({
    x: box.x + index * (colWidth + gap),
    width: colWidth,
  }));
}

function drawColumnRule(doc, x, yTop, yBottom) {
  doc
    .strokeColor(PDF_COLORS.rule)
    .lineWidth(PDF_FOOD_LIST.columnRuleWidth)
    .moveTo(x, yTop)
    .lineTo(x, yBottom)
    .stroke();
}

function drawColumnTitle(doc, title, x, y, width, { hidden = false } = {}) {
  if (hidden) return y;
  doc
    .font('Helvetica-Bold')
    .fontSize(PDF_FOOD_LIST.columnTitleSize)
    .fillColor(PDF_COLORS.question)
    .text(String(title || '').toUpperCase(), x, y, {
      width,
      align: 'center',
      lineGap: 0,
    });
  return doc.y + PDF_FOOD_LIST.columnTitleGap;
}

function drawFoodNames(doc, foods, x, startY, width, bottomY) {
  let y = startY;
  doc.font('Helvetica').fontSize(PDF_FOOD_LIST.foodSize).fillColor(PDF_COLORS.body);

  for (const food of foods) {
    if (y > bottomY - PDF_FOOD_LIST.foodLineHeight) break;
    doc.text(foodListLabel(food), x, y, { width, lineGap: 0 });
    y = doc.y + PDF_FOOD_LIST.foodItemGap;
  }

  return y;
}

function drawTipsColumn(doc, qaItems, x, startY, width, bottomY) {
  let y = startY;

  qaItems.forEach((item) => {
    if (y > bottomY - PDF_FOOD_LIST.tipsMinBlock) return;
    y = drawQaItem(doc, {
      question: item.q,
      answer: item.a,
      x,
      y,
      width,
    });
  });

  return y;
}

function drawFoodListPage(doc, pageDef) {
  const { box, y: contentTop } = addGenericSheet(doc, 'Food List');
  const bottomY = box.bottom;
  const columnCount = pageDef.columnCount || pageDef.columns.length;
  const columns = columnLayout(box, columnCount);

  pageDef.columns.forEach((columnDef, index) => {
    const col = columns[index];
    if (index > 0) {
      drawColumnRule(doc, col.x - PDF_FOOD_LIST.columnGap / 2, contentTop - 4, bottomY);
    }

    let y = drawColumnTitle(doc, columnDef.title, col.x, contentTop, col.width, {
      hidden: columnDef.hideTitle,
    });

    if (columnDef.kind === 'tips') {
      drawTipsColumn(doc, tipsForColumn(columnDef.qaKey), col.x, y, col.width, bottomY);
      return;
    }

    drawFoodNames(doc, foodsForFoodListColumn(columnDef), col.x, y, col.width, bottomY);
  });
}

export async function renderFoodListPdf({ title } = {}) {
  const docTitle = title || 'B&B - Food List';
  const doc = createPortraitPdf({ title: docTitle });
  const bufferPromise = collectPdfBuffer(doc);

  FOOD_LIST_PRINT_PAGES.forEach((pageDef) => {
    drawFoodListPage(doc, pageDef);
  });

  doc.end();
  return bufferPromise;
}
