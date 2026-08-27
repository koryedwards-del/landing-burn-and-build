#!/usr/bin/env node
/** Program report PDF verification — run: npm run verify:pdf */

import { buildVerifyProgramReportPayload } from '../js/printoutVerifyFixtures.js';
import { renderPrintPdf } from '../server/pdf/index.js';
import { assertPdfBuffer, sanitizePdfFilename } from '../server/pdf/http.js';
import { PdfError } from '../server/pdf/errors.js';
import { validatePrintPayload, validatePrintView } from '../server/pdf/validate.js';

function pageCount(pdf) {
  return (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
}

function assertPdf(label, pdf, { minPages = 1 } = {}) {
  assertPdfBuffer(pdf);
  const pages = pageCount(pdf);
  if (pages < minPages) {
    throw new Error(`${label}: expected >= ${minPages} pages, got ${pages}`);
  }
  console.log(`ok  ${label} — ${pages} page(s), ${pdf.length} bytes`);
}

function assertThrows(label, fn, { status, includes } = {}) {
  try {
    fn();
    throw new Error(`${label}: expected throw`);
  } catch (err) {
    if (!(err instanceof PdfError || err.status)) {
      throw err;
    }
    if (status != null && err.status !== status) {
      throw new Error(`${label}: expected status ${status}, got ${err.status}`);
    }
    if (includes && !String(err.message).includes(includes)) {
      throw new Error(`${label}: message "${err.message}" missing "${includes}"`);
    }
    console.log(`ok  ${label}`);
  }
}

assertThrows('validatePrintView rejects empty', () => validatePrintView(''), { status: 400 });
assertThrows('validatePrintView rejects unknown', () => validatePrintView('nope'), { status: 400, includes: 'not supported' });
assertThrows('validatePrintPayload rejects bad programreport', () => validatePrintPayload('programreport', {}), { status: 400 });

const filename = sanitizePdfFilename('Burn & Build Diet - Sample Client', 'programreport');
if (!filename.endsWith('.pdf') || filename.includes('&')) {
  throw new Error(`sanitizePdfFilename failed: ${filename}`);
}
console.log(`ok  sanitizePdfFilename — ${filename}`);

const payload = buildVerifyProgramReportPayload();
assertPdf('programreport (golden sample)', await renderPrintPdf('programreport', { payload }), { minPages: 10 });

if (payload.clientName !== 'SAMPLE CLIENT') {
  throw new Error(`clientName: got ${payload.clientName}`);
}
if (payload.preparedDate !== '2024-01-15') {
  throw new Error(`preparedDate: got ${payload.preparedDate}`);
}
if (payload.foodPlan.fatLostLbs !== '11.0') {
  throw new Error(`fat lost: got ${payload.foodPlan.fatLostLbs}`);
}
if (payload.servings.gridRows[0].daily !== '9') {
  throw new Error(`protein servings: got ${payload.servings.gridRows[0].daily}`);
}
console.log('ok  golden sample program report payload');

console.log('\nProgram report PDF checks passed.');
