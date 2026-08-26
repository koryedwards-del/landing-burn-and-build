/** Purchaser return links — auto-restore diet download without re-entering details. */

export function readPurchaserPortalParams(search = '') {
  const params = new URLSearchParams(
    search || (typeof location !== 'undefined' ? location.search : ''),
  );
  return {
    email: String(params.get('email') || '').trim().toLowerCase(),
    programId: String(params.get('program_id') || params.get('programId') || '').trim(),
    autoDownload: params.get('download') === '1',
  };
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
