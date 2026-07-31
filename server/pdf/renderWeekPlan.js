import { PDF_COLORS, PDF_WEEK } from './constants.js';
import {
  addPersonalizedSheet,
  collectPdfBuffer,
  createLandscapePdf,
} from './draw.js';

function cellLineCount(lines) {
  if (!lines?.length) return 1;
  return lines.length;
}

function rowHeight(linesByDay, dayIds) {
  const maxLines = Math.max(
    1,
    ...dayIds.map((id) => cellLineCount(linesByDay[id])),
  );
  const contentH = maxLines * (PDF_WEEK.foodSize + PDF_WEEK.lineGap) + 4;
  return Math.max(PDF_WEEK.minRowHeight, contentH + PDF_WEEK.cellPadY * 2);
}

function drawWeekCell(doc, lines, x, y, width, height) {
  const innerY = y + PDF_WEEK.cellPadY;

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
  lines.forEach((line) => {
    if (line.isMealTitle) {
      doc
        .font('Helvetica-Bold')
        .fontSize(PDF_WEEK.foodSize)
        .fillColor(PDF_COLORS.question)
        .text(String(line.foodName || ''), x + PDF_WEEK.cellPadX, cy, {
          width: width - PDF_WEEK.cellPadX * 2,
          lineGap: 0,
        });
      cy = doc.y + PDF_WEEK.lineGap;
      return;
    }

    const textX = x + PDF_WEEK.cellPadX;
    const textWidth = width - PDF_WEEK.cellPadX * 2;
    const amountWidth = 42;
    const foodWidth = Math.max(20, textWidth - amountWidth);

    doc
      .font('Helvetica')
      .fontSize(PDF_WEEK.foodSize)
      .fillColor('#222222')
      .text(String(line.foodName || ''), textX, cy, {
        width: foodWidth,
        lineGap: 0,
      });

    if (line.amount) {
      doc
        .font('Helvetica-Bold')
        .fontSize(PDF_WEEK.foodSize)
        .fillColor(PDF_COLORS.question)
        .text(String(line.amount), textX, cy, {
          width: textWidth,
          align: 'right',
          lineGap: 0,
        });
    }

    cy += PDF_WEEK.foodSize + PDF_WEEK.lineGap;
  });
}

function drawWeekGrid(doc, payload, box, startY) {
  const dayIds = payload.weekDays.map((day) => day.id);
  const cornerW = PDF_WEEK.rowHeadWidth;
  const dayW = (box.width - cornerW) / dayIds.length;
  let y = startY;

  const headH = 18;
  dayIds.forEach((id, index) => {
    const day = payload.weekDays[index];
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

  y += headH;
  doc
    .strokeColor(PDF_WEEK.accent)
    .lineWidth(2)
    .moveTo(box.x + cornerW, y)
    .lineTo(box.x + box.width, y)
    .stroke();

  payload.rows.forEach((row, rowIndex) => {
    const h = rowHeight(row.cells, dayIds);
    const rowTop = y;

    doc
      .strokeColor(PDF_COLORS.rule)
      .lineWidth(1)
      .moveTo(box.x, rowTop + h)
      .lineTo(box.x + box.width, rowTop + h)
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
          .lineTo(cellX, rowTop + h)
          .stroke();
      }
      drawWeekCell(doc, row.cells[dayId], cellX, rowTop, dayW, h);
    });

    y += h;
    if (y > box.bottom - PDF_WEEK.minRowHeight && rowIndex < payload.rows.length - 1) {
      return;
    }
  });
}

export async function renderWeekPlanPdf(payload = {}, { title } = {}) {
  const docTitle = title || payload.title || 'B&B - Weekly Meal Plan';
  const doc = createLandscapePdf({ title: docTitle });
  const bufferPromise = collectPdfBuffer(doc);

  const { box, y } = addPersonalizedSheet(doc, {
    headerTitle: 'Weekly Meal Plan',
    clientName: payload.clientName,
    preparedAt: payload.preparedAt,
    layout: 'landscape',
  });

  if (payload.empty) {
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#666666')
      .text(
        'No meals planned for this week yet. Fill in your menu planner, then open Print Shop again.',
        box.x,
        y,
        { width: box.width, lineGap: 2 },
      );
  } else {
    drawWeekGrid(doc, payload, box, y);
  }

  doc.end();
  return bufferPromise;
}
