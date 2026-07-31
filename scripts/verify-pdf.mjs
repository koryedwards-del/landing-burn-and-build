#!/usr/bin/env node
/** Smoke-test all Print Shop PDF renderers — run: node scripts/verify-pdf.mjs */

import { renderPrintPdf } from '../server/pdf/index.js';

const STATIC_VIEWS = ['faq', 'foodlist', 'bestresults'];

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
  const text = pdf.toString('latin1');
  return (text.match(/\/Type\s*\/Page[^s]/g) || []).length;
}

function assertPdf(label, pdf, { minPages = 1 } = {}) {
  if (!pdf.slice(0, 5).toString().startsWith('%PDF-')) {
    throw new Error(`${label}: not a PDF`);
  }
  const pages = pageCount(pdf);
  if (pages < minPages) {
    throw new Error(`${label}: expected >= ${minPages} pages, got ${pages}`);
  }
  console.log(`ok  ${label} — ${pages} page(s), ${pdf.length} bytes`);
}

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

console.log('\nAll PDF renders passed.');
