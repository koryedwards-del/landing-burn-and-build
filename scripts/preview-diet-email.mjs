#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildDietEmailPreview, DIET_EMAIL_PREVIEW_FILENAME } from '../server/dietEmail.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const previewDir = path.join(root, 'previews/diet-email');
const viewFile = path.join(previewDir, 'index.html');
const downloadFile = path.join(previewDir, DIET_EMAIL_PREVIEW_FILENAME);
const siteOrigin = String(
  process.env.WEBPAGE_URL || process.env.CREATOR_BASE_URL || 'https://burnandbuilddiet.com',
).replace(/\/$/, '');
const renderOrigin = String(
  process.env.DIET_PDF_DOWNLOAD_ORIGIN || 'https://program-creator-3tzd.onrender.com',
).replace(/\/$/, '');

const preview = buildDietEmailPreview();
fs.mkdirSync(previewDir, { recursive: true });
fs.writeFileSync(viewFile, preview.html);
fs.writeFileSync(downloadFile, preview.html);

const stat = fs.statSync(downloadFile);
console.log(`OK ${downloadFile} (${stat.size} bytes)`);
console.log(`SUBJECT ${preview.subject}`);
console.log(`VIEW ${siteOrigin}/previews/diet-email/`);
console.log(`DOWNLOAD ${siteOrigin}/previews/diet-email/${DIET_EMAIL_PREVIEW_FILENAME}`);
console.log(`API_DOWNLOAD ${renderOrigin}/api/samples/diet-email-preview?download=1`);
