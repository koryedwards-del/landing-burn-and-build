#!/usr/bin/env node
/** Preview: B&B sample-female printout — writes one stable latest PDF only. */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildSampleFemalePreviewPayload } from '../js/sampleFemalePreviewFixtures.js';
import { renderSampleFemalePrintout } from '../server/pdf/renderProgramReportLockedPreview.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const samplesDir = path.join(root, 'docs/samples');
const artifactsDir = '/opt/cursor/artifacts';
const GITHUB_REPO = 'koryedwards-del/landing-burn-and-build';
const GITHUB_BRANCH = 'main';
const GITHUB_RAW = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/docs/samples`;
const LATEST_NAME = 'bb-five-page-sample-female-latest.pdf';

const buildLabel = new Date().toISOString().replace(/[:.]/g, '-');
const payload = buildSampleFemalePreviewPayload();
const pdf = await renderSampleFemalePrintout(payload, { buildLabel });

const latestPath = path.join(samplesDir, LATEST_NAME);
fs.writeFileSync(latestPath, pdf);

if (fs.existsSync(artifactsDir)) {
  fs.copyFileSync(latestPath, path.join(artifactsDir, LATEST_NAME));
}

const md5 = crypto.createHash('md5').update(pdf).digest('hex');
const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
const downloadUrl = `${GITHUB_RAW}/${LATEST_NAME}`;

console.log(`FILE ${latestPath}`);
if (fs.existsSync(artifactsDir)) {
  console.log(`FILE ${path.join(artifactsDir, LATEST_NAME)}`);
}
console.log(`${pages} page(s), ${pdf.length} bytes, md5=${md5}`);
console.log(`DOWNLOAD ${downloadUrl}`);
