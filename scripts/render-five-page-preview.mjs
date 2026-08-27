#!/usr/bin/env node
/** Preview: B&B 5-page sample-female — new numbered PDF each render. */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildKristiFivePagePreviewPayload } from '../js/fivePagePrintoutData.js';
import { renderFivePagePrintout } from '../server/pdf/renderFivePagePrintout.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const samplesDir = path.join(root, 'docs/samples');
const artifactsDir = '/opt/cursor/artifacts';
const GITHUB_REPO = 'koryedwards-del/landing-burn-and-build';
const GITHUB_BRANCH = 'main';
const GITHUB_RAW = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/docs/samples`;

const SAMPLE_BASENAME = 'bb-five-page-sample-female-';
const SAMPLE_RE = new RegExp(`^${SAMPLE_BASENAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d+)\\.pdf$`);
const SAMPLE_MIN = 1;

function nextSampleNumber() {
  let max = SAMPLE_MIN - 1;
  for (const entry of fs.readdirSync(samplesDir)) {
    const match = entry.match(SAMPLE_RE);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return max + 1;
}

const sampleName = `${SAMPLE_BASENAME}${nextSampleNumber()}.pdf`;
const buildLabel = new Date().toISOString().replace(/[:.]/g, '-');
const payload = buildKristiFivePagePreviewPayload();
const pdf = await renderFivePagePrintout(payload, { buildLabel });

const samplePath = path.join(samplesDir, sampleName);
fs.writeFileSync(samplePath, pdf);

if (fs.existsSync(artifactsDir)) {
  fs.copyFileSync(samplePath, path.join(artifactsDir, sampleName));
}

const md5 = crypto.createHash('md5').update(pdf).digest('hex');
const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
const downloadUrl = `${GITHUB_RAW}/${sampleName}`;

console.log(`FILE ${samplePath}`);
if (fs.existsSync(artifactsDir)) {
  console.log(`FILE ${path.join(artifactsDir, sampleName)}`);
}
console.log(`${pages} page(s), ${pdf.length} bytes, md5=${md5}`);
console.log(`DOWNLOAD ${downloadUrl}`);
