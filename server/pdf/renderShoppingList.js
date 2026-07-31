import { PDF_COLORS, PDF_SHOPPING } from './constants.js';
import {
  addPersonalizedSheet,
  collectPdfBuffer,
  createPortraitPdf,
} from './draw.js';

function drawCheckbox(doc, x, y, size) {
  doc
    .strokeColor('#cccccc')
    .lineWidth(1)
    .rect(x, y, size, size)
    .stroke();
}

function drawShoppingRow(doc, row, x, y, width) {
  const checkboxSize = PDF_SHOPPING.checkboxSize;
  drawCheckbox(doc, x, y + 1, checkboxSize);

  const textX = x + checkboxSize + 8;
  const amountWidth = Math.min(width * 0.38, 140);
  const foodWidth = width - (textX - x) - amountWidth - 4;

  doc
    .font('Helvetica')
    .fontSize(PDF_SHOPPING.rowSize)
    .fillColor(PDF_COLORS.body)
    .text(String(row.foodName || ''), textX, y, {
      width: Math.max(foodWidth, 40),
      lineGap: 0,
    });

  doc
    .font('Helvetica-Bold')
    .fontSize(PDF_SHOPPING.rowSize)
    .fillColor(PDF_COLORS.body)
    .text(String(row.amount || ''), textX, y, {
      width: width - (textX - x),
      align: 'right',
      lineGap: 0,
    });

  const rowBottom = y + PDF_SHOPPING.rowSize + PDF_SHOPPING.rowPadY;
  doc
    .strokeColor(PDF_COLORS.rule)
    .lineWidth(0.5)
    .moveTo(x, rowBottom)
    .lineTo(x + width, rowBottom)
    .stroke();

  return rowBottom + PDF_SHOPPING.rowPadY;
}

function drawShoppingSection(doc, group, x, y, width, bottomY) {
  doc
    .font('Helvetica-Bold')
    .fontSize(PDF_SHOPPING.sectionSize)
    .fillColor('#333333')
    .text(String(group.category || '').toUpperCase(), x, y, {
      width,
      lineGap: 0,
    });

  let cy = doc.y + 8;
  group.rows.forEach((row) => {
    if (cy > bottomY - 20) return;
    cy = drawShoppingRow(doc, row, x, cy, width);
  });

  return cy + PDF_SHOPPING.sectionGap;
}

export async function renderShoppingListPdf(payload = {}, { title } = {}) {
  const docTitle = title || payload.title || 'B&B - Grocery List';
  const doc = createPortraitPdf({ title: docTitle });
  const bufferPromise = collectPdfBuffer(doc);

  let sheet = addPersonalizedSheet(doc, {
    headerTitle: 'Grocery List',
    clientName: payload.clientName,
    preparedAt: payload.preparedAt,
    layout: 'portrait',
  });

  if (payload.empty) {
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#666666')
      .text(
        "No ingredients in this week's plan yet.",
        sheet.box.x,
        sheet.y,
        { width: sheet.box.width, lineGap: 2 },
      );
  } else {
    let y = sheet.y;
    payload.groups.forEach((group) => {
      if (y > sheet.box.bottom - 40) {
        sheet = addPersonalizedSheet(doc, {
          headerTitle: 'Grocery List',
          clientName: payload.clientName,
          preparedAt: payload.preparedAt,
          layout: 'portrait',
        });
        y = sheet.y;
      }
      y = drawShoppingSection(doc, group, sheet.box.x, y, sheet.box.width, sheet.box.bottom);
    });
  }

  doc.end();
  return bufferPromise;
}
