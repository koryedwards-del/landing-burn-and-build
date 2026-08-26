import { PDF_MARGIN } from './constants.js';
import { PDF_FRAME_FONTS, PDF_FRAME_COLORS } from './drawFrame.js';

export const FRAME_1982 = Object.freeze({
  contactSize: 9,
  personalizationSize: 10,
  pageTitleSize: 14,
  pageNumberSize: 9,
  bodySize: 10,
  sectionTitleSize: 10,
  tableHeadSize: 9,
  tableBodySize: 9.5,
  tableRowPad: 6,
  lineGap: 3,
  paragraphGap: 8,
  sectionGap: 10,
  headerGap: 6,
  titleGap: 14,
  contentPad: 6,
});

export const TABLE_1982 = Object.freeze({
  stroke: PDF_FRAME_COLORS.gold,
  radius: 4,
  cellPad: 6,
});

export function frame1982ContentBox(doc) {
  const { width, height } = doc.page;
  return {
    x: PDF_MARGIN.left,
    y: PDF_MARGIN.top,
    width: width - PDF_MARGIN.left - PDF_MARGIN.right,
    height: height - PDF_MARGIN.top - PDF_MARGIN.bottom,
    bottom: height - PDF_MARGIN.bottom,
  };
}

export function add1982Page(doc) {
  doc.addPage({ size: 'LETTER', layout: 'portrait', margin: 0 });
  return frame1982ContentBox(doc);
}

export function draw1982ContactLine(doc, box, contact) {
  const line = [contact.phone, contact.website, contact.email].filter(Boolean).join('     ');
  doc
    .font(PDF_FRAME_FONTS.regular)
    .fontSize(FRAME_1982.contactSize)
    .fillColor(PDF_FRAME_COLORS.body)
    .text(line, box.x, box.y, { width: box.width, align: 'center', lineGap: 0 });
  return doc.y + FRAME_1982.headerGap;
}

export function draw1982PersonalizationLine(doc, box, y, { clientName, preparedDate }) {
  const rowY = y;
  doc
    .font(PDF_FRAME_FONTS.bold)
    .fontSize(FRAME_1982.personalizationSize)
    .fillColor(PDF_FRAME_COLORS.body)
    .text(`Prepared exclusively for: ${String(clientName || '').toUpperCase()}`, box.x, rowY, {
      width: box.width * 0.68,
      align: 'left',
      lineGap: 0,
    });
  doc
    .font(PDF_FRAME_FONTS.bold)
    .fontSize(FRAME_1982.personalizationSize)
    .text(`On: ${preparedDate || ''}`, box.x + box.width * 0.68, rowY, {
      width: box.width * 0.32,
      align: 'right',
      lineGap: 0,
    });
  return rowY + FRAME_1982.personalizationSize + FRAME_1982.titleGap;
}

export function draw1982PageTitle(doc, box, y, title) {
  doc
    .font(PDF_FRAME_FONTS.bold)
    .fontSize(FRAME_1982.pageTitleSize)
    .fillColor(PDF_FRAME_COLORS.body)
    .text(String(title || ''), box.x, y, { width: box.width, align: 'left', lineGap: 0 });
  return doc.y + FRAME_1982.sectionGap;
}

export function begin1982Page(doc, payload, pageTitle) {
  const box = add1982Page(doc);
  let y = draw1982ContactLine(doc, box, payload.header || {});
  y = draw1982PersonalizationLine(doc, box, y, {
    clientName: payload.clientName,
    preparedDate: payload.preparedDate,
  });
  if (pageTitle) {
    y = draw1982PageTitle(doc, box, y, pageTitle);
  }
  const footerReserve = FRAME_1982.pageNumberSize + 16;
  return { box, x: box.x, y, width: box.width, bottom: box.bottom - footerReserve };
}

export function stamp1982PageNumbers(doc) {
  if (typeof doc.bufferedPageRange !== 'function') return 0;
  const range = doc.bufferedPageRange();
  const total = range.count;
  for (let index = 0; index < total; index += 1) {
    doc.switchToPage(range.start + index);
    const box = frame1982ContentBox(doc);
    const label = `${index + 1} of ${total}`;
    doc
      .font(PDF_FRAME_FONTS.regular)
      .fontSize(FRAME_1982.pageNumberSize)
      .fillColor(PDF_FRAME_COLORS.muted)
      .text(label, box.x, box.bottom - FRAME_1982.pageNumberSize - 4, {
        width: box.width,
        align: 'center',
        lineGap: 0,
      });
  }
  return total;
}
