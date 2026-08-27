import { normalizeEmail } from './db.js';

const RENDER_API_ORIGIN = String(
  process.env.DIET_PDF_DOWNLOAD_ORIGIN || 'https://program-creator-3tzd.onrender.com',
).replace(/\/$/, '');

const SITE_ORIGIN = String(
  process.env.WEBPAGE_URL || process.env.CREATOR_BASE_URL || 'https://burnandbuilddiet.com',
).replace(/\/$/, '');

/** Direct download link — always renders the current program-report PDF. */
export function dietPdfDownloadUrl(email, programId) {
  const params = new URLSearchParams({
    email: normalizeEmail(email),
    program_id: String(programId || '').trim(),
  });
  return `${RENDER_API_ORIGIN}/api/programs/diet-pdf?${params}`;
}

/** Branded return page — email + program id auto-open the download screen. */
export function purchaserPortalUrl(email, programId) {
  const params = new URLSearchParams();
  const normalized = normalizeEmail(email);
  const id = String(programId || '').trim();
  if (normalized) params.set('email', normalized);
  if (id) params.set('program_id', id);
  const query = params.toString();
  return `${SITE_ORIGIN}/createyourfoodplan/${query ? `?${query}` : ''}`;
}

export function siteOrigin() {
  return SITE_ORIGIN;
}

/** Public logo URL for transactional email (hosted on GitHub Pages). */
export function brandLogoUrl() {
  return `${SITE_ORIGIN}/img/brand/bblogo1.png`;
}

export const SUPPORT_EMAIL = 'support@burnandbuilddiet.com';
