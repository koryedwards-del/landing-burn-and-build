#!/usr/bin/env node
/** Active app code must use HARDKOR sample slugs — legacy aliases only in samplePdfDownloads. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { HARDKOR_FAQ_API_SLUG, HARDKOR_FAQ_REPO_FILE } from '../js/faqPdfNamingHelpers.js';
import { HARDKOR_PURCHASE_EMAIL_PREVIEW_API_SLUG, HARDKOR_PURCHASE_EMAIL_PREVIEW_REPO_FILE } from '../js/dietEmailPreviewNamingHelpers.js';
import { HARDKOR_MENU_PLAN_WORKSHEET_API_SLUG, HARDKOR_MENU_PLAN_WORKSHEET_REPO_FILE } from '../js/menuPlanWorksheetNamingHelpers.js';
import { HARDKOR_SAMPLE_DIET_API_SLUG, HARDKOR_SAMPLE_DIET_REPO_FILE } from '../js/sampleDietStaticNamingHelpers.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const forbidden = [
  'burn-and-build-faq',
  'burn-and-build-purchase-email',
  'b&bsamplediet.pdf',
  'burn-and-build-faq.pdf',
  'burn-and-build-purchase-email.html',
  '/api/samples/sample-diet',
  '/api/samples/menu-plan-worksheet',
];

const scanDirs = ['js', 'server', 'questionnaire', 'scripts', 'index.html', 'menuplanworksheet'];
const allowFiles = new Set([
  'server/samplePdfDownloads.js',
  'scripts/verify-hardkor-asset-slugs.mjs',
]);

function walk(rel) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) return;
  if (fs.statSync(abs).isFile()) {
    if (allowFiles.has(path.relative(root, abs))) return;
    checkFile(abs);
    return;
  }
  for (const name of fs.readdirSync(abs)) {
    if (name === 'node_modules') continue;
    walk(path.join(rel, name));
  }
}

function checkFile(abs) {
  const rel = path.relative(root, abs);
  if (allowFiles.has(rel)) return;
  const text = fs.readFileSync(abs, 'utf8');
  for (const token of forbidden) {
    if (text.includes(token)) {
      throw new Error(`Legacy asset reference "${token}" in ${rel}`);
    }
  }
}

for (const d of scanDirs) walk(d);

for (const file of [
  HARDKOR_SAMPLE_DIET_REPO_FILE,
  HARDKOR_MENU_PLAN_WORKSHEET_REPO_FILE,
  HARDKOR_FAQ_REPO_FILE,
  HARDKOR_PURCHASE_EMAIL_PREVIEW_REPO_FILE,
]) {
  const p = path.join(root, 'docs/samples', file);
  if (!fs.existsSync(p)) {
    throw new Error(`Missing docs/samples/${file}`);
  }
}

console.log('OK HARDKOR asset slugs', {
  sample: HARDKOR_SAMPLE_DIET_API_SLUG,
  menu: HARDKOR_MENU_PLAN_WORKSHEET_API_SLUG,
  faq: HARDKOR_FAQ_API_SLUG,
  purchaseEmail: HARDKOR_PURCHASE_EMAIL_PREVIEW_API_SLUG,
});
