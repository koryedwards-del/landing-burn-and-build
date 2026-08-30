/**
 * Standalone FAQ handbook PDF — linked from purchase email, not bundled in the diet PDF.
 */
import { createPrintPdf } from './creator.js';
import { stamp1982Footers } from './draw1982Frame.js';
import { drawModernFaqPages } from './drawModernFaqPage.js';

export const HANDBOOK_FAQ_PRINTOUT_MIN_PAGES = 4;

export function validateHandbookFaqPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Handbook FAQ printout requires a payload object.');
  }
  if (payload.view !== 'handbookfaq') {
    throw new Error(`Expected view handbookfaq, got ${payload.view}`);
  }
  if (!payload.faq?.items?.length) {
    throw new Error('Handbook FAQ printout requires faq.items.');
  }
  return payload;
}

export async function renderHandbookFaqPrintout(payload) {
  validateHandbookFaqPayload(payload);

  const creator = createPrintPdf({
    title: payload.title || 'Burn & Build FAQ Handbook',
    author: 'Burn & Build Diet',
  });
  const doc = creator.doc;

  drawModernFaqPages(doc, payload);
  stamp1982Footers(doc, payload.header);

  const buffer = await creator.finish({ stampPageNumbers: false });
  const pages = (buffer.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  if (pages < HANDBOOK_FAQ_PRINTOUT_MIN_PAGES) {
    throw new Error(`Handbook FAQ printout expected at least ${HANDBOOK_FAQ_PRINTOUT_MIN_PAGES} pages, got ${pages}`);
  }
  return buffer;
}
