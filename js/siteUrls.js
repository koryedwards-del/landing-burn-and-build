/** Canonical site URLs — burnandbuilddiet.com */

import { RENDER_API_ORIGIN } from './apiConfig.js';

export const CREATOR_HOST_ORIGIN = 'https://burnandbuilddiet.com';

/** New program — questionnaire. */
export const QUESTIONNAIRE_START_PATH = '/questionnaire/';
export const QUESTIONNAIRE_WELCOME_URL = `${CREATOR_HOST_ORIGIN}${QUESTIONNAIRE_START_PATH}`;
export const CREATOR_CHECKOUT_URL = `${CREATOR_HOST_ORIGIN}/createyourfoodplan/`;
export const PRIVACY_POLICY_URL = `${CREATOR_HOST_ORIGIN}/privacypolicy/`;
export const SUPPORT_URL = `${CREATOR_HOST_ORIGIN}/support/`;
/** Direct download — static sample on Render (see docs/samples/b&bsamplediet.pdf). */
export const SAMPLE_DIET_DOWNLOAD_URL = `${RENDER_API_ORIGIN}/api/samples/sample-diet`;
export const SAMPLE_DIET_INLINE_URL = `${SAMPLE_DIET_DOWNLOAD_URL}?inline=1`;
export const MENU_PLAN_WORKSHEET_PATH = '/menuplanworksheet/';
export const MENU_PLAN_WORKSHEET_PUBLIC_URL = `${CREATOR_HOST_ORIGIN}${MENU_PLAN_WORKSHEET_PATH}`;
export const MENU_PLAN_WORKSHEET_LINK_LABEL = 'burnandbuilddiet.com/menuplanworksheet';
export const MENU_PLAN_WORKSHEET_DOWNLOAD_URL = `${RENDER_API_ORIGIN}/api/samples/menu-plan-worksheet`;
export const HANDBOOK_FAQ_DOWNLOAD_URL = `${RENDER_API_ORIGIN}/api/samples/handbook-faq`;

/** User-facing short link — redirects to the API attachment download. */
export const MENU_PLAN_WORKSHEET_URL = MENU_PLAN_WORKSHEET_PUBLIC_URL;
