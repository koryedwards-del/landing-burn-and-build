import fs from 'fs';
import path from 'path';

import {
  BURN_AND_BUILD_FAQ_API_SLUG,
  BURN_AND_BUILD_FAQ_DOWNLOAD_FILENAME,
  BURN_AND_BUILD_FAQ_REPO_FILE,
} from '../js/faqPdfNamingHelpers.js';
import { DIET_EMAIL_PREVIEW_FILENAME } from './dietEmail.js';

/** Public sample files served from docs/samples/. */
export const PUBLIC_SAMPLE_FILES = Object.freeze({
  'sample-diet': { file: 'b&bsamplediet.pdf', filename: 'b&bsamplediet.pdf', contentType: 'application/pdf' },
  'menu-plan-worksheet': { file: 'menu-plan-worksheet.pdf', filename: 'menu-plan-worksheet.pdf', contentType: 'application/pdf' },
  [BURN_AND_BUILD_FAQ_API_SLUG]: {
    file: BURN_AND_BUILD_FAQ_REPO_FILE,
    filename: BURN_AND_BUILD_FAQ_DOWNLOAD_FILENAME,
    contentType: 'application/pdf',
  },
  'purchase-email': {
    file: DIET_EMAIL_PREVIEW_FILENAME,
    filename: DIET_EMAIL_PREVIEW_FILENAME,
    contentType: 'text/html; charset=utf-8',
  },
});

/** @param {string} root @param {string} slug */
export function resolveSamplePdfPath(root, slug) {
  const spec = PUBLIC_SAMPLE_FILES[slug];
  if (!spec) return null;
  const filePath = path.join(root, 'docs/samples', spec.file);
  if (!fs.existsSync(filePath)) return null;
  return { spec, filePath };
}
