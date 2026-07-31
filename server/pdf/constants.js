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

/** Shared palette — generic Print Shop documents. */
export const PDF_COLORS = {
  question: '#111111',
  body: '#333333',
  brand: '#888888',
  rule: '#e8e8e8',
};

/** Shared Q&A typography — FAQ, For Best Results, food-list tips. */
export const PDF_QA = {
  questionSize: 9.5,
  answerSize: 8.5,
  itemGap: 7,
  lineGap: 2,
  questionAnswerGap: 1.5,
};

export const PDF_FOOD_LIST = {
  columnTitleSize: PDF_QA.questionSize,
  columnTitleGap: 6,
  foodSize: 7,
  foodItemGap: 1,
  foodLineHeight: 8,
  columnGap: 16,
  columnRuleWidth: 1,
  tipsMinBlock: 24,
};

/** Weekly meal plan — landscape agenda grid. */
export const PDF_WEEK = {
  dayHeadSize: 8,
  mealTimeSize: 6.5,
  mealLabelSize: 5.5,
  foodSize: 7,
  emptyMarkSize: 8,
  rowHeadWidth: 76,
  cellPadX: 6,
  cellPadY: 14,
  minRowHeight: 36,
  lineGap: 2,
  accent: '#fdc500',
};

/** Grocery list — portrait checklist sections. */
export const PDF_SHOPPING = {
  sectionSize: 10,
  rowSize: 9,
  checkboxSize: 10,
  sectionGap: 14,
  rowPadY: 4,
};

export const PDF_VIEWS = new Set(['faq', 'foodlist', 'bestresults', 'week', 'shopping']);

/** Views filled from client POST payload (not cacheable). */
export const PDF_PERSONALIZED_VIEWS = new Set(['week', 'shopping']);
