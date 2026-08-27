#!/usr/bin/env node
/** Blank printable menu plans (single page). */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { renderMenuPlanTemplate } from '../server/pdf/renderSampleDietPrintout.js';
import { BLANK_MENU_PLANS_DOWNLOAD_URL } from '../js/siteUrls.js';

const BLANK_MENU_PLANS_FILENAME = 'blank-menu-plans.pdf';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const samplesDir = path.join(root, 'docs/samples');
const artifactsDir = '/opt/cursor/artifacts';

const pdf = await renderMenuPlanTemplate();
const templatePath = path.join(samplesDir, BLANK_MENU_PLANS_FILENAME);
fs.writeFileSync(templatePath, pdf);

const legacyPath = path.join(samplesDir, 'menu-plan-template.pdf');
if (fs.existsSync(legacyPath)) {
  fs.unlinkSync(legacyPath);
}

if (fs.existsSync(artifactsDir)) {
  fs.copyFileSync(templatePath, path.join(artifactsDir, BLANK_MENU_PLANS_FILENAME));
}

const md5 = crypto.createHash('md5').update(pdf).digest('hex');
const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
const downloadUrl = BLANK_MENU_PLANS_DOWNLOAD_URL;
const curlCmd = `curl -L -o ~/Downloads/blank-menu-plans.pdf "${downloadUrl}"`;

console.log(`FILE ${templatePath}`);
if (fs.existsSync(artifactsDir)) {
  console.log(`FILE ${path.join(artifactsDir, BLANK_MENU_PLANS_FILENAME)}`);
}
console.log(`${pages} page(s), ${pdf.length} bytes, md5=${md5}`);
console.log(`DOWNLOAD ${downloadUrl}`);
console.log(`CURL ${curlCmd}`);
