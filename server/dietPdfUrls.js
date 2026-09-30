import { CONTACT_EMAIL } from '../js/contactEmailData.js';
import { normalizeEmail } from './db.js';
import { HARDKOR_FAQ_DOWNLOAD_URL, MENU_PLAN_WORKSHEET_DOWNLOAD_URL, MENU_PLAN_WORKSHEET_URL } from '../js/siteUrls.js';
import { resolvePublicSiteOrigin } from './creatorSiteOrigin.js';

const RENDER_API_ORIGIN = String(
  process.env.DIET_PDF_DOWNLOAD_ORIGIN || 'https://program-creator-3tzd.onrender.com',
).replace(/\/$/, '');

function publicSiteOrigin() {
  return resolvePublicSiteOrigin();
}

/** Direct download link — always renders the current Burn & Build Diet PDF. */
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
  return `${publicSiteOrigin()}/createyourfoodplan/${query ? `?${query}` : ''}`;
}

export function siteOrigin() {
  return publicSiteOrigin();
}

/** Public logo URL for transactional email (hosted on GitHub Pages). */
export function brandLogoUrl() {
  return `${publicSiteOrigin()}/img/brand/hardkor-logo-2026.png`;
}

export function menuPlanWorksheetUrl() {
  return MENU_PLAN_WORKSHEET_URL;
}

export function menuPlanWorksheetDownloadUrl() {
  return MENU_PLAN_WORKSHEET_DOWNLOAD_URL;
}

export function burnAndBuildFaqUrl() {
  return HARDKOR_FAQ_DOWNLOAD_URL;
}

/** Purchase autosend email — footer contact + Resend reply_to. */
export const PURCHASE_EMAIL_CONTACT = CONTACT_EMAIL;
