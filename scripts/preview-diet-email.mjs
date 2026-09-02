#!/usr/bin/env node
import fs from 'fs';
import http from 'http';
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
const previewDir = path.join(root, 'purchase-email-preview');
const siteFile = path.join(previewDir, 'index.html');
const serve = process.argv.includes('--serve');
const port = Number(process.env.PREVIEW_PORT || 4173);

const preview = buildDietEmailPreview();
const html = preview.html;
fs.mkdirSync(path.dirname(sampleFile), { recursive: true });
fs.mkdirSync(previewDir, { recursive: true });
fs.writeFileSync(sampleFile, html);
fs.writeFileSync(siteFile, html);

const stat = fs.statSync(siteFile);
const inlineUrl = `${BURN_AND_BUILD_PURCHASE_EMAIL_PREVIEW_DOWNLOAD_URL}?inline=1`;
const localUrl = `http://127.0.0.1:${port}/`;

console.log(`OK ${siteFile} (${stat.size} bytes)`);
console.log(`SUBJECT ${preview.subject}`);
console.log(`PREVIEW ${inlineUrl}`);
console.log(`DOWNLOAD ${BURN_AND_BUILD_PURCHASE_EMAIL_PREVIEW_DOWNLOAD_URL}`);
console.log(`PAGES ${BURN_AND_BUILD_PURCHASE_EMAIL_PREVIEW_URL}`);
console.log('NOTE Do not open purchase-email-preview/index.html via file:// — use PREVIEW URL above or npm run preview:diet-email -- --serve');

if (!serve) {
  process.exit(0);
}

const server = http.createServer((req, res) => {
  const requestPath = decodeURIComponent(String(req.url || '/').split('?')[0]);
  if (requestPath === '/' || requestPath === '/index.html') {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(html);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
});

server.listen(port, '127.0.0.1', () => {
  console.log(`LOCAL ${localUrl}`);
  console.log('Press Ctrl+C to stop.');
});
