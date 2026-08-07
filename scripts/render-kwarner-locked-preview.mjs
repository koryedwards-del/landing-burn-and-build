#!/usr/bin/env node
/** Preview: KWarner locked frame — always writes a NEW numbered PDF file (never overwrites). */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildKristiKwarnerPreviewPayload } from '../js/kwarnerLockedPreviewFixtures.js';
import { renderProgramReportKwarnerLockedPreview } from '../server/pdf/renderProgramReportKwarnerLockedPreview.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const samplesDir = path.join(root, 'docs/samples');
const artifactsDir = '/opt/cursor/artifacts';

const LOCKED_BASENAME = 'kwarner-locked-preview-kristi-';
const VEG_FRUIT_BASENAME = 'kwarner-preview-kristi-veg-fruit-v';
const LOCKED_RE = new RegExp(`^${LOCKED_BASENAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d+)\\.pdf$`);
const VEG_FRUIT_RE = new RegExp(`^${VEG_FRUIT_BASENAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d+)\\.pdf$`);

const LOCKED_MIN = 10;

function nextNumber(re, basename, min = 0) {
  let max = min;
  for (const entry of fs.readdirSync(samplesDir)) {
    const match = entry.match(re);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `${basename}${max + 1}.pdf`;
}

const lockedName = nextNumber(LOCKED_RE, LOCKED_BASENAME, LOCKED_MIN);
const vegFruitName = nextNumber(VEG_FRUIT_RE, VEG_FRUIT_BASENAME);
const buildLabel = new Date().toISOString().replace(/[:.]/g, '-');
const payload = buildKristiKwarnerPreviewPayload();
const pdf = await renderProgramReportKwarnerLockedPreview(payload, { buildLabel });

const lockedPath = path.join(samplesDir, lockedName);
const vegFruitPath = path.join(samplesDir, vegFruitName);
fs.writeFileSync(lockedPath, pdf);
fs.writeFileSync(vegFruitPath, pdf);

if (fs.existsSync(artifactsDir)) {
  fs.copyFileSync(lockedPath, path.join(artifactsDir, lockedName));
}

const md5 = crypto.createHash('md5').update(pdf).digest('hex');
const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;

const buildModule = `/** Auto-generated — node scripts/render-kwarner-locked-preview.mjs */
export const KWARNER_PREVIEW_BUILD = ${JSON.stringify(buildLabel)};
export const KWARNER_PREVIEW_MD5 = ${JSON.stringify(md5)};
export const KWARNER_LOCKED_PREVIEW_FILE = ${JSON.stringify(lockedName)};
export const KWARNER_VEG_FRUIT_FILE = ${JSON.stringify(vegFruitName)};
export const KWARNER_LOCKED_PREVIEW_PDF = '../docs/samples/' + ${JSON.stringify(lockedName)};

export function kwarnerPreviewPdfUrl() {
  return \`\${KWARNER_LOCKED_PREVIEW_PDF}?build=\${encodeURIComponent(KWARNER_PREVIEW_BUILD)}&md5=\${KWARNER_PREVIEW_MD5.slice(0, 8)}\`;
}
`;

fs.writeFileSync(path.join(root, 'js/kwarnerPreviewBuild.js'), buildModule);

console.log(`FILE ${lockedPath}`);
console.log(`FILE ${vegFruitPath}`);
if (fs.existsSync(artifactsDir)) {
  console.log(`FILE ${path.join(artifactsDir, lockedName)}`);
}
console.log(`${pages} page(s), ${pdf.length} bytes, md5=${md5}`);
