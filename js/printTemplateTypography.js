/**
 * Locked personalized print template — single typography scale.
 * PDF (PDFKit): values are points.
 * Web preview: css/print-template.css mirrors these as --print-* custom properties.
 */

/** Shared frame + body copy (pages 2–7 default). */
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
  titleTopGap: 28,
  titleBottomGap: 20,
  /** Macro / projection table header row (body × 1.5 × 0.75). */
  macroTableHead: 11.8125,
  /** Small footnotes (e.g. seasonings panel notes). */
  footnote: 10,
});

/** Welcome page (PDF page 1). */
export const PRINT_TEMPLATE_WELCOME = Object.freeze({
  introBody: 10.5,
  sectionTitle: 10.5,
  sectionBody: 9.5,
  lineGap: 2,
  paragraphGap: 6,
  headerGap: 4,
  sectionGap: 6,
});

/** Lean Body Analysis snapshot card (PDF page 2). */
export const PRINT_TEMPLATE_LBA_SNAPSHOT = Object.freeze({
  profileLabel: 7,
  profileValue: 9,
  todayTitle: 8,
  todayHead: 7.5,
  todayBody: 9.5,
});

/** Projected Progress bar (PDF page 2). */
export const PRINT_TEMPLATE_PROGRESS_BAR = Object.freeze({
  title: 11,
  subtitle: 8,
  capLabel: 8,
  category: 6,
  weightLabel: 9,
  markerLabel: 10,
  timelineLabel: 9,
  timelineBf: 11,
  footer: 9,
});

/** Food list staples (PDF pages 5–6). */
export const PRINT_TEMPLATE_FOOD_LIST = Object.freeze({
  sectionTitle: 11.5,
  stapleLine: 10.5,
});

/** Seasonings and Splashes (PDF page 7). */
export const PRINT_TEMPLATE_FLAVOR = Object.freeze({
  panelSectionTitle: 11.5,
  kitName: 10.5,
  bullet: 10.5,
  footnote: 10,
});

/** Legacy seminar header lines (older letterhead pages). */
export const PRINT_TEMPLATE_SEMINAR_HEADER = Object.freeze({
  contact: 8,
  meta: 9,
});
