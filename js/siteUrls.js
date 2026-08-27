/** Canonical site URLs — burnandbuilddiet.com */

import { RENDER_API_ORIGIN } from './apiConfig.js';

export const CREATOR_HOST_ORIGIN = 'https://burnandbuilddiet.com';

/** New program — questionnaire. */
export const QUESTIONNAIRE_START_PATH = '/questionnaire/';
export const QUESTIONNAIRE_WELCOME_URL = `${CREATOR_HOST_ORIGIN}${QUESTIONNAIRE_START_PATH}`;
export const CREATOR_CHECKOUT_URL = `${CREATOR_HOST_ORIGIN}/createyourfoodplan/`;
export const PRIVACY_POLICY_URL = `${CREATOR_HOST_ORIGIN}/privacypolicy/`;
export const SUPPORT_URL = `${CREATOR_HOST_ORIGIN}/support/`;
/** One-tap download pages — redirect to API attachment URLs (Safari saves to Downloads). */
export const SAMPLE_DIET_DOWNLOAD_URL = `${CREATOR_HOST_ORIGIN}/download/sample-diet/`;
export const MENU_PLAN_TEMPLATE_DOWNLOAD_URL = `${CREATOR_HOST_ORIGIN}/download/menu-plan-template/`;

/** Legacy direct PDF paths — Safari opens inline; prefer download URLs above. */
export const MENU_PLAN_TEMPLATE_URL = MENU_PLAN_TEMPLATE_DOWNLOAD_URL;

export const SAMPLE_DIET_ATTACHMENT_URL = `${RENDER_API_ORIGIN}/api/samples/sample-diet`;
export const MENU_PLAN_TEMPLATE_ATTACHMENT_URL = `${RENDER_API_ORIGIN}/api/samples/menu-plan-template`;
