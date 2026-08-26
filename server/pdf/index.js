import { createPrintPdf, PrintPdfCreator } from './creator.js';
import { pdfError } from './errors.js';
import { renderProgramReportPdf } from './renderProgramReport.js';
import { validatePrintPayload, validatePrintView } from './validate.js';

export { createPrintPdf, PrintPdfCreator } from './creator.js';
export { PdfError, pdfError } from './errors.js';
export { assertPdfBuffer, sanitizePdfFilename } from './http.js';
export { validatePrintPayload, validatePrintView } from './validate.js';

export async function renderPrintPdf(view, { title, payload } = {}) {
  validatePrintView(view);
  if (view !== 'programreport') {
    throw pdfError(`PDF view not supported: ${view}`);
  }
  return renderProgramReportPdf(payload, { title: title || payload?.title });
}
