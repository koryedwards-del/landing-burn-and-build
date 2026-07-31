/** Shared Print Shop PDF settings — tune watermark opacity here. */
export const PDF_WATERMARK_OPACITY = 0.08;

/** Full-color logo, centered — matches Print Shop HTML target (240px ≈ 180pt). */
export const PDF_WATERMARK_SIZE_PT = 180;

/** Optimized for PDF embed (~40KB); full bblogo1.png is ~2MB and slows open/print. */
export const PDF_LOGO_REL = 'img/brand/bblogo-pdf.jpg';

/** Match generic sheet padding in plannerPrintStyles.js */
export const PDF_MARGIN = {
  top: 0.35 * 72,
  bottom: 0.35 * 72,
  left: 0.44 * 72,
  right: 0.44 * 72,
};

export const PDF_HEADER = {
  logoWidth: 54,
  brandSize: 8,
  titleSize: 24,
  metaSize: 9,
  gap: 14,
  ruleGap: 10,
};

export const PDF_FAQ = {
  questionSize: 9.5,
  answerSize: 8.5,
  itemGap: 7,
  lineGap: 2,
  questionAnswerGap: 1.5,
};

export const PDF_VIEWS = new Set(['faq']);
