import { PDF_MARGIN } from './constants.js';
import { drawWatermark } from './draw.js';
import {
  PDF_FRAME_COLORS,
  pinnedContentBottomY,
  stampPinnedProgramFooters,
  drawFrameHeader,
  drawContinuationHeader,
  framePageTitleStartY,
  PDF_FRAME_FONTS,
} from './drawFrame.js';

const FRAME_FONTS = PDF_FRAME_FONTS;

export const FRAME_1982 = Object.freeze({
  pageTitleSize: 20,
  titleBottomGap: 20,
  bodySize: 10,
  sectionTitleSize: 10,
  tableHeadSize: 9,
  tableBodySize: 9.5,
  tableRowPad: 6,
  lineGap: 3,
  paragraphGap: 8,
  sectionGap: 10,
  headerGap: 6,
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
  drawWatermark(doc);
  return frame1982ContentBox(doc);
}

export function draw1982PageTitle(doc, box, y, title, fonts = FRAME_FONTS) {
  doc
    .font(fonts.bold)
    .fontSize(FRAME_1982.pageTitleSize)
    .fillColor(PDF_FRAME_COLORS.body)
    .text(String(title || ''), box.x, y, { width: box.width, align: 'left', lineGap: 0 });
  return doc.y + FRAME_1982.titleBottomGap;
}

export function begin1982Page(doc, payload, pageTitle, { fullHeader = true, fonts = FRAME_FONTS } = {}) {
  const box = add1982Page(doc);
  const topGoldY = fullHeader
    ? drawFrameHeader(doc, box, {
      personalized: true,
      clientName: payload.clientName,
      preparedDateLong: payload.preparedDateLong,
      preparedDate: payload.preparedDate,
      fonts,
    })
    : drawContinuationHeader(doc, box);

  let y = fullHeader ? framePageTitleStartY(topGoldY) : topGoldY + 16;
  if (pageTitle) {
    y = draw1982PageTitle(doc, box, y, pageTitle, fonts);
  }
  return {
    box,
    x: box.x,
    y,
    width: box.width,
    bottom: pinnedContentBottomY(box),
  };
}

export function stamp1982Footers(doc, contact, fonts = FRAME_FONTS) {
  return stampPinnedProgramFooters(doc, contact, fonts);
}
