import {
  ASSET_VERSION as FALLBACK_ASSET_VERSION,
  FOODS_CATALOG_VERSION,
  PDF_PRINT_REVISIONS,
} from '../../js/assetVersion.js';
import { apiUrl } from '../../js/apiConfig.js';
import { printDocumentTitle } from './printShopConfig.js';
import { buildPlannerPrintPayload } from './plannerPrintPayload.js';
import { persistPlannerToProgram, state } from './plannerState.js';

const PDF_VIEWS = new Set(['faq', 'foodlist', 'bestresults', 'week', 'shopping']);
const PDF_PERSONALIZED_VIEWS = new Set(['week', 'shopping']);

/** In-memory blob cache for static PDFs. */
const pdfBlobCache = new Map();

const ASSET_VERSION = new URL(import.meta.url).searchParams.get('v') || FALLBACK_ASSET_VERSION;

function pdfRevision(view) {
  if (view === 'foodlist') return FOODS_CATALOG_VERSION;
  return PDF_PRINT_REVISIONS[view] || ASSET_VERSION;
}

function pdfBlobCacheKey(view) {
  return `${view}:${pdfRevision(view)}`;
}

function pdfFetchUrl(view, title) {
  const params = new URLSearchParams({ view, rev: pdfRevision(view) });
  if (title) params.set('title', title);
  return apiUrl(`/api/print/pdf?${params}`);
}

async function fetchPrintPdf(view, title) {
  if (PDF_PERSONALIZED_VIEWS.has(view)) {
    const payload = buildPlannerPrintPayload(view);
    if (!payload) throw new Error('Could not build print payload.');
    return fetch(apiUrl('/api/print/pdf'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ ...payload, title: title || payload.title }),
    });
  }
  return fetch(pdfFetchUrl(view, title), { cache: 'no-store' });
}

async function readPdfHeader(blob) {
  const header = await blob.slice(0, 5).text();
  return header.startsWith('%PDF-');
}

async function loadPdfBlob(view, title) {
  const cacheKey = pdfBlobCacheKey(view);
  if (!PDF_PERSONALIZED_VIEWS.has(view)) {
    const cached = pdfBlobCache.get(cacheKey);
    if (cached) return cached;
  }

  const res = await fetchPrintPdf(view, title);
  if (!res.ok) {
    let message = 'Could not generate PDF.';
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch (_) {
      /* ignore */
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  if (!blob?.size || blob.type !== 'application/pdf' && blob.type !== '') {
    throw new Error('Could not load PDF.');
  }
  if (!(await readPdfHeader(blob))) {
    throw new Error('Could not load PDF.');
  }

  if (!PDF_PERSONALIZED_VIEWS.has(view)) {
    pdfBlobCache.set(cacheKey, blob);
  }
  return blob;
}

/** Must run synchronously inside the Print Shop button click handler. */
function openPrintTab() {
  return window.open('about:blank', '_blank');
}

function showPdfInPrintTab(blob, printWin) {
  const url = URL.createObjectURL(blob);

  const runPrint = () => {
    try {
      printWin.focus();
      printWin.print();
    } catch (_) {
      /* user can print from the PDF tab */
    }
  };

  printWin.location.replace(url);
  printWin.addEventListener('load', runPrint, { once: true });
  setTimeout(runPrint, 800);
  setTimeout(() => URL.revokeObjectURL(url), 120_000);
}

async function printPlannerDocument(view, printWin) {
  if (!PDF_VIEWS.has(view)) return;

  persistPlannerToProgram({ immediate: true });
  const docTitle = printDocumentTitle(view, state.programPackage);

  if (!printWin || printWin.closed) {
    window.alert('Could not open a new tab. Allow new tabs for this site and try again.');
    return;
  }

  try {
    const blob = await loadPdfBlob(view, docTitle);
    if (printWin.closed) {
      window.alert('The print tab was closed before the PDF finished loading.');
      return;
    }
    showPdfInPrintTab(blob, printWin);
  } catch (err) {
    if (!printWin.closed) printWin.close();
    window.alert(err.message || 'Could not open PDF.');
  }
}

function initPrintChoiceDialog() {
  const dialog = document.getElementById('print-choice-dialog');
  if (!dialog || dialog.dataset.printChoiceInit) return;
  dialog.dataset.printChoiceInit = '1';

  dialog.querySelector('#print-choice-cancel')?.addEventListener('click', () => {
    dialog.close();
  });

  dialog.querySelectorAll('[data-print-view]').forEach((button) => {
    button.addEventListener('click', () => {
      const printWin = openPrintTab();
      dialog.close();
      void printPlannerDocument(button.dataset.printView, printWin);
    });
  });
}

function openPrintShop() {
  const dialog = document.getElementById('print-choice-dialog');
  if (dialog) {
    dialog.showModal();
    return;
  }
  void printPlannerDocument('week', openPrintTab());
}

function initPrintShop() {
  document.getElementById('print-shop-open')?.addEventListener('click', openPrintShop);
  initPrintChoiceDialog();
}

export {
  printPlannerDocument,
  initPrintChoiceDialog,
  openPrintShop,
  initPrintShop,
};
