import {
  ASSET_VERSION as FALLBACK_ASSET_VERSION,
  FOODS_CATALOG_VERSION,
  PDF_PRINT_REVISIONS,
} from '../../js/assetVersion.js';
import { apiUrl } from '../../js/apiConfig.js';
import { isPersonalizedPrintShopView } from '../../js/printShopViews.js';
import { buildPlannerPrintPayload } from './plannerPrintPayload.js';

const ASSET_VERSION = new URL(import.meta.url).searchParams.get('v') || FALLBACK_ASSET_VERSION;

/** Static PDF bodies — safe to cache in memory for the session. */
const staticPdfBlobCache = new Map();

function pdfRevision(view) {
  if (view === 'foodlist') return FOODS_CATALOG_VERSION;
  return PDF_PRINT_REVISIONS[view] || ASSET_VERSION;
}

function cacheKey(view) {
  return `${view}:${pdfRevision(view)}`;
}

function staticPdfFetchUrl(view, title) {
  const params = new URLSearchParams({ view, rev: pdfRevision(view) });
  if (title) params.set('title', title);
  return apiUrl(`/api/print/pdf?${params}`);
}

async function fetchPrintPdf(view, title) {
  if (isPersonalizedPrintShopView(view)) {
    const payload = buildPlannerPrintPayload(view);
    if (!payload) {
      throw new Error('Could not build print payload.');
    }
    return fetch(apiUrl('/api/print/pdf'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ ...payload, title: title || payload.title }),
    });
  }

  return fetch(staticPdfFetchUrl(view, title), { cache: 'no-store' });
}

async function parsePdfErrorResponse(res) {
  let message = 'Could not generate PDF.';
  try {
    const body = await res.json();
    if (body?.message) message = body.message;
  } catch (_) {
    /* ignore */
  }
  return message;
}

async function readPdfHeader(blob) {
  const header = await blob.slice(0, 5).text();
  return header.startsWith('%PDF-');
}

function isPdfBlob(blob) {
  if (!blob?.size) return false;
  return blob.type === 'application/pdf' || blob.type === '';
}

/**
 * Fetch a Print Shop PDF from the API.
 * @returns {Promise<Blob>}
 */
export async function loadPrintPdfBlob(view, title) {
  if (!isPersonalizedPrintShopView(view)) {
    const cached = staticPdfBlobCache.get(cacheKey(view));
    if (cached) return cached;
  }

  const res = await fetchPrintPdf(view, title);
  if (!res.ok) {
    throw new Error(await parsePdfErrorResponse(res));
  }

  const blob = await res.blob();
  if (!isPdfBlob(blob) || !(await readPdfHeader(blob))) {
    throw new Error('Could not load PDF.');
  }

  if (!isPersonalizedPrintShopView(view)) {
    staticPdfBlobCache.set(cacheKey(view), blob);
  }

  return blob;
}
