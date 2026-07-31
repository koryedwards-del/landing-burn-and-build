import PDFDocument from 'pdfkit';
import { PDF_FOOD_LIST, PDF_QA } from './constants.js';
import { contentBox, drawGenericHeader, drawWatermark } from './draw.js';
import {
  FOOD_LIST_PRINT_PAGES,
  foodListLabel,
  foodsForFoodListColumn,
  tipsForColumn,
} from './foodListData.js';

function collectPdfBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

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
    .strokeColor('#111111')
    .lineWidth(PDF_FOOD_LIST.columnRuleWidth)
    .moveTo(x, yTop)
    .lineTo(x, yBottom)
    .stroke();
}

function drawColumnTitle(doc, title, x, y, width, { hidden = false } = {}) {
  if (hidden) return y;
  doc
    .font('Helvetica-BoldOblique')
    .fontSize(PDF_FOOD_LIST.columnTitleSize)
    .fillColor('#111111')
    .text(String(title || '').toUpperCase(), x, y, {
      width,
      align: 'center',
      lineGap: 0,
    });
  return doc.y + PDF_FOOD_LIST.columnTitleGap;
}

function drawFoodNames(doc, foods, x, startY, width, bottomY) {
  let y = startY;
  doc.font('Helvetica').fontSize(PDF_FOOD_LIST.foodSize).fillColor('#222222');

  for (const food of foods) {
    if (y > bottomY - PDF_FOOD_LIST.foodLineHeight) break;
    doc.text(foodListLabel(food), x, y, { width, lineGap: 0 });
    y = doc.y + PDF_FOOD_LIST.foodItemGap;
  }

  return y;
}

function drawTipsColumn(doc, qaItems, x, startY, width, bottomY) {
  let y = startY;

  qaItems.forEach((item, index) => {
    if (y > bottomY - PDF_FOOD_LIST.tipsMinBlock) return;

    doc
      .font('Helvetica-Bold')
      .fontSize(PDF_QA.questionSize)
      .fillColor('#111111')
      .text(item.q, x, y, { width, lineGap: PDF_QA.lineGap });

    y = doc.y + PDF_QA.questionAnswerGap;

    doc
      .font('Helvetica')
      .fontSize(PDF_QA.answerSize)
      .fillColor('#333333')
      .text(item.a, x, y, { width, lineGap: PDF_QA.lineGap });

    y = doc.y + PDF_QA.itemGap;

    if (index < qaItems.length - 1 && y < bottomY - 4) {
      doc
        .strokeColor('#bbbbbb')
        .lineWidth(0.5)
        .moveTo(x, y - PDF_QA.itemGap / 2)
        .lineTo(x + width, y - PDF_QA.itemGap / 2)
        .stroke();
    }
  });

  return y;
}

function drawFoodListPage(doc, pageDef) {
  doc.addPage({ size: 'LETTER', layout: 'portrait', margin: 0 });
  drawWatermark(doc);

  const box = contentBox(doc);
  const contentTop = drawGenericHeader(doc, 'Food List', box);
  const bottomY = box.bottom;
  const columnCount = pageDef.columnCount || pageDef.columns.length;
  const columns = columnLayout(box, columnCount);

  pageDef.columns.forEach((columnDef, index) => {
    const col = columns[index];
    const drawRule = index > 0;
    if (drawRule) {
      drawColumnRule(doc, col.x - PDF_FOOD_LIST.columnGap / 2, contentTop - 4, bottomY);
    }

    let y = drawColumnTitle(doc, columnDef.title, col.x, contentTop, col.width, {
      hidden: columnDef.hideTitle,
    });

    if (columnDef.kind === 'tips') {
      drawTipsColumn(doc, tipsForColumn(columnDef.qaKey), col.x, y, col.width, bottomY);
      return;
    }

    drawFoodNames(
      doc,
      foodsForFoodListColumn(columnDef),
      col.x,
      y,
      col.width,
      bottomY,
    );
  });
}

export async function renderFoodListPdf({ title } = {}) {
  const docTitle = title || 'B&B - Food List';
  const doc = new PDFDocument({
    size: 'LETTER',
    layout: 'portrait',
    margin: 0,
    autoFirstPage: false,
    info: {
      Title: docTitle,
      Author: 'Burn & Build Diet',
    },
  });

  const bufferPromise = collectPdfBuffer(doc);

  FOOD_LIST_PRINT_PAGES.forEach((pageDef) => {
    drawFoodListPage(doc, pageDef);
  });

  doc.end();
  return bufferPromise;
}
