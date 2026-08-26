/**
 * Locked personalized print template — single typography scale.
 * PDF (PDFKit): values are points.
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
  sectionBody: 10.5,
  lineGap: 2,
  paragraphGap: 6,
  headerGap: 4,
  sectionGap: 6,
});

/** Lean Body Analysis snapshot card (PDF page 2). */
export const PRINT_TEMPLATE_LBA_SNAPSHOT = Object.freeze({
  profileLabel: 7,
  profileValue: 9,
  /** Numeric readouts on LBA page only (profile values, today %/lbs, bf/weight ranges). */
  dataValue: 11.5,
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
