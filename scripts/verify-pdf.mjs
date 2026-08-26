#!/usr/bin/env node
/** Print Shop PDF verification — run: npm run verify:pdf */

import { buildProgramPackage } from '../js/programPackage.js';
import { computePlan } from '../js/burnEngine.js';
import { buildProgramReportPayload } from '../js/programReportPrintout.js';
import { renderPrintPdf } from '../server/pdf/index.js';
import { assertPdfBuffer, sanitizePdfFilename } from '../server/pdf/http.js';
import { PdfError } from '../server/pdf/errors.js';
import { validatePrintPayload, validatePrintView } from '../server/pdf/validate.js';

const STATIC_VIEWS = ['faq', 'foodlist', 'bestresults'];

const KRISTI_FORM = {
  preferredName: 'Kristi Warner',
  email: 'preview@example.com',
  sex: 'female',
  heightFeet: '5',
  heightInchesPart: '6',
  age: 28,
  weightText: '184',
  fatPercentText: '38.22',
  fatSource: 'skinfolds',
  workPhysical: 'sitting',
  workStress: 'comfortable',
  weightTrainingHours: 3,
  cardioHours: 0,
  fatBurningHours: 3,
  wakeTime: '06:00',
};

function buildKristiPreviewPackage() {
  const pkg = buildProgramPackage(KRISTI_FORM, {
    label: '8-Week Burn & Build Program',
    meta: { source: 'program-report-preview' },
  });
  pkg.intake.leanBodyMass = 113.7;
  pkg.intake.workIntensity = 1.5;
  pkg.intake.thighMm = 25;
  pkg.intake.waistMm = 25;
  pkg.program.foodPlanCreatedDate = '2024-01-15';
  pkg.program.issuedAt = '2024-01-15T12:00:00.000Z';

  const plan = computePlan({
    lbm: pkg.intake.leanBodyMass,
    intensity: pkg.intake.workIntensity,
    weightTrainingHours: pkg.intake.weightTrainingHours,
    cardioHours: pkg.intake.cardioHours,
    fatBurningHours: pkg.intake.fatBurningHours,
  });
  pkg.plan = {
    ...pkg.plan,
    servings: plan.servings,
    summary: {
      maintainTotalCals: plan.maintainTotalCals,
      reduceTotalCals: plan.reduceTotalCals,
      maintainProteinGrams: plan.maintainProteinGrams,
      reduceFatGrams: plan.reduceFatGrams,
      maintainFatCalories: plan.maintainFatCalories,
      reduceFatCalories: plan.reduceFatCalories,
      weeklyFatLossPounds: plan.weeklyFatLossPounds,
    },
    formula: plan.formula,
  };
  return pkg;
}

function kristiProgramReportPayload() {
  return buildProgramReportPayload(buildKristiPreviewPackage());
}

const weekPayload = {
  view: 'week',
  title: 'B&B - Weekly Meal Plan',
  clientName: 'Alex',
  preparedAt: 'Jul 31, 2026',
  empty: false,
  weekDays: [
    { id: 'mon', label: 'Mon' },
    { id: 'tue', label: 'Tue' },
    { id: 'wed', label: 'Wed' },
    { id: 'thu', label: 'Thu' },
    { id: 'fri', label: 'Fri' },
    { id: 'sat', label: 'Sat' },
    { id: 'sun', label: 'Sun' },
  ],
  rows: Array.from({ length: 12 }, (_, index) => ({
    id: `meal-${index}`,
    time: `${6 + index}:00 AM`,
    label: `Meal ${index + 1}`,
    cells: {
      mon: [{ foodName: `Food item ${index} with a longer name that wraps`, amount: '6 oz' }],
      tue: [{ foodName: 'Eggs', amount: '3 whole' }],
      wed: [],
      thu: [{ foodName: 'Greek Yogurt', amount: '8 oz' }],
      fri: [],
      sat: [],
      sun: [],
    },
  })),
};

const shoppingPayload = {
  view: 'shopping',
  title: 'B&B - Grocery List',
  clientName: 'Alex',
  preparedAt: 'Jul 31, 2026',
  empty: false,
  groups: [
    {
      category: 'Protein',
      rows: Array.from({ length: 80 }, (_, index) => ({
        foodName: `Protein item ${index + 1}`,
        amount: `${index + 1} lb`,
      })),
    },
    {
      category: 'Grains & Starches',
      rows: [
        { foodName: 'Oatmeal', amount: '1 container' },
        { foodName: 'White rice', amount: '2 cups dry' },
      ],
    },
  ],
};

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
assertThrows('validatePrintPayload rejects bad week', () => validatePrintPayload('week', {}), { status: 400 });

const filename = sanitizePdfFilename('B&B - FAQ - Alex', 'faq');
if (!filename.endsWith('.pdf') || filename.includes('&')) {
  throw new Error(`sanitizePdfFilename failed: ${filename}`);
}
console.log(`ok  sanitizePdfFilename — ${filename}`);

for (const view of STATIC_VIEWS) {
  assertPdf(view, await renderPrintPdf(view), {
    minPages: view === 'faq' ? 3 : view === 'foodlist' ? 4 : 2,
  });
}

assertPdf('week (multi-row)', await renderPrintPdf('week', { payload: weekPayload }), { minPages: 2 });
assertPdf('shopping (long list)', await renderPrintPdf('shopping', { payload: shoppingPayload }), { minPages: 2 });
assertPdf('week (empty)', await renderPrintPdf('week', {
  payload: { ...weekPayload, empty: true, rows: [] },
}), { minPages: 1 });

const kristiPayload = kristiProgramReportPayload();
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

console.log('\nAll Print Shop PDF checks passed.');
