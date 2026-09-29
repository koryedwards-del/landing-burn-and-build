/** Canonical GitHub Pages origin for checkout return URLs (Stripe success/cancel). */

import { CREATOR_HOST_ORIGIN } from '../js/siteUrls.js';

const LEGACY_SITE = /burnandbuilddiet\.com/i;

/** Allowed static-site origins (must match CORS allowlist in server/index.js). */
export const CREATOR_SITE_ORIGINS = new Set([
  CREATOR_HOST_ORIGIN,
  'https://www.thehardkordiet.com',
  'https://burnandbuilddiet.com',
  'https://www.burnandbuilddiet.com',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
]);

function normalizeSiteOrigin(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const url = raw.includes('://') ? new URL(raw) : new URL(`https://${raw}`);
    return url.origin;
  } catch {
    return '';
  }
}

function mapLegacyToCanonical(origin) {
  if (!origin) return '';
  if (LEGACY_SITE.test(origin)) return CREATOR_HOST_ORIGIN;
  return origin;
}

/**
 * Origin embedded in Stripe Checkout success_url / cancel_url.
 * Never use the Render API host — customers must land on static creator site.
 */
export function resolveCreatorSiteOrigin(req, clientSiteOrigin) {
  const fromClient = mapLegacyToCanonical(normalizeSiteOrigin(clientSiteOrigin));
  if (fromClient && CREATOR_SITE_ORIGINS.has(fromClient)) {
    return fromClient;
  }

  const fromHeader = mapLegacyToCanonical(normalizeSiteOrigin(req?.get?.('origin')));
  if (fromHeader && CREATOR_SITE_ORIGINS.has(fromHeader)) {
    return fromHeader;
  }

  const fromEnv = mapLegacyToCanonical(
    normalizeSiteOrigin(process.env.WEBPAGE_URL || process.env.CREATOR_BASE_URL),
  );
  if (fromEnv && CREATOR_SITE_ORIGINS.has(fromEnv)) {
    return fromEnv;
  }

  return CREATOR_HOST_ORIGIN;
}

/** Public site origin for emails and portal links (no request context). */
export function resolvePublicSiteOrigin() {
  return resolveCreatorSiteOrigin(null, null);
}
