#!/usr/bin/env node
/** Blank printable Menu Plan worksheet (single page). */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { renderMenuPlanTemplate } from '../server/pdf/renderSampleDietPrintout.js';
import { MENU_PLAN_WORKSHEET_DOWNLOAD_URL } from '../js/siteUrls.js';

const WORKSHEET_FILENAME = 'menu-plan-worksheet.pdf';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const samplesDir = path.join(root, 'docs/samples');
const artifactsDir = '/opt/cursor/artifacts';

const pdf = await renderMenuPlanTemplate();
const worksheetPath = path.join(samplesDir, WORKSHEET_FILENAME);
fs.writeFileSync(worksheetPath, pdf);

for (const legacyName of ['blank-menu-plans.pdf', 'menu-plan-template.pdf']) {
  const legacyPath = path.join(samplesDir, legacyName);
  if (fs.existsSync(legacyPath)) {
    fs.unlinkSync(legacyPath);
  }
}

if (fs.existsSync(artifactsDir)) {
  fs.copyFileSync(worksheetPath, path.join(artifactsDir, WORKSHEET_FILENAME));
}

const md5 = crypto.createHash('md5').update(pdf).digest('hex');
const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
const downloadUrl = MENU_PLAN_WORKSHEET_DOWNLOAD_URL;
const curlCmd = `curl -L -o ~/Downloads/menu-plan-worksheet.pdf "${downloadUrl}"`;

console.log(`FILE ${worksheetPath}`);
if (fs.existsSync(artifactsDir)) {
  console.log(`FILE ${path.join(artifactsDir, WORKSHEET_FILENAME)}`);
}
console.log(`${pages} page(s), ${pdf.length} bytes, md5=${md5}`);
console.log(`DOWNLOAD ${downloadUrl}`);
console.log(`CURL ${curlCmd}`);
