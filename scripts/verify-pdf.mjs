#!/usr/bin/env node
/** Program report PDF verification — run: npm run verify:pdf */

import { buildKristiPreviewPayload } from '../js/programReportPreviewFixtures.js';
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

const filename = sanitizePdfFilename('Burn & Build Diet - Kristi Warner', 'programreport');
if (!filename.endsWith('.pdf') || filename.includes('&')) {
  throw new Error(`sanitizePdfFilename failed: ${filename}`);
}
console.log(`ok  sanitizePdfFilename — ${filename}`);

const kristiPayload = buildKristiPreviewPayload();
assertPdf('programreport (Kristi Warner)', await renderPrintPdf('programreport', { payload: kristiPayload }), { minPages: 10 });

if (kristiPayload.clientName !== 'KRISTI WARNER') {
  throw new Error(`Kristi clientName: got ${kristiPayload.clientName}`);
}
if (kristiPayload.preparedDate !== '2024-01-15') {
  throw new Error(`Kristi preparedDate: got ${kristiPayload.preparedDate}`);
}
if (kristiPayload.foodPlan.fatLostLbs !== '11.0') {
  throw new Error(`Kristi fat lost: got ${kristiPayload.foodPlan.fatLostLbs}`);
}
if (kristiPayload.servings.gridRows[0].daily !== '9') {
  throw new Error(`Kristi protein servings: got ${kristiPayload.servings.gridRows[0].daily}`);
}
console.log('ok  Kristi Warner program report payload');

console.log('\nProgram report PDF checks passed.');
