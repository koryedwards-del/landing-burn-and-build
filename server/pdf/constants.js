/** Shared program report PDF settings. */
export { PROGRAM_REPORT_VIEW_SET as PDF_VIEWS } from '../../js/programReportViews.js';
export { isProgramReportView as isPdfView } from '../../js/programReportViews.js';

/** Optimized for PDF embed (~40KB); full bblogo1.png is ~2MB and slows open/print. */
export const PDF_LOGO_REL = 'img/brand/bblogo-pdf.jpg';

/** Match program report sheet padding (0.35in vertical, 0.44in horizontal). */
export const PDF_MARGIN = {
  top: 0.35 * 72,
  bottom: 0.35 * 72,
  left: 0.44 * 72,
  right: 0.44 * 72,
};
