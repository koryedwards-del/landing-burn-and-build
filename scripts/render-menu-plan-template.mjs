#!/usr/bin/env node
/** Blank printable menu plan template (single page). */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { renderMenuPlanTemplate } from '../server/pdf/renderSampleDietPrintout.js';
import { MENU_PLAN_TEMPLATE_ATTACHMENT_URL, MENU_PLAN_TEMPLATE_DOWNLOAD_URL } from '../js/siteUrls.js';

const TEMPLATE_FILENAME = 'menu-plan-template.pdf';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const samplesDir = path.join(root, 'docs/samples');
const artifactsDir = '/opt/cursor/artifacts';

const pdf = await renderMenuPlanTemplate();
const templatePath = path.join(samplesDir, TEMPLATE_FILENAME);
fs.writeFileSync(templatePath, pdf);

if (fs.existsSync(artifactsDir)) {
  fs.copyFileSync(templatePath, path.join(artifactsDir, TEMPLATE_FILENAME));
}

const md5 = crypto.createHash('md5').update(pdf).digest('hex');
const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
const downloadUrl = MENU_PLAN_TEMPLATE_DOWNLOAD_URL;
const attachmentUrl = MENU_PLAN_TEMPLATE_ATTACHMENT_URL;
const curlCmd = `curl -L -o ~/Downloads/menu-plan-template.pdf "${attachmentUrl}"`;

console.log(`FILE ${templatePath}`);
if (fs.existsSync(artifactsDir)) {
  console.log(`FILE ${path.join(artifactsDir, TEMPLATE_FILENAME)}`);
}
console.log(`${pages} page(s), ${pdf.length} bytes, md5=${md5}`);
console.log(`DOWNLOAD ${downloadUrl}`);
console.log(`ATTACHMENT ${attachmentUrl}`);
console.log(`CURL ${curlCmd}`);
