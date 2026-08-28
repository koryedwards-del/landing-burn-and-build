import { PDF_MARGIN } from './constants.js';
import { PRINT_TEMPLATE_TYPOGRAPHY } from '../../js/printTemplateTypographyData.js';
import {
  PDF_FRAME_COLORS,
  pinnedContentBottomY,
  drawFrameHeader,
  drawContinuationHeader,
  framePageTitleStartY,
  PDF_FRAME_FONTS,
  frameContentBox,
  drawPinnedProgramFooter,
} from './drawFrame.js';
import { drawModernFoodPlanFooter } from './drawModernFoodPlanPage.js';

const FRAME_FONTS = PDF_FRAME_FONTS;

/** Matches --TODAY-- accent in legacy layouts; sample diet header/footer divider rules only. */
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
  stroke: PDF_FRAME_COLORS.gold, // table borders stay gold; header/footer rules use SAMPLE_DIET_BLUE
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

export function draw1982PageTitle(doc, box, y, title, fonts = FRAME_FONTS) {
  doc
    .font(fonts.bold)
    .fontSize(FRAME_1982.pageTitleSize)
    .fillColor(PDF_FRAME_COLORS.body)
    .text(String(title || ''), box.x, y, { width: box.width, align: 'left', lineGap: 0 });
  return doc.y + FRAME_1982.titleBottomGap;
}

export function begin1982Page(doc, payload, pageTitle, {
  fullHeader = true,
  personalized,
  fonts = FRAME_FONTS,
} = {}) {
  const box = add1982Page(doc);
  const usePersonalized = personalized ?? !payload?.worksheet;
  const topRuleY = fullHeader
    ? drawFrameHeader(doc, box, {
      personalized: usePersonalized,
      clientName: payload.clientName,
      preparedDateLong: payload.preparedDateLong,
      preparedDate: payload.preparedDate,
      fonts,
      ruleColor: SAMPLE_DIET_BLUE,
    })
    : drawContinuationHeader(doc, box, { ruleColor: SAMPLE_DIET_BLUE });

  let y = fullHeader ? framePageTitleStartY(topRuleY) : topRuleY + 16;
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

export function stamp1982Footers(doc, contact, { fonts = FRAME_FONTS, pageNumbers = true, modernFooterPageIndex = null } = {}) {
  if (typeof doc.bufferedPageRange !== 'function') return 0;
  const range = doc.bufferedPageRange();
  const total = range.count;
  for (let index = 0; index < total; index += 1) {
    doc.switchToPage(range.start + index);
    const box = frameContentBox(doc);
    if (modernFooterPageIndex != null && index === modernFooterPageIndex) {
      drawModernFoodPlanFooter(doc, box, {
        page: pageNumbers ? index + 1 : null,
        total: pageNumbers ? total : null,
        contact,
      });
      continue;
    }
    drawPinnedProgramFooter(doc, box, {
      page: pageNumbers ? index + 1 : null,
      total: pageNumbers ? total : null,
      contact,
      fonts,
      ruleColor: SAMPLE_DIET_BLUE,
    });
  }
  return total;
}
