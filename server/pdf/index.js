import { PDF_VIEWS } from './constants.js';
import { renderFaqPdf } from './renderFaq.js';

const RENDERERS = {
  faq: renderFaqPdf,
};

/** Static print bodies (same bytes for every client); title only affects metadata/filename. */
const STATIC_PDF_VIEWS = new Set(['faq']);

const pdfBodyCache = new Map();

export function isPdfView(view) {
  return PDF_VIEWS.has(view);
}

export function isStaticPdfView(view) {
  return STATIC_PDF_VIEWS.has(view);
}

export async function renderPrintPdf(view, { title } = {}) {
  const render = RENDERERS[view];
  if (!render) {
    const err = new Error(`PDF view not supported: ${view}`);
    err.status = 400;
    throw err;
  }

  if (STATIC_PDF_VIEWS.has(view)) {
    let cached = pdfBodyCache.get(view);
    if (!cached) {
      cached = await render({ title: title || undefined });
      pdfBodyCache.set(view, cached);
    }
    return cached;
  }

  return render({ title: title || undefined });
}
