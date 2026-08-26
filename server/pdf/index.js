import { createPrintPdf } from './creator.js';
import { renderProgramReportPdf } from './renderProgramReport.js';
import { validatePrintPayload, validatePrintView } from './validate.js';

export { createPrintPdf } from './creator.js';
export { PdfError, pdfError } from './errors.js';
export { assertPdfBuffer, sanitizePdfFilename } from './http.js';
export { validatePrintPayload, validatePrintView } from './validate.js';

export async function renderPrintPdf(view, { title, payload } = {}) {
  validatePrintView(view);
  return renderProgramReportPdf(payload, { title: title || payload?.title });
}
