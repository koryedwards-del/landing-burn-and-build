#!/usr/bin/env node
/** Blank printable menu plan template (single page). */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { renderMenuPlanTemplate } from '../server/pdf/renderSampleDietPrintout.js';

const TEMPLATE_FILENAME = 'menu-plan-template.pdf';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const samplesDir = path.join(root, 'docs/samples');
const artifactsDir = '/opt/cursor/artifacts';
const GITHUB_REPO = 'koryedwards-del/landing-burn-and-build';
const GITHUB_BRANCH = 'main';
const GITHUB_RAW = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/docs/samples`;

const pdf = await renderMenuPlanTemplate();
const templatePath = path.join(samplesDir, TEMPLATE_FILENAME);
fs.writeFileSync(templatePath, pdf);

if (fs.existsSync(artifactsDir)) {
  fs.copyFileSync(templatePath, path.join(artifactsDir, TEMPLATE_FILENAME));
}

const md5 = crypto.createHash('md5').update(pdf).digest('hex');
const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
const downloadUrl = `${GITHUB_RAW}/${encodeURIComponent(TEMPLATE_FILENAME)}`;
const curlCmd = `curl -L -o ~/Downloads/menu-plan-template.pdf "${downloadUrl}"`;

console.log(`FILE ${templatePath}`);
if (fs.existsSync(artifactsDir)) {
  console.log(`FILE ${path.join(artifactsDir, TEMPLATE_FILENAME)}`);
}
console.log(`${pages} page(s), ${pdf.length} bytes, md5=${md5}`);
console.log(`DOWNLOAD ${downloadUrl}`);
console.log(`CURL ${curlCmd}`);
