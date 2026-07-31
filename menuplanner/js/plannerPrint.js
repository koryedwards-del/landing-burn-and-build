import {
  ASSET_VERSION as FALLBACK_ASSET_VERSION,
  FOODS_CATALOG_VERSION,
  PDF_PRINT_REVISIONS,
} from '../../js/assetVersion.js';
import { apiUrl } from '../../js/apiConfig.js';
import { printDocumentTitle } from './plannerPrintShell.js';
import { buildPlannerPrintPayload } from './plannerPrintPayload.js';
import { persistPlannerToProgram, state } from './plannerState.js';

/** Filled from live planner state via POST payload — not cacheable. */
const PDF_PERSONALIZED_VIEWS = new Set(['week', 'shopping']);

/** In-memory blob cache for static PDFs — avoids repeat network on reopen. */
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
  const params = new URLSearchParams({
    view,
    rev: pdfRevision(view),
  });
  if (title) params.set('title', title);
  return apiUrl(`/api/print/pdf?${params}`);
}

async function fetchPrintPdf(view, title) {
  if (PDF_PERSONALIZED_VIEWS.has(view)) {
    const payload = buildPlannerPrintPayload(view);
    if (!payload) {
      throw new Error('Could not build print payload.');
    }
    return fetch(apiUrl('/api/print/pdf'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        ...payload,
        title: title || payload.title,
      }),
    });
  }

  return fetch(pdfFetchUrl(view, title), { cache: 'no-store' });
}

function isPdfBlob(blob) {
  if (!blob || blob.size < 5) return false;
  return blob.type === 'application/pdf' || blob.type === '';
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
  if (!isPdfBlob(blob) || !(await readPdfHeader(blob))) {
    throw new Error('Could not load PDF.');
  }

  if (!PDF_PERSONALIZED_VIEWS.has(view)) {
    pdfBlobCache.set(cacheKey, blob);
  }

  return blob;
}

/** Call synchronously inside the Print Shop button click handler. */
export function openPrintTab() {
  try {
    const printWin = window.open('about:blank', '_blank');
    if (printWin && !printWin.closed) {
      return printWin;
    }
  } catch (_) {
    /* fall through to iframe print */
  }
  return null;
}

function showPdfInPrintWindow(blob, printWin) {
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

let printPdfFrame = null;

function printPdfViaHiddenFrame(blob, title) {
  const url = URL.createObjectURL(blob);

  printPdfFrame?.remove();
  printPdfFrame = document.createElement('iframe');
  printPdfFrame.setAttribute('aria-hidden', 'true');
  printPdfFrame.title = title || 'Print';
  Object.assign(printPdfFrame.style, {
    position: 'fixed',
    width: '0',
    height: '0',
    border: '0',
    visibility: 'hidden',
  });
  document.body.appendChild(printPdfFrame);

  const runPrint = () => {
    try {
      printPdfFrame.contentWindow?.focus();
      printPdfFrame.contentWindow?.print();
    } catch (_) {
      /* keep PDF loaded in frame */
    }
  };

  printPdfFrame.addEventListener('load', runPrint, { once: true });
  printPdfFrame.src = url;
  setTimeout(runPrint, 800);
  setTimeout(() => URL.revokeObjectURL(url), 120_000);
}

function deliverPdfForPrint(blob, { printWin, docTitle } = {}) {
  if (printWin && !printWin.closed) {
    showPdfInPrintWindow(blob, printWin);
    return;
  }
  printPdfViaHiddenFrame(blob, docTitle);
}

async function printPlannerDocument(view, { printWin, docTitle: presetTitle } = {}) {
  persistPlannerToProgram({ immediate: true });

  const docTitle = presetTitle || printDocumentTitle(view, state.programPackage);

  try {
    const blob = await loadPdfBlob(view, docTitle);
    if (printWin?.closed) {
      printWin = null;
    }
    deliverPdfForPrint(blob, { printWin, docTitle });
  } catch (err) {
    if (printWin && !printWin.closed) {
      printWin.close();
    }
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
      const view = button.dataset.printView;
      const docTitle = printDocumentTitle(view, state.programPackage);
      const printWin = openPrintTab();
      dialog.close();
      void printPlannerDocument(view, { printWin, docTitle });
    });
  });
}

function openPrintShop() {
  const dialog = document.getElementById('print-choice-dialog');
  if (dialog) {
    dialog.showModal();
    return;
  }
  const printWin = openPrintTab();
  void printPlannerDocument('week', { printWin });
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
