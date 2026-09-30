/** Canonical site URLs — thehardkordiet.com */

import { RENDER_API_ORIGIN } from './apiConfig.js';
import { HARDKOR_FAQ_API_SLUG } from './faqPdfNamingHelpers.js';
import {
  HARDKOR_PURCHASE_EMAIL_PREVIEW_API_SLUG,
  HARDKOR_PURCHASE_EMAIL_PREVIEW_PATH,
} from './dietEmailPreviewNamingHelpers.js';
import { HARDKOR_MENU_PLAN_WORKSHEET_API_SLUG } from './menuPlanWorksheetNamingHelpers.js';
import { HARDKOR_SAMPLE_DIET_API_SLUG } from './sampleDietStaticNamingHelpers.js';
import { HARDKOR_SAMPLE_DIET_TEST_API_SLUG } from './hardkorSampleDietTestPdfNamingHelpers.js';

export const CREATOR_HOST_ORIGIN = 'https://thehardkordiet.com';

/** New program — questionnaire. */
export const QUESTIONNAIRE_START_PATH = '/questionnaire/';
export const QUESTIONNAIRE_WELCOME_URL = `${CREATOR_HOST_ORIGIN}${QUESTIONNAIRE_START_PATH}`;
export const CREATOR_CHECKOUT_URL = `${CREATOR_HOST_ORIGIN}/createyourfoodplan/`;
export const PRIVACY_POLICY_URL = `${CREATOR_HOST_ORIGIN}/privacypolicy/`;
export const CONTACT_URL = `${CREATOR_HOST_ORIGIN}/contact/`;
/** Direct download — static sample on Render (see docs/samples/hardkor-sample-diet.pdf). */
export const SAMPLE_DIET_DOWNLOAD_URL = `${RENDER_API_ORIGIN}/api/samples/${HARDKOR_SAMPLE_DIET_API_SLUG}`;
export const SAMPLE_DIET_INLINE_URL = `${SAMPLE_DIET_DOWNLOAD_URL}?inline=1`;
export const MENU_PLAN_WORKSHEET_PATH = '/menuplanworksheet/';
export const MENU_PLAN_WORKSHEET_PUBLIC_URL = `${CREATOR_HOST_ORIGIN}${MENU_PLAN_WORKSHEET_PATH}`;
export const MENU_PLAN_WORKSHEET_LINK_LABEL = 'thehardkordiet.com/menuplanworksheet';
export const MENU_PLAN_WORKSHEET_DOWNLOAD_URL = `${RENDER_API_ORIGIN}/api/samples/${HARDKOR_MENU_PLAN_WORKSHEET_API_SLUG}`;
export const HARDKOR_FAQ_DOWNLOAD_URL = `${RENDER_API_ORIGIN}/api/samples/${HARDKOR_FAQ_API_SLUG}`;
export const HARDKOR_PURCHASE_EMAIL_PREVIEW_URL = `${CREATOR_HOST_ORIGIN}${HARDKOR_PURCHASE_EMAIL_PREVIEW_PATH}`;
export const HARDKOR_PURCHASE_EMAIL_PREVIEW_DOWNLOAD_URL = `${RENDER_API_ORIGIN}/api/samples/${HARDKOR_PURCHASE_EMAIL_PREVIEW_API_SLUG}`;
export const HARDKOR_SAMPLE_DIET_TEST_DOWNLOAD_URL = `${RENDER_API_ORIGIN}/api/samples/${HARDKOR_SAMPLE_DIET_TEST_API_SLUG}`;

/** User-facing short link — redirects to the API attachment download. */
export const MENU_PLAN_WORKSHEET_URL = MENU_PLAN_WORKSHEET_PUBLIC_URL;
