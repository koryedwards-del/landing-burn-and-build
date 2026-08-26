import { createPrintPdf, PrintPdfCreator } from './creator.js';
import { pdfError } from './errors.js';
import { renderProgramReportPdf } from './renderProgramReport.js';
import { validatePrintPayload, validatePrintView } from './validate.js';

export { createPrintPdf, PrintPdfCreator } from './creator.js';
export { PdfError, pdfError } from './errors.js';
export { assertPdfBuffer, sanitizePdfFilename } from './http.js';
export { validatePrintPayload, validatePrintView } from './validate.js';
export {
  isPersonalizedPrintShopView as isPersonalizedPdfView,
  isPrintShopView as isPdfView,
  isStaticPrintShopBody as isStaticPdfBodyView,
  PRINT_SHOP_PERSONALIZED_VIEW_SET as PDF_PERSONALIZED_VIEWS,
  PRINT_SHOP_STATIC_BODY_VIEW_SET as STATIC_PDF_BODY_VIEWS,
  PRINT_SHOP_VIEW_SET as PDF_VIEWS,
} from '../../js/printShopViews.js';

const RENDERERS = Object.freeze({
  programreport: renderProgramReportPdf,
});

export async function renderPrintPdf(view, { title, payload } = {}) {
  validatePrintView(view);

  const render = RENDERERS[view];
  if (!render) {
    throw pdfError(`PDF view not supported: ${view}`);
  }

  return render(payload, { title: title || payload?.title });
}
