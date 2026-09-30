#!/usr/bin/env node
/** HARDKOR Diet FAQ PDF — writes docs/samples/hardkor-diet-faq.pdf */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildHandbookFaqPayload } from '../js/handbookFaqPrintoutData.js';
import {
  HARDKOR_FAQ_DOWNLOAD_FILENAME,
  HARDKOR_FAQ_REPO_FILE,
} from '../js/faqPdfNamingHelpers.js';
import { HARDKOR_FAQ_DOWNLOAD_URL } from '../js/siteUrls.js';
import { renderHandbookFaqPrintout } from '../server/pdf/renderHandbookFaqPrintout.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const samplesDir = path.join(root, 'docs/samples');
const deliverable = path.join(samplesDir, HARDKOR_FAQ_REPO_FILE);

const payload = buildHandbookFaqPayload();
const pdf = await renderHandbookFaqPrintout(payload);
fs.mkdirSync(samplesDir, { recursive: true });
fs.writeFileSync(deliverable, pdf);

const stat = fs.statSync(deliverable);
const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
console.log(`FILE ${deliverable}`);
console.log(`${pages} page(s), ${stat.size} bytes, md5=${stat.size}`);
console.log(`DOWNLOAD ${HARDKOR_FAQ_DOWNLOAD_URL}`);
console.log(`CURL curl -L -o ~/Downloads/${HARDKOR_FAQ_DOWNLOAD_FILENAME} "${HARDKOR_FAQ_DOWNLOAD_URL}"`);
