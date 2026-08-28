import { PDF_MARGIN } from './constants.js';
import { PRINT_TEMPLATE_TYPOGRAPHY } from '../../js/printTemplateTypographyData.js';
import {
  drawModernReportFooter,
  drawModernReportHeader,
} from './drawModernReportFrame.js';

import { PDF_FRAME_COLORS, frameContentBox, pinnedContentBottomY } from './drawFrame.js';

/** Matches --TODAY-- accent in legacy layouts; table borders stay gold. */
export const SAMPLE_DIET_BLUE = PDF_FRAME_COLORS.accentBlue;

export const FRAME_1982 = Object.freeze({
  pageTitleSize: PRINT_TEMPLATE_TYPOGRAPHY.pageTitle,
  titleBottomGap: PRINT_TEMPLATE_TYPOGRAPHY.titleBottomGap,
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
  return frame1982ContentBox(doc);
}

export function begin1982Page(doc, payload, pageTitle, { fullHeader = true } = {}) {
  const box = add1982Page(doc);
  const y = drawModernReportHeader(
    doc,
    box,
    payload,
    fullHeader ? (pageTitle || null) : null,
  );
  return {
    box,
    x: box.x,
    y,
    width: box.width,
    bottom: pinnedContentBottomY(box),
  };
}

export function stamp1982Footers(doc, contact, { pageNumbers = true } = {}) {
  if (typeof doc.bufferedPageRange !== 'function') return 0;
  const range = doc.bufferedPageRange();
  const total = range.count;
  for (let index = 0; index < total; index += 1) {
    doc.switchToPage(range.start + index);
    const box = frameContentBox(doc);
    drawModernReportFooter(doc, box, {
      page: pageNumbers ? index + 1 : null,
      total: pageNumbers ? total : null,
      contact,
    });
  }
  return total;
}
