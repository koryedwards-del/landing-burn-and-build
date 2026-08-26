/** Canonical site URLs — burnandbuilddiet.com */

export const MARKETING_ORIGIN = 'https://burnandbuilddiet.com';
export const CREATOR_HOST_ORIGIN = MARKETING_ORIGIN;

/** When true, hide questionnaire/checkout entry points; paid users use createyourfoodplan. */
export const DIET_CREATION_COMING_SOON = false;

/** Gated questionnaire visits redirect here (download portal for purchasers). */

/** URL param + session flag for internal testing while Coming Soon is on (?create=1). */
export const DIET_CREATION_TEST_PARAM = 'create';
const DIET_CREATION_TEST_STORAGE_KEY = 'bnb_diet_creation_test';

export function captureDietCreationTestBypass(search = '') {
  if (typeof sessionStorage === 'undefined') return false;
  const params = new URLSearchParams(
    search || (typeof location !== 'undefined' ? location.search : ''),
  );
  if (params.get(DIET_CREATION_TEST_PARAM) === '1' || params.has(DIET_CREATION_TEST_PARAM)) {
    try {
      sessionStorage.setItem(DIET_CREATION_TEST_STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    return true;
  }
  return false;
}

export function isDietCreationTestBypass() {
  if (typeof sessionStorage === 'undefined') return false;
  captureDietCreationTestBypass();
  try {
    return sessionStorage.getItem(DIET_CREATION_TEST_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/** True when public Coming Soon gate should block new program creation. */
export function isDietCreationGated() {
  return DIET_CREATION_COMING_SOON && !isDietCreationTestBypass();
}

export function withDietCreationTestParam(url) {
  if (!isDietCreationTestBypass()) return url;
  const base = typeof window !== 'undefined' ? window.location.origin : MARKETING_ORIGIN;
  const parsed = new URL(url, base);
  parsed.searchParams.set(DIET_CREATION_TEST_PARAM, '1');
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

/** Landing CTAs — questionnaire welcome only */
export const QUESTIONNAIRE_WELCOME_URL = `${CREATOR_HOST_ORIGIN}/questionnaire/#welcome`;

/** Paywall + checkout return (after questionnaire builds the program) */
export const CREATOR_CHECKOUT_URL = `${CREATOR_HOST_ORIGIN}/createyourfoodplan/`;

/** Landing and support links while new program creation is gated. */
export const PUBLIC_DIET_PORTAL_URL = CREATOR_CHECKOUT_URL;

/** Primary marketing CTA — questionnaire when open, download portal while gated. */
export function primaryCtaUrl() {
  return isDietCreationGated() ? PUBLIC_DIET_PORTAL_URL : QUESTIONNAIRE_WELCOME_URL;
}

/** Internal questionnaire entry — append ?create=1 for testing while gate is on. */
export const QUESTIONNAIRE_TEST_URL = `${CREATOR_HOST_ORIGIN}/questionnaire/?create=1`;
