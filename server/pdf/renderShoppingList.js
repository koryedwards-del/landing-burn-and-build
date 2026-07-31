import { PDF_COLORS, PDF_SHOPPING } from './constants.js';
import { createPrintPdf } from './creator.js';
import {
  measureShoppingRowHeight,
  measureShoppingSectionHeaderHeight,
} from './measure.js';
import { validatePrintPayload } from './validate.js';

const EMPTY_MESSAGE = "No ingredients in this week's plan yet.";

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
  const rowHeight = measureShoppingRowHeight();

  doc
    .font('Helvetica')
    .fontSize(PDF_SHOPPING.rowSize)
    .fillColor(PDF_COLORS.body)
    .text(String(row.foodName || ''), textX, y, {
      width: width - (textX - x) - 4,
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

  const rowBottom = y + rowHeight - PDF_SHOPPING.rowPadY;
  doc
    .strokeColor(PDF_COLORS.rule)
    .lineWidth(0.5)
    .moveTo(x, rowBottom)
    .lineTo(x + width, rowBottom)
    .stroke();

  return y + rowHeight;
}

function drawShoppingSectionHeader(doc, category, x, y, width) {
  doc
    .font('Helvetica-Bold')
    .fontSize(PDF_SHOPPING.sectionSize)
    .fillColor('#333333')
    .text(String(category || '').toUpperCase(), x, y, {
      width,
      lineGap: 0,
    });

  return doc.y + 8;
}

function newShoppingSheet(creator, payload) {
  return creator.addPersonalizedSheet({
    headerTitle: 'Grocery List',
    clientName: payload.clientName,
    preparedAt: payload.preparedAt,
    layout: 'portrait',
  });
}

export async function renderShoppingListPdf(payload = {}, { title } = {}) {
  validatePrintPayload('shopping', payload);

  const docTitle = title || payload.title || 'B&B - Grocery List';
  const creator = createPrintPdf({ title: docTitle });
  let sheet = newShoppingSheet(creator, payload);

  if (payload.empty) {
    creator.drawEmptyMessage(sheet.box, sheet.y, EMPTY_MESSAGE);
    return creator.finish();
  }

  let y = sheet.y;
  const rowHeight = measureShoppingRowHeight();

  payload.groups.forEach((group) => {
    let headerDrawn = false;

    group.rows.forEach((row) => {
      const sectionHeaderHeight = headerDrawn
        ? 0
        : measureShoppingSectionHeaderHeight(creator.doc, group.category, sheet.box.width);
      const needed = sectionHeaderHeight + rowHeight;

      if (y + needed > sheet.box.bottom) {
        sheet = newShoppingSheet(creator, payload);
        y = sheet.y;
        headerDrawn = false;
      }

      if (!headerDrawn) {
        y = drawShoppingSectionHeader(creator.doc, group.category, sheet.box.x, y, sheet.box.width);
        headerDrawn = true;
      }

      y = drawShoppingRow(creator.doc, row, sheet.box.x, y, sheet.box.width);
    });

    y += PDF_SHOPPING.sectionGap;
  });

  return creator.finish();
}
