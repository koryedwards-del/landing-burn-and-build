import fs from 'fs';
import path from 'path';

import {
  HARDKOR_FAQ_API_SLUG,
  HARDKOR_FAQ_DOWNLOAD_FILENAME,
  HARDKOR_FAQ_REPO_FILE,
} from '../js/faqPdfNamingHelpers.js';
import {
  HARDKOR_PURCHASE_EMAIL_PREVIEW_API_SLUG,
  HARDKOR_PURCHASE_EMAIL_PREVIEW_DOWNLOAD_FILENAME,
  HARDKOR_PURCHASE_EMAIL_PREVIEW_REPO_FILE,
} from '../js/dietEmailPreviewNamingHelpers.js';
import {
  HARDKOR_MENU_PLAN_WORKSHEET_API_SLUG,
  HARDKOR_MENU_PLAN_WORKSHEET_DOWNLOAD_FILENAME,
  HARDKOR_MENU_PLAN_WORKSHEET_REPO_FILE,
} from '../js/menuPlanWorksheetNamingHelpers.js';
import {
  HARDKOR_SAMPLE_DIET_API_SLUG,
  HARDKOR_SAMPLE_DIET_DOWNLOAD_FILENAME,
  HARDKOR_SAMPLE_DIET_REPO_FILE,
} from '../js/sampleDietStaticNamingHelpers.js';
import {
  HARDKOR_SAMPLE_DIET_TEST_API_SLUG,
  HARDKOR_SAMPLE_DIET_TEST_DOWNLOAD_FILENAME,
  HARDKOR_SAMPLE_DIET_TEST_REPO_FILE,
} from '../js/hardkorSampleDietTestPdfNamingHelpers.js';

/** Old slugs/filenames — HTTP alias only (emails/bookmarks); not used in app code. */
export const LEGACY_SAMPLE_SLUG_ALIASES = Object.freeze({
  'sample-diet': HARDKOR_SAMPLE_DIET_API_SLUG,
  'menu-plan-worksheet': HARDKOR_MENU_PLAN_WORKSHEET_API_SLUG,
  'burn-and-build-faq': HARDKOR_FAQ_API_SLUG,
  'burn-and-build-purchase-email': HARDKOR_PURCHASE_EMAIL_PREVIEW_API_SLUG,
});

export function normalizeSampleSlug(slug) {
  const key = String(slug || '').trim();
  return LEGACY_SAMPLE_SLUG_ALIASES[key] || key;
}

/** Public sample files served from docs/samples/. */
export const PUBLIC_SAMPLE_FILES = Object.freeze({
  [HARDKOR_SAMPLE_DIET_API_SLUG]: {
    file: HARDKOR_SAMPLE_DIET_REPO_FILE,
    filename: HARDKOR_SAMPLE_DIET_DOWNLOAD_FILENAME,
    contentType: 'application/pdf',
  },
  [HARDKOR_MENU_PLAN_WORKSHEET_API_SLUG]: {
    file: HARDKOR_MENU_PLAN_WORKSHEET_REPO_FILE,
    filename: HARDKOR_MENU_PLAN_WORKSHEET_DOWNLOAD_FILENAME,
    contentType: 'application/pdf',
  },
  [HARDKOR_FAQ_API_SLUG]: {
    file: HARDKOR_FAQ_REPO_FILE,
    filename: HARDKOR_FAQ_DOWNLOAD_FILENAME,
    contentType: 'application/pdf',
  },
  [HARDKOR_PURCHASE_EMAIL_PREVIEW_API_SLUG]: {
    file: HARDKOR_PURCHASE_EMAIL_PREVIEW_REPO_FILE,
    filename: HARDKOR_PURCHASE_EMAIL_PREVIEW_DOWNLOAD_FILENAME,
    contentType: 'text/html; charset=utf-8',
  },
  [HARDKOR_SAMPLE_DIET_TEST_API_SLUG]: {
    file: HARDKOR_SAMPLE_DIET_TEST_REPO_FILE,
    filename: HARDKOR_SAMPLE_DIET_TEST_DOWNLOAD_FILENAME,
    contentType: 'application/pdf',
  },
});

/** @param {string} root @param {string} slug */
export function resolveSamplePdfPath(root, slug) {
  const spec = PUBLIC_SAMPLE_FILES[normalizeSampleSlug(slug)];
  if (!spec) return null;
  const filePath = path.join(root, 'docs/samples', spec.file);
  if (!fs.existsSync(filePath)) return null;
  return { spec, filePath };
}
