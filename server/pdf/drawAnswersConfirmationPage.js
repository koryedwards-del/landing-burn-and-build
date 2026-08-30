/**
 * Questionnaire confirmation page — administrative answer record.
 */
import { begin1982Page, TABLE_1982 } from './draw1982Frame.js';
import {
  MODERN_REPORT_COLORS,
  MODERN_REPORT_FONTS,
  MODERN_HEADER_LAYOUT,
  registerModernReportFonts,
} from './drawModernReportFrame.js';
import { formatAnswersConfirmationLabel } from '../../js/answersConfirmationPrintout.js';

const FONTS = MODERN_REPORT_FONTS;
const COLORS = MODERN_REPORT_COLORS;

const LAYOUT = Object.freeze({
  introSize: 9.5,
  introGap: 10,
  questionSize: 9.5,
  answerSize: 10,
  signatureNameScale: 2.25,
  tableRowPad: 7,
  cellPad: 6,
});

function signatureNameSize() {
  return LAYOUT.answerSize * LAYOUT.signatureNameScale;
}

const TABLE_COLUMNS = Object.freeze([
  { key: 'label', width: 0.5 },
  { key: 'value', width: 0.5 },
]);

function columnWidths(columns, tableWidth) {
  return columns.map((col) => col.width * tableWidth);
}

function formatValueText(row) {
  if (row.signatureDisplay?.name) {
    const date = row.signatureDisplay.date;
    return date ? `${row.signatureDisplay.name} — ${date}` : row.signatureDisplay.name;
  }
  return String(row.value ?? '');
}

function valueStyle(row) {
  return { font: FONTS.bold, fontSize: LAYOUT.answerSize };
}

function drawValueCell(doc, row, x, y, cellW) {
  const innerW = cellW - LAYOUT.cellPad * 2;
  const textX = x + LAYOUT.cellPad;
  const textY = y + LAYOUT.tableRowPad;
  const fillColor = row._colors?.value || COLORS.body;

  if (row.signatureDisplay?.name) {
    const name = row.signatureDisplay.name;
    const date = row.signatureDisplay.date;
    const nameSize = signatureNameSize();
    doc.font(FONTS.signature).fontSize(nameSize).fillColor(fillColor);
    if (date) {
      const nameWidth = doc.widthOfString(name);
      doc.text(name, textX, textY, { lineBreak: false });
      const dateY = textY + (nameSize - LAYOUT.answerSize) * 0.35;
      doc
        .font(FONTS.regular)
        .fontSize(LAYOUT.answerSize)
        .text(` — ${date}`, textX + nameWidth, dateY, {
          width: Math.max(0, innerW - nameWidth),
          lineGap: 0,
        });
      return;
    }
    doc.text(name, textX, textY, { width: innerW, lineGap: 0 });
    return;
  }

  const style = row._styles?.value || valueStyle(row);
  doc
    .font(style.font || FONTS.bold)
    .fontSize(style.fontSize || LAYOUT.answerSize)
    .fillColor(fillColor)
    .text(String(row.value ?? ''), textX, textY, {
      width: innerW,
      lineGap: 0,
    });
}

function measureRowHeights(doc, rows, columns, tableWidth) {
  const colWidths = columnWidths(columns, tableWidth);
  return rows.map((row) => {
    let maxH = LAYOUT.tableRowPad * 2;
    columns.forEach((col, index) => {
      if (col.key === 'value' && row.signatureDisplay?.name) {
        const nameSize = signatureNameSize();
        doc.font(FONTS.signature).fontSize(nameSize);
        const nameH = doc.heightOfString(row.signatureDisplay.name, { lineBreak: false });
        let rowTextH = nameH;
        if (row.signatureDisplay.date) {
          doc.font(FONTS.regular).fontSize(LAYOUT.answerSize);
          rowTextH = Math.max(nameH, doc.heightOfString(` — ${row.signatureDisplay.date}`, { lineBreak: false }));
        }
        maxH = Math.max(maxH, rowTextH + LAYOUT.tableRowPad * 2);
        return;
      }
      const style = row._styles?.[col.key] || {};
      doc.font(style.font || FONTS.regular).fontSize(style.fontSize || LAYOUT.questionSize);
      const innerW = colWidths[index] - LAYOUT.cellPad * 2;
      const text = col.key === 'value' ? formatValueText(row) : String(row[col.key] ?? '');
      maxH = Math.max(
        maxH,
        doc.heightOfString(text, { width: innerW, lineGap: 0 })
          + LAYOUT.tableRowPad * 2,
      );
    });
    return maxH;
  });
}

function drawConfirmationTable(doc, { x, y, width, rows }) {
  const rowHeights = measureRowHeights(doc, rows, TABLE_COLUMNS, width);
  const totalH = rowHeights.reduce((sum, height) => sum + height, 0);
  const colWidths = columnWidths(TABLE_COLUMNS, width);

  doc
    .strokeColor(TABLE_1982.stroke)
    .lineWidth(1.25)
    .roundedRect(x, y, width, totalH, TABLE_1982.radius)
    .stroke();

  let cy = y;
  rows.forEach((row, rowIndex) => {
    const rowH = rowHeights[rowIndex];
    let cx = x;
    TABLE_COLUMNS.forEach((col, index) => {
      const cellW = colWidths[index];
      const style = row._styles?.[col.key] || {};
      const fillColor = row._colors?.[col.key] || COLORS.body;
      if (col.key === 'value' && row.signatureDisplay?.name) {
        drawValueCell(doc, row, cx, cy, cellW);
      } else {
        doc
          .font(style.font || FONTS.regular)
          .fontSize(style.fontSize || LAYOUT.questionSize)
          .fillColor(fillColor)
          .text(String(row[col.key] ?? ''), cx + LAYOUT.cellPad, cy + LAYOUT.tableRowPad, {
            width: cellW - LAYOUT.cellPad * 2,
            lineGap: 0,
          });
      }
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

export function drawAnswersConfirmationPage(doc, payload) {
  const confirmation = payload.answersConfirmation;
  if (!confirmation?.rows?.length) return;

  registerModernReportFonts(doc);
  const page = begin1982Page(doc, payload, 'Questionnaire confirmation', {
    titleLeadSize: MODERN_HEADER_LAYOUT.titleSize - 6,
    titleAccentSize: MODERN_HEADER_LAYOUT.titleSize,
  });

  let y = page.y;
  if (confirmation.intro) {
    doc
      .font(FONTS.regular)
      .fontSize(LAYOUT.introSize)
      .fillColor(COLORS.body)
      .text(String(confirmation.intro), page.x, y, {
        width: page.width,
        lineGap: 2,
      });
    y = doc.y + LAYOUT.introGap;
  }

  const rows = confirmation.rows.map((row) => ({
    label: formatAnswersConfirmationLabel(row),
    value: row.value,
    signatureDisplay: row.signatureDisplay || null,
    _styles: {
      label: { font: FONTS.regular, fontSize: LAYOUT.questionSize },
      value: valueStyle(row),
    },
    _colors: {
      label: COLORS.muted,
      value: COLORS.body,
    },
  }));

  drawConfirmationTable(doc, {
    x: page.x,
    y,
    width: page.width,
    rows,
  });
}
