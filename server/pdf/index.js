import { FOODS_CATALOG_VERSION } from '../../js/assetVersion.js';
import { PDF_PERSONALIZED_VIEWS, PDF_VIEWS } from './constants.js';
import { renderBestResultsPdf } from './renderBestResults.js';
import { renderFaqPdf } from './renderFaq.js';
import { renderFoodListPdf } from './renderFoodList.js';
import { renderShoppingListPdf } from './renderShoppingList.js';
import { renderWeekPlanPdf } from './renderWeekPlan.js';

const RENDERERS = {
  faq: renderFaqPdf,
  foodlist: renderFoodListPdf,
  bestresults: renderBestResultsPdf,
  week: renderWeekPlanPdf,
  shopping: renderShoppingListPdf,
};

/** Static print bodies (same bytes for every client); title only affects metadata/filename. */
const STATIC_PDF_VIEWS = new Set(['faq', 'bestresults']);

/** Bump bestresults when layout changes so Render cache cannot serve stale multi-page PDFs. */
const STATIC_PDF_CACHE_KEYS = {
  faq: 'faq',
  bestresults: 'bestresults:v5',
};

const pdfBodyCache = new Map();

function catalogAwareCacheKey(view) {
  if (view === 'foodlist') return `${view}:${FOODS_CATALOG_VERSION}`;
  return view;
}

export function isPdfView(view) {
  return PDF_VIEWS.has(view);
}

export function isStaticPdfView(view) {
  return STATIC_PDF_VIEWS.has(view);
}

export function isPersonalizedPdfView(view) {
  return PDF_PERSONALIZED_VIEWS.has(view);
}

export async function renderPrintPdf(view, { title, payload } = {}) {
  const render = RENDERERS[view];
  if (!render) {
    const err = new Error(`PDF view not supported: ${view}`);
    err.status = 400;
    throw err;
  }

  if (PDF_PERSONALIZED_VIEWS.has(view)) {
    if (!payload || typeof payload !== 'object') {
      const err = new Error(`Personalized PDF view requires payload: ${view}`);
      err.status = 400;
      throw err;
    }
    return render(payload, { title: title || payload.title });
  }

  if (STATIC_PDF_VIEWS.has(view)) {
    const cacheKey = STATIC_PDF_CACHE_KEYS[view] || view;
    if (title) {
      // Personalized Title metadata — body is the same; do not serve cached generic title.
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
