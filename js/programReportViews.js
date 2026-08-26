/** Program report PDF view registry — shared by client and server. */

export const PROGRAM_REPORT_VIEWS = Object.freeze(['programreport']);

export const PROGRAM_REPORT_VIEW_SET = new Set(PROGRAM_REPORT_VIEWS);

export function isProgramReportView(view) {
  return PROGRAM_REPORT_VIEW_SET.has(view);
}
