import { applyProgramReportLockedCopy } from '../../js/programReportLockedPayload.js';
import { validatePrintPayload } from './validate.js';
import { renderProgramReportLockedPreview } from './renderProgramReportLockedPreview.js';

/** Production program report — Burn & Build Diet PDF. */
export async function renderProgramReportPdf(payload, { title } = {}) {
  const locked = applyProgramReportLockedCopy({ ...payload });
  validatePrintPayload('programreport', locked);
  return renderProgramReportLockedPreview(locked, { title: title || locked.title });
}
