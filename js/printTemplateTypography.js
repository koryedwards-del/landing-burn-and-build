/**
 * Locked personalized print template — single typography scale.
 * PDF (PDFKit): values are points.
 * Web preview: css/print-template.css mirrors these as --print-* custom properties.
 */
export const PRINT_TEMPLATE_TYPOGRAPHY = Object.freeze({
  contact: 9,
  personalization: 12,
  pageTitle: 20,
  pageNumber: 9,
  body: 10.5,
  subsection: 11.5,
  sectionTitle: 12,
  tableHead: 9,
  tableBody: 9.5,
  tableRowPad: 7,
  lineGap: 4,
  paragraphGap: 12,
  sectionGap: 14,
  headerGap: 8,
  contentPad: 6,
  /** Space below header gold rule before page title. */
  titleTopGap: 28,
  /** Space below page title before body content. */
  titleBottomGap: 20,
});

/** Welcome page (PDF page 1) — intro + section guide blocks. */
export const PRINT_TEMPLATE_WELCOME = Object.freeze({
  introBody: 10.5,
  sectionTitle: 10.5,
  sectionBody: 9.5,
  lineGap: 2,
  paragraphGap: 6,
  headerGap: 4,
  sectionGap: 6,
});

/** Legacy seminar header lines (older letterhead pages). */
export const PRINT_TEMPLATE_SEMINAR_HEADER = Object.freeze({
  contact: 8,
  meta: 9,
});
