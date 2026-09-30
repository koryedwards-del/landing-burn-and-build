#!/usr/bin/env node
/** Blank printable Menu Plan worksheet (single page). */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { renderMenuPlanWorksheet } from '../server/pdf/renderSampleDietPrintout.js';
import { HARDKOR_MENU_PLAN_WORKSHEET_REPO_FILE } from '../js/menuPlanWorksheetNamingHelpers.js';
import { MENU_PLAN_WORKSHEET_DOWNLOAD_URL } from '../js/siteUrls.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const samplesDir = path.join(root, 'docs/samples');
const artifactsDir = '/opt/cursor/artifacts';

const pdf = await renderMenuPlanWorksheet();
const worksheetPath = path.join(samplesDir, HARDKOR_MENU_PLAN_WORKSHEET_REPO_FILE);
fs.writeFileSync(worksheetPath, pdf);

if (fs.existsSync(artifactsDir)) {
  fs.copyFileSync(worksheetPath, path.join(artifactsDir, HARDKOR_MENU_PLAN_WORKSHEET_REPO_FILE));
}

const md5 = crypto.createHash('md5').update(pdf).digest('hex');
const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
const downloadUrl = MENU_PLAN_WORKSHEET_DOWNLOAD_URL;
const curlCmd = `curl -L -o ~/Downloads/${HARDKOR_MENU_PLAN_WORKSHEET_REPO_FILE} "${downloadUrl}"`;

console.log(`FILE ${worksheetPath}`);
if (fs.existsSync(artifactsDir)) {
  console.log(`FILE ${path.join(artifactsDir, HARDKOR_MENU_PLAN_WORKSHEET_REPO_FILE)}`);
}
console.log(`${pages} page(s), ${pdf.length} bytes, md5=${md5}`);
console.log(`DOWNLOAD ${downloadUrl}`);
console.log(`CURL ${curlCmd}`);
