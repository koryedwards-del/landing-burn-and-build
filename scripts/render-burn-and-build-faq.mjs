#!/usr/bin/env node
/** Burn & Build FAQ PDF — writes docs/samples/burn-and-build-faq.pdf */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildHandbookFaqPayload } from '../js/handbookFaqPrintoutData.js';
import {
  BURN_AND_BUILD_FAQ_DOWNLOAD_FILENAME,
  BURN_AND_BUILD_FAQ_REPO_FILE,
} from '../js/faqPdfNamingHelpers.js';
import { BURN_AND_BUILD_FAQ_DOWNLOAD_URL } from '../js/siteUrls.js';
import { renderHandbookFaqPrintout } from '../server/pdf/renderHandbookFaqPrintout.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const samplesDir = path.join(root, 'docs/samples');
const deliverable = path.join(samplesDir, BURN_AND_BUILD_FAQ_REPO_FILE);

const pdf = await renderHandbookFaqPrintout(buildHandbookFaqPayload());
fs.mkdirSync(samplesDir, { recursive: true });
fs.writeFileSync(deliverable, pdf);

const md5 = crypto.createHash('md5').update(pdf).digest('hex');
const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
const downloadUrl = BURN_AND_BUILD_FAQ_DOWNLOAD_URL;
const curlCmd = `curl -L -o ~/Downloads/${BURN_AND_BUILD_FAQ_DOWNLOAD_FILENAME} "${downloadUrl}"`;

console.log(`FILE ${deliverable}`);
console.log(`${pages} page(s), ${pdf.length} bytes, md5=${md5}`);
console.log(`DOWNLOAD ${downloadUrl}`);
console.log(`CURL ${curlCmd}`);
