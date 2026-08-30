#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildDietEmailPreview, DIET_EMAIL_PREVIEW_FILENAME } from '../server/dietEmail.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const previewDir = path.join(root, 'previews/diet-email');
const sampleFile = path.join(root, 'docs/samples', DIET_EMAIL_PREVIEW_FILENAME);
const artifactFile = '/opt/cursor/artifacts/burn-and-build-purchase-email.html';
const viewFile = path.join(previewDir, 'index.html');
const downloadFile = path.join(previewDir, DIET_EMAIL_PREVIEW_FILENAME);
const siteOrigin = String(
  process.env.WEBPAGE_URL || process.env.CREATOR_BASE_URL || 'https://burnandbuilddiet.com',
).replace(/\/$/, '');
const renderOrigin = String(
  process.env.DIET_PDF_DOWNLOAD_ORIGIN || 'https://program-creator-3tzd.onrender.com',
).replace(/\/$/, '');

const preview = buildDietEmailPreview();
const html = preview.html;
fs.mkdirSync(previewDir, { recursive: true });
fs.mkdirSync(path.dirname(sampleFile), { recursive: true });
fs.mkdirSync(path.dirname(artifactFile), { recursive: true });
for (const file of [viewFile, downloadFile, sampleFile, artifactFile]) {
  fs.writeFileSync(file, html);
}

const stat = fs.statSync(sampleFile);
console.log(`OK ${sampleFile} (${stat.size} bytes)`);
console.log(`SUBJECT ${preview.subject}`);
console.log(`ARTIFACT ${artifactFile}`);
console.log(`DOWNLOAD ${renderOrigin}/api/samples/purchase-email`);
