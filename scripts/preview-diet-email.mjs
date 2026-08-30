#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildDietEmailPreview } from '../server/dietEmail.js';
import {
  BURN_AND_BUILD_PURCHASE_EMAIL_PREVIEW_REPO_FILE,
} from '../js/dietEmailPreviewNamingHelpers.js';
import {
  BURN_AND_BUILD_PURCHASE_EMAIL_PREVIEW_DOWNLOAD_URL,
  BURN_AND_BUILD_PURCHASE_EMAIL_PREVIEW_URL,
} from '../js/siteUrls.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sampleFile = path.join(root, 'docs/samples', BURN_AND_BUILD_PURCHASE_EMAIL_PREVIEW_REPO_FILE);
const siteFile = path.join(root, 'purchase-email-preview', 'index.html');

const preview = buildDietEmailPreview();
const html = preview.html;
fs.mkdirSync(path.dirname(sampleFile), { recursive: true });
fs.mkdirSync(path.dirname(siteFile), { recursive: true });
fs.writeFileSync(sampleFile, html);
fs.writeFileSync(siteFile, html);

const stat = fs.statSync(siteFile);
console.log(`OK ${siteFile} (${stat.size} bytes)`);
console.log(`SUBJECT ${preview.subject}`);
console.log(`VIEW ${BURN_AND_BUILD_PURCHASE_EMAIL_PREVIEW_URL}`);
console.log(`DOWNLOAD ${BURN_AND_BUILD_PURCHASE_EMAIL_PREVIEW_DOWNLOAD_URL}`);
