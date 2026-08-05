import { FOODS_CATALOG_VERSION } from '../../js/assetVersion.js';
import {
  isPersonalizedPdfView,
  isPdfView,
  isStaticPdfBodyView,
  PDF_PERSONALIZED_VIEWS,
} from './constants.js';
import { createPrintPdf, PrintPdfCreator } from './creator.js';
import { pdfError } from './errors.js';
import { renderBestResultsPdf } from './renderBestResults.js';
import { renderFaqPdf } from './renderFaq.js';
import { renderFoodListPdf } from './renderFoodList.js';
import { renderShoppingListPdf } from './renderShoppingList.js';
import { renderProgramReportPdf } from './renderProgramReport.js';
import { renderWeekPlanPdf } from './renderWeekPlan.js';
import { validatePrintPayload, validatePrintView } from './validate.js';

export { createPrintPdf, PrintPdfCreator } from './creator.js';
export { PdfError, pdfError } from './errors.js';
export { sendPrintPdfError, sendPrintPdfResponse } from './http.js';
export { validatePrintPayload, validatePrintView } from './validate.js';
export {
  isPersonalizedPdfView,
  isPdfView,
  isStaticPdfBodyView as isStaticPdfView,
  PDF_PERSONALIZED_VIEWS,
} from './constants.js';

const RENDERERS = Object.freeze({
  faq: renderFaqPdf,
  foodlist: renderFoodListPdf,
  bestresults: renderBestResultsPdf,
  week: renderWeekPlanPdf,
  shopping: renderShoppingListPdf,
  programreport: renderProgramReportPdf,
});

/** Bump when layout changes so Render cache cannot serve stale PDFs. */
const STATIC_BODY_CACHE_KEYS = Object.freeze({
  faq: 'faq:frame:v3',
  bestresults: 'bestresults:v5',
});

const pdfBodyCache = new Map();

function catalogAwareCacheKey(view) {
  if (view === 'foodlist') return `${view}:${FOODS_CATALOG_VERSION}`;
  return view;
}

export async function renderPrintPdf(view, { title, payload } = {}) {
  validatePrintView(view);

  const render = RENDERERS[view];
  if (!render) {
    throw pdfError(`PDF view not supported: ${view}`);
  }

  if (PDF_PERSONALIZED_VIEWS.has(view)) {
    validatePrintPayload(view, payload);
    return render(payload, { title: title || payload.title });
  }

  if (isStaticPdfBodyView(view)) {
    const cacheKey = STATIC_BODY_CACHE_KEYS[view] || view;
    if (title) {
      return render({ title });
    }
    let cached = pdfBodyCache.get(cacheKey);
    if (!cached) {
      cached = await render({});
      pdfBodyCache.set(cacheKey, cached);
    }
    return cached;
  }

  const cacheKey = catalogAwareCacheKey(view);
  let cached = pdfBodyCache.get(cacheKey);
  if (!cached) {
    cached = await render({ title: title || undefined });
    pdfBodyCache.set(cacheKey, cached);
  }
  return cached;
}
