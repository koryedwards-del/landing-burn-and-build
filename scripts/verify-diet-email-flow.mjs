/**
 * Purchase diet email — public URLs and idempotency (no Resend call).
 */
import { buildDietEmailPreview } from '../server/dietEmail.js';
import { resolvePublicSiteOrigin } from '../server/creatorSiteOrigin.js';
import { purchaserPortalUrl, brandLogoUrl, siteOrigin } from '../server/dietPdfUrls.js';

const LEGACY = /burnandbuilddiet\.com/i;
const CANONICAL = 'thehardkordiet.com';

function assertNoLegacy(label, url) {
  if (LEGACY.test(String(url))) {
    throw new Error(`${label} still uses legacy domain: ${url}`);
  }
}

process.env.WEBPAGE_URL = 'https://burnandbuilddiet.com';
const mappedOrigin = resolvePublicSiteOrigin();
if (mappedOrigin !== 'https://thehardkordiet.com') {
  throw new Error(`Expected legacy env mapped to HARDKOR origin, got ${mappedOrigin}`);
}

assertNoLegacy('siteOrigin()', siteOrigin());
assertNoLegacy('brandLogoUrl()', brandLogoUrl());
assertNoLegacy('purchaserPortalUrl()', purchaserPortalUrl('test@example.com', 'prog-1'));

const preview = buildDietEmailPreview({
  preferredName: 'Test',
  email: 'test@example.com',
  programId: 'prog-verify',
});

for (const [label, url] of [
  ['portalUrl', preview.html.match(/portal-link" href="([^"]+)"/)?.[1]],
  ['logoUrl', preview.html.match(/<img src="(https:[^"]+hardkor-logo)/)?.[1]],
]) {
  assertNoLegacy(label, url);
}

if (!preview.html.includes(CANONICAL)) {
  throw new Error('Preview HTML missing canonical site host');
}

if (!preview.html.includes('kory@thehardkordiet.com')) {
  throw new Error('Contact mailto must remain on burnandbuilddiet.com (intentional)');
}

console.log('Diet email flow verification OK');
