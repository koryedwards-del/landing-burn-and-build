#!/usr/bin/env node
/**
 * HARDKOR header logo test — writes docs/samples/hardkor-sample-diet-test.pdf.
 * Does not overwrite docs/samples/b&bsamplediet.pdf.
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  HARDKOR_SAMPLE_DIET_TEST_DOWNLOAD_FILENAME,
  HARDKOR_SAMPLE_DIET_TEST_REPO_FILE,
} from '../js/hardkorSampleDietTestPdfNamingHelpers.js';
import { buildSampleDietPreviewPayload } from '../js/sampleDietPrintoutData.js';
import { HARDKOR_SAMPLE_DIET_TEST_DOWNLOAD_URL } from '../js/siteUrls.js';
import { PDF_HARDKOR_LOGO_REL } from '../server/pdf/constants.js';
import { renderSampleDietPrintout } from '../server/pdf/renderSampleDietPrintout.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const samplesDir = path.join(root, 'docs/samples');
const defaultOut = path.join(samplesDir, HARDKOR_SAMPLE_DIET_TEST_REPO_FILE);
const outArg = process.argv.find((arg) => arg.startsWith('--out='));
const deliverable = outArg ? path.resolve(outArg.slice('--out='.length)) : defaultOut;

const logoPath = path.join(root, PDF_HARDKOR_LOGO_REL);
if (!fs.existsSync(logoPath)) {
  console.error(`Missing HARDKOR logo: ${logoPath}`);
  process.exit(1);
}

const headerLogoRel = PDF_HARDKOR_LOGO_REL;

const payload = buildSampleDietPreviewPayload();
const pdf = await renderSampleDietPrintout(payload, {
  title: 'HARDKOR Sample Diet (header test)',
  buildLabel: 'hardkor-header-test',
  headerLogoRel,
});

fs.mkdirSync(path.dirname(deliverable), { recursive: true });
fs.writeFileSync(deliverable, pdf);

const md5 = crypto.createHash('md5').update(pdf).digest('hex');
const stat = fs.statSync(deliverable);
const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
const downloadUrl = HARDKOR_SAMPLE_DIET_TEST_DOWNLOAD_URL;
const curlCmd = `curl -L -o ~/Downloads/${HARDKOR_SAMPLE_DIET_TEST_DOWNLOAD_FILENAME} "${downloadUrl}"`;

console.log(`FILE ${deliverable}`);
console.log(`OK ${deliverable}`);
console.log(`BYTES ${stat.size}`);
console.log(`PAGES ${pages}`);
console.log(`md5=${md5}`);
console.log(`DOWNLOAD ${downloadUrl}`);
console.log(`CURL ${curlCmd}`);
