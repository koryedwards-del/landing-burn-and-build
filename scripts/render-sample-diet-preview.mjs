#!/usr/bin/env node
/** Preview + delivery build: B&B Sample Diet PDF (b&bsamplediet.pdf). */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildSampleDietPreviewPayload } from '../js/sampleDietPrintoutData.js';
import { renderSampleDietPrintout } from '../server/pdf/renderSampleDietPrintout.js';

export const SAMPLE_DIET_FILENAME = 'b&bsamplediet.pdf';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const samplesDir = path.join(root, 'docs/samples');
const artifactsDir = '/opt/cursor/artifacts';
const GITHUB_REPO = 'koryedwards-del/landing-burn-and-build';
const GITHUB_BRANCH = 'main';
const GITHUB_RAW = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/docs/samples`;

const buildLabel = new Date().toISOString().replace(/[:.]/g, '-');
const payload = buildSampleDietPreviewPayload();
const pdf = await renderSampleDietPrintout(payload, { buildLabel });

const samplePath = path.join(samplesDir, SAMPLE_DIET_FILENAME);
fs.writeFileSync(samplePath, pdf);

if (fs.existsSync(artifactsDir)) {
  fs.copyFileSync(samplePath, path.join(artifactsDir, SAMPLE_DIET_FILENAME));
}

const md5 = crypto.createHash('md5').update(pdf).digest('hex');
const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
const downloadUrl = `${GITHUB_RAW}/${encodeURIComponent(SAMPLE_DIET_FILENAME)}`;

console.log(`FILE ${samplePath}`);
if (fs.existsSync(artifactsDir)) {
  console.log(`FILE ${path.join(artifactsDir, SAMPLE_DIET_FILENAME)}`);
}
console.log(`${pages} page(s), ${pdf.length} bytes, md5=${md5}`);
console.log(`DOWNLOAD ${downloadUrl}`);
