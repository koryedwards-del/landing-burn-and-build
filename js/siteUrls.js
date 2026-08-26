/** Canonical site URLs — burnandbuilddiet.com */

export const MARKETING_ORIGIN = 'https://burnandbuilddiet.com';
export const CREATOR_HOST_ORIGIN = MARKETING_ORIGIN;

/** When true, hide questionnaire entry points; paid users use /createyourfoodplan/ only. */
export const DIET_CREATION_COMING_SOON = false;

/** True when public Coming Soon gate should block new program creation. */
export function isDietCreationGated() {
  return DIET_CREATION_COMING_SOON;
}

/** Landing CTAs — questionnaire welcome */
export const QUESTIONNAIRE_WELCOME_URL = `${CREATOR_HOST_ORIGIN}/questionnaire/#welcome`;

/** Paywall + checkout return (after questionnaire builds the program) */
export const CREATOR_CHECKOUT_URL = `${CREATOR_HOST_ORIGIN}/createyourfoodplan/`;

/** Primary marketing CTA — questionnaire when open, download portal while gated. */
export function primaryCtaUrl() {
  return isDietCreationGated() ? CREATOR_CHECKOUT_URL : QUESTIONNAIRE_WELCOME_URL;
}
