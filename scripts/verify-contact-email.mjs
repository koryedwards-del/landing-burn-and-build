#!/usr/bin/env node
/** Fail if support@ remains or PDF footer contact drifts from CONTACT_EMAIL. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CONTACT_EMAIL } from '../js/contactEmailData.js';
import { PDF_FRAME_CONTACT } from '../server/pdf/drawFrame.js';
import { SAMPLE_DIET_HEADER } from '../js/sampleDietPrintoutCopyData.js';
import { PURCHASE_EMAIL_CONTACT } from '../server/dietPdfUrls.js';
import { buildMenuPlanWorksheetPayload } from '../js/sampleDayMenuPrintoutData.js';
import { buildHandbookFaqPayload } from '../js/handbookFaqPrintoutData.js';
import { buildSampleDietPreviewPayload } from '../js/sampleDietPrintoutData.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const skipDirs = new Set(['node_modules', '.git']);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

const offenders = [];
for (const file of walk(root)) {
  const rel = path.relative(root, file);
  if (rel === 'scripts/verify-contact-email.mjs') continue;
  const text = fs.readFileSync(file, 'utf8');
  if (text.includes('support@')) offenders.push(rel);
}

if (offenders.length) {
  console.error('support@ found in:');
  offenders.forEach((file) => console.error(`  - ${file}`));
  process.exit(1);
}

const payloadChecks = [
  ['PDF_FRAME_CONTACT.email', PDF_FRAME_CONTACT.email],
  ['SAMPLE_DIET_HEADER.email', SAMPLE_DIET_HEADER.email],
  ['PURCHASE_EMAIL_CONTACT', PURCHASE_EMAIL_CONTACT],
  ['menu worksheet header', buildMenuPlanWorksheetPayload().header.email],
  ['FAQ header', buildHandbookFaqPayload().header.email],
  ['sample diet header', buildSampleDietPreviewPayload().header.email],
];

for (const [label, email] of payloadChecks) {
  if (email !== CONTACT_EMAIL) {
    console.error(`${label} expected ${CONTACT_EMAIL}, got ${email}`);
    process.exit(1);
  }
}

console.log(`OK contact email is ${CONTACT_EMAIL} across repo sources and PDF payloads`);
