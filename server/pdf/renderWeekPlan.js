import { PDF_COLORS, PDF_WEEK } from './constants.js';
import { createPrintPdf } from './creator.js';
import {
  measureWeekRowHeight,
  weekDayHeaderHeight,
} from './measure.js';
import { validatePrintPayload } from './validate.js';

const EMPTY_MESSAGE = 'No meals planned for this week yet. Fill in your menu planner, then open Print Shop again.';

function weekLayout(box, dayCount) {
  const cornerW = PDF_WEEK.rowHeadWidth;
  const dayW = (box.width - cornerW) / dayCount;
  return { cornerW, dayW };
}

function drawWeekDayHeaders(doc, weekDays, box, y, cornerW, dayW) {
  weekDays.forEach((day, index) => {
    const x = box.x + cornerW + index * dayW;
    doc
      .font('Helvetica-Bold')
      .fontSize(PDF_WEEK.dayHeadSize)
      .fillColor(PDF_COLORS.question)
      .text(String(day.label || '').toUpperCase(), x, y, {
        width: dayW,
        align: 'center',
        lineGap: 0,
      });
  });

  const ruleY = y + weekDayHeaderHeight();
  doc
    .strokeColor(PDF_WEEK.accent)
    .lineWidth(2)
    .moveTo(box.x + cornerW, ruleY)
    .lineTo(box.x + box.width, ruleY)
    .stroke();

  return ruleY + 4;
}

function drawWeekCell(doc, lines, x, y, width, height) {
  const innerY = y + PDF_WEEK.cellPadY;
  const innerWidth = width - PDF_WEEK.cellPadX * 2;

  if (!lines?.length) {
    doc
      .font('Helvetica')
      .fontSize(PDF_WEEK.emptyMarkSize)
      .fillColor('#d8d8d8')
      .text('—', x, innerY + (height - PDF_WEEK.cellPadY * 2) / 2 - 4, {
        width,
        align: 'center',
        lineGap: 0,
      });
    return;
  }

  let cy = innerY;
  lines.forEach((line, index) => {
    if (line.isMealTitle) {
      doc
        .font('Helvetica-Bold')
        .fontSize(PDF_WEEK.foodSize)
        .fillColor(PDF_COLORS.question)
        .text(String(line.foodName || ''), x + PDF_WEEK.cellPadX, cy, {
          width: innerWidth,
          lineGap: 0,
        });
      cy = doc.y + PDF_WEEK.lineGap;
      return;
    }

    const textX = x + PDF_WEEK.cellPadX;
    doc
      .font('Helvetica')
      .fontSize(PDF_WEEK.foodSize)
      .fillColor('#222222')
      .text(String(line.foodName || ''), textX, cy, {
        width: innerWidth,
        lineGap: 0,
      });

    if (line.amount) {
      doc
        .font('Helvetica-Bold')
        .fontSize(PDF_WEEK.foodSize)
        .fillColor(PDF_COLORS.question)
        .text(String(line.amount), textX, cy, {
          width: innerWidth,
          align: 'right',
          lineGap: 0,
        });
    }

    cy = doc.y + (index < lines.length - 1 ? PDF_WEEK.lineGap : 0);
  });
}

function drawWeekRow(doc, row, weekDays, box, y, cornerW, dayW, rowHeight) {
  const dayIds = weekDays.map((day) => day.id);
  const rowTop = y;

  doc
    .strokeColor(PDF_COLORS.rule)
    .lineWidth(1)
    .moveTo(box.x, rowTop + rowHeight)
    .lineTo(box.x + box.width, rowTop + rowHeight)
    .stroke();

  const labelX = box.x;
  const labelY = rowTop + PDF_WEEK.cellPadY;
  if (row.time) {
    doc
      .font('Helvetica-Bold')
      .fontSize(PDF_WEEK.mealTimeSize)
      .fillColor(PDF_COLORS.question)
      .text(String(row.time), labelX, labelY, {
        width: cornerW - 8,
        align: 'right',
        lineGap: 0,
      });
  }

  doc
    .font('Helvetica-Bold')
    .fontSize(PDF_WEEK.mealLabelSize)
    .fillColor('#777777')
    .text(String(row.label || '').toUpperCase(), labelX, doc.y + 1, {
      width: cornerW - 8,
      align: 'right',
      lineGap: 0,
    });

  dayIds.forEach((dayId, index) => {
    const cellX = box.x + cornerW + index * dayW;
    if (index > 0) {
      doc
        .strokeColor('#f2f2f2')
        .lineWidth(1)
        .moveTo(cellX, rowTop)
        .lineTo(cellX, rowTop + rowHeight)
        .stroke();
    }
    drawWeekCell(doc, row.cells?.[dayId], cellX, rowTop, dayW, rowHeight);
  });

  return rowTop + rowHeight;
}

function newWeekSheet(creator, payload) {
  return creator.addPersonalizedSheet({
    headerTitle: 'Weekly Meal Plan',
    clientName: payload.clientName,
    preparedAt: payload.preparedAt,
    layout: 'landscape',
  });
}

export async function renderWeekPlanPdf(payload = {}, { title } = {}) {
  validatePrintPayload('week', payload);

  const docTitle = title || payload.title || 'B&B - Weekly Meal Plan';
  const creator = createPrintPdf({ layout: 'landscape', title: docTitle });
  let sheet = newWeekSheet(creator, payload);

  if (payload.empty) {
    creator.drawEmptyMessage(sheet.box, sheet.y, EMPTY_MESSAGE);
    return creator.finish();
  }

  const dayIds = payload.weekDays.map((day) => day.id);
  const { cornerW, dayW } = weekLayout(sheet.box, payload.weekDays.length);
  let y = drawWeekDayHeaders(creator.doc, payload.weekDays, sheet.box, sheet.y, cornerW, dayW);

  payload.rows.forEach((row) => {
    const rowH = measureWeekRowHeight(creator.doc, row, dayIds, dayW, cornerW);

    if (y + rowH > sheet.box.bottom) {
      sheet = newWeekSheet(creator, payload);
      y = drawWeekDayHeaders(creator.doc, payload.weekDays, sheet.box, sheet.y, cornerW, dayW);
    }

    y = drawWeekRow(creator.doc, row, payload.weekDays, sheet.box, y, cornerW, dayW, rowH);
  });

  return creator.finish();
}
