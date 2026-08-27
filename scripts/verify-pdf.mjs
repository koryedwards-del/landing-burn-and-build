#!/usr/bin/env node
/** Burn & Build Diet PDF verification — run: npm run verify:pdf */

import { buildSampleDietPreviewPayload } from '../js/sampleDietPrintoutData.js';
import {
  renderMenuPlanWorksheet,
  renderSampleDietPrintout,
  SAMPLE_DIET_PRINTOUT_MIN_PAGES,
  validateSampleDietPayload,
} from '../server/pdf/renderSampleDietPrintout.js';
import { assertPdfBuffer, sanitizePdfFilename } from '../server/pdf/http.js';
import { PdfError } from '../server/pdf/errors.js';

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

try {
  validateSampleDietPayload(null);
  throw new Error('validateSampleDietPayload rejects empty: expected throw');
} catch (err) {
  if (!String(err.message).includes('payload object')) throw err;
  console.log('ok  validateSampleDietPayload rejects empty');
}

const filename = sanitizePdfFilename('Burn & Build Diet - Sample Female', 'samplediet');
if (!filename.endsWith('.pdf') || filename.includes('&')) {
  throw new Error(`sanitizePdfFilename failed: ${filename}`);
}
console.log(`ok  sanitizePdfFilename — ${filename}`);

const samplePayload = buildSampleDietPreviewPayload();
validateSampleDietPayload(samplePayload);
assertPdf('Burn & Build Diet (golden sample)', await renderSampleDietPrintout(samplePayload), {
  minPages: SAMPLE_DIET_PRINTOUT_MIN_PAGES,
});
if (samplePayload.view !== 'samplediet') {
  throw new Error(`sample view: got ${samplePayload.view}`);
}
if (samplePayload.clientName !== 'SAMPLE FEMALE') {
  throw new Error(`sample clientName: got ${samplePayload.clientName}`);
}
if (samplePayload.preparedDate !== '2024-01-15') {
  throw new Error(`preparedDate: got ${samplePayload.preparedDate}`);
}
if (samplePayload.foodPlan.macroRows?.[0]?.totalCal !== '2,192') {
  throw new Error(`macro total: got ${samplePayload.foodPlan.macroRows?.[0]?.totalCal}`);
}
if (samplePayload.servings.gridRows?.[0]?.daily !== '9') {
  throw new Error(`protein servings: got ${samplePayload.servings.gridRows?.[0]?.daily}`);
}
console.log('ok  golden sample diet payload');

assertPdf('menu plan worksheet (blank)', await renderMenuPlanWorksheet(), { minPages: 1 });

console.log('\nPDF checks passed.');
