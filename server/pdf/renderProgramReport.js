import { applyKwarnerLockedPayload } from '../../js/kwarnerLockedPayload.js';
import { validatePrintPayload } from './validate.js';
import { renderProgramReportKwarnerLockedPreview } from './renderProgramReportKwarnerLockedPreview.js';

/** Production program report — 2026 KWarner locked 6-page PDF. */
export async function renderProgramReportPdf(payload, { title } = {}) {
  const locked = applyKwarnerLockedPayload({ ...payload });
  validatePrintPayload('programreport', locked);
  return renderProgramReportKwarnerLockedPreview(locked, { title: title || locked.title });
}
