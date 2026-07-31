import { PDF_VIEWS } from './constants.js';
import { renderFaqPdf } from './renderFaq.js';

const RENDERERS = {
  faq: renderFaqPdf,
};

export function isPdfView(view) {
  return PDF_VIEWS.has(view);
}

export async function renderPrintPdf(view, { title } = {}) {
  const render = RENDERERS[view];
  if (!render) {
    const err = new Error(`PDF view not supported: ${view}`);
    err.status = 400;
    throw err;
  }
  return render({ title });
}
