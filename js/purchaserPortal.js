/** Purchaser return links — auto-restore diet download without re-entering details. */

import { CREATOR_CHECKOUT_URL, CREATOR_HOST_ORIGIN } from './siteUrls.js';
import { isValidEmail, normalizeEmail } from './programApi.js';

export function readPurchaserPortalParams(search = '') {
  const params = new URLSearchParams(
    search || (typeof location !== 'undefined' ? location.search : ''),
  );
  return {
    email: normalizeEmail(params.get('email') || ''),
    programId: String(params.get('program_id') || params.get('programId') || '').trim(),
    autoDownload: params.get('download') === '1',
  };
}

export function buildPurchaserPortalUrl(email, programId, { origin = CREATOR_HOST_ORIGIN } = {}) {
  const url = new URL(CREATOR_CHECKOUT_URL, origin);
  if (isValidEmail(email)) url.searchParams.set('email', normalizeEmail(email));
  const id = String(programId || '').trim();
  if (id) url.searchParams.set('program_id', id);
  return url.toString();
}

export function cleanPurchaserPortalQuery() {
  if (typeof history === 'undefined' || typeof location === 'undefined') return;
  const url = new URL(location.href);
  url.searchParams.delete('email');
  url.searchParams.delete('program_id');
  url.searchParams.delete('programId');
  url.searchParams.delete('download');
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}
