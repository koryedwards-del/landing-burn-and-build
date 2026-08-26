#!/usr/bin/env node
/** Preview: B&B sample-female printout (full personalized header every page). */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildSampleFemalePreviewPayload } from '../js/sampleFemalePreviewFixtures.js';
import { renderSampleFemalePrintout } from '../server/pdf/renderSampleFemalePrintout.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const samplesDir = path.join(root, 'docs/samples');
const artifactsDir = '/opt/cursor/artifacts';
const GITHUB_REPO = 'koryedwards-del/landing-burn-and-build';
const GITHUB_BRANCH = 'main';
const GITHUB_RAW = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/docs/samples`;
const LATEST_SAMPLE_NAME = 'bb-five-page-sample-female-latest.pdf';

const SAMPLE_BASENAME = 'bb-five-page-sample-female-';
const ARCHIVE_BASENAME = 'bb-five-page-sample-female-archive-v';
const SAMPLE_RE = new RegExp(`^${SAMPLE_BASENAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d+)\\.pdf$`);
const ARCHIVE_RE = new RegExp(`^${ARCHIVE_BASENAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d+)\\.pdf$`);

const SAMPLE_MIN = 1;

function nextNumber(re, basename, min = 0) {
  let max = min;
  for (const entry of fs.readdirSync(samplesDir)) {
    const match = entry.match(re);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `${basename}${max + 1}.pdf`;
}

const sampleName = nextNumber(SAMPLE_RE, SAMPLE_BASENAME, SAMPLE_MIN);
const archiveName = nextNumber(ARCHIVE_RE, ARCHIVE_BASENAME);
const buildLabel = new Date().toISOString().replace(/[:.]/g, '-');
const payload = buildSampleFemalePreviewPayload();
const pdf = await renderSampleFemalePrintout(payload, { buildLabel });

const samplePath = path.join(samplesDir, sampleName);
const archivePath = path.join(samplesDir, archiveName);
fs.writeFileSync(samplePath, pdf);
fs.writeFileSync(archivePath, pdf);
fs.writeFileSync(path.join(samplesDir, LATEST_SAMPLE_NAME), pdf);

if (fs.existsSync(artifactsDir)) {
  fs.copyFileSync(samplePath, path.join(artifactsDir, sampleName));
}

const md5 = crypto.createHash('md5').update(pdf).digest('hex');
const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;

console.log(`FILE ${samplePath}`);
console.log(`FILE ${archivePath}`);
if (fs.existsSync(artifactsDir)) {
  console.log(`FILE ${path.join(artifactsDir, sampleName)}`);
}
const downloadUrl = `${GITHUB_RAW}/${sampleName}`;
const latestDownloadUrl = `${GITHUB_RAW}/${LATEST_SAMPLE_NAME}`;
console.log(`${pages} page(s), ${pdf.length} bytes, md5=${md5}`);
console.log(`DOWNLOAD ${downloadUrl}`);
console.log(`DOWNLOAD_LATEST ${latestDownloadUrl}`);
