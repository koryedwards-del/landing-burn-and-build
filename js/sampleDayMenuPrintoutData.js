/** Sample Day Menu — teaching layout for sample diet PDF (page 2). */

import {
  CUTTING_STAPLES_FRUIT,
  CUTTING_STAPLES_GRAINS_STARCHES,
  CUTTING_STAPLES_PROTEIN_DAIRY,
  CUTTING_STAPLES_VEGETABLES,
} from '../data/cuttingStaplesPrintout.js';
import {
  SAMPLE_DAY_MENU_CALLOUT_LEAD,
  SAMPLE_DAY_MENU_CALLOUT_TITLE,
  SAMPLE_DAY_MENU_INTRO,
  SAMPLE_DAY_MENU_PAGE_TITLE,
  SAMPLE_DIET_HEADER,
} from './sampleDietPrintoutCopyData.js';
import { MENU_PLAN_WORKSHEET_LINK_LABEL, MENU_PLAN_WORKSHEET_URL } from './siteUrls.js';
import { menuPlanServingCount, scaleStapleServingLabel } from './stapleServingPrintout.js';

export const SAMPLE_DAY_MENU_FRUIT_SNACK_LABEL = 'Fruit';

/** Illustrative food picks — serving sizes scale from the customer's plan. */
const FOOD_PICKS = Object.freeze({
  breakfast: {
    protein: 'Eggs',
    grains: 'Oatmeal (dry)',
  },
  lunch: {
    protein: 'Chicken breast',
    grains: 'Rice, white (cooked)',
  },
  dinner: {
    protein: 'Sirloin steak',
    grains: 'Sweet potato',
    veggies: 'Broccoli (cooked)',
  },
  fruit: 'Apples',
});

/** Filled sample only — meals every 3 hours from 7:00 AM. */
const EXAMPLE_SECTION_TIMES = Object.freeze([
  { value: '7:00', period: 'AM' },
  { value: '10:00', period: 'AM' },
  { value: '1:00', period: 'PM' },
  { value: '4:00', period: 'PM' },
  { value: '7:00', period: 'PM' },
  { value: '10:00', period: 'PM' },
]);

const MENU_SECTION_DEFS = Object.freeze([
  {
    key: 'breakfast',
    title: 'Breakfast',
    rows: [
      { label: 'Protein & Dairy', pickKey: 'protein', staples: 'protein' },
      { label: 'Grains & Starches', pickKey: 'grains', staples: 'grains' },
    ],
  },
  {
    key: 'snack1',
    title: null,
    rows: [{ label: SAMPLE_DAY_MENU_FRUIT_SNACK_LABEL, labelBold: true, staples: 'fruit' }],
  },
  {
    key: 'lunch',
    title: 'Lunch',
    rows: [
      { label: 'Protein & Dairy', pickKey: 'protein', staples: 'protein' },
      { label: 'Grains & Starches', pickKey: 'grains', staples: 'grains' },
    ],
  },
  {
    key: 'snack2',
    title: null,
    rows: [{ label: SAMPLE_DAY_MENU_FRUIT_SNACK_LABEL, labelBold: true, staples: 'fruit' }],
  },
  {
    key: 'dinner',
    title: 'Dinner',
    rows: [
      { label: 'Protein & Dairy', pickKey: 'protein', staples: 'protein' },
      { label: 'Grains & Starches', pickKey: 'grains', staples: 'grains' },
      { label: 'Veggies', pickKey: 'veggies', staples: 'vegetables' },
    ],
  },
  {
    key: 'snack3',
    title: null,
    rows: [{ label: SAMPLE_DAY_MENU_FRUIT_SNACK_LABEL, labelBold: true, staples: 'fruit' }],
  },
]);

function findStaple(staples, name) {
  const row = staples.find((item) => item.name === name)
    || staples.find((item) => item.name.startsWith(`${name} (`));
  if (!row) throw new Error(`Missing cutting staple: ${name}`);
  return row;
}

function stapleListFor(key) {
  switch (key) {
    case 'protein':
      return CUTTING_STAPLES_PROTEIN_DAIRY;
    case 'grains':
      return CUTTING_STAPLES_GRAINS_STARCHES;
    case 'vegetables':
      return CUTTING_STAPLES_VEGETABLES;
    case 'fruit':
      return CUTTING_STAPLES_FRUIT;
    default:
      throw new Error(`Unknown staple list: ${key}`);
  }
}

function scaledServing(staple, servingCount) {
  const count = Number(servingCount);
  if (!Number.isFinite(count) || count <= 0) return '';
  return scaleStapleServingLabel(staple.serving, count);
}

function pickNameForRow(rowDef, mealKey) {
  if (rowDef.staples === 'fruit') return FOOD_PICKS.fruit;
  if (rowDef.staples === 'vegetables') return FOOD_PICKS.dinner.veggies;
  const meal = FOOD_PICKS[mealKey];
  return meal?.[rowDef.pickKey] || '';
}

export function formatMenuPlanForDate(isoDate) {
  const date = isoDate ? new Date(isoDate) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const dateLong = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return `${weekday}, ${dateLong}`;
}

function buildRow(rowDef, mealKey, planServings, filled) {
  const row = { label: rowDef.label };
  if (rowDef.labelBold) row.labelBold = true;
  if (!filled) return row;

  const stapleName = pickNameForRow(rowDef, mealKey);
  const staple = findStaple(stapleListFor(rowDef.staples), stapleName);
  const servingCount = menuPlanServingCount(planServings, rowDef.staples);
  row.food = staple.name;
  row.servingSize = scaledServing(staple, servingCount);
  return row;
}

function buildMenuSections(planServings, { filled = false } = {}) {
  return MENU_SECTION_DEFS.map((sectionDef, index) => ({
    title: sectionDef.title,
    time: filled ? { ...EXAMPLE_SECTION_TIMES[index] } : null,
    rows: sectionDef.rows.map((rowDef) => buildRow(rowDef, sectionDef.key, planServings, filled)),
  }));
}

export function buildSampleDayMenu(pkg, { filled = true } = {}) {
  const planServings = pkg?.plan?.servings ?? null;
  const dateIso = pkg?.program?.issuedAt
    || pkg?.program?.foodPlanCreatedDate
    || pkg?.program?.issuedAtLocalDate;

  return {
    filled,
    intro: filled ? SAMPLE_DAY_MENU_INTRO : null,
    pageTitle: SAMPLE_DAY_MENU_PAGE_TITLE,
    planFor: {
      value: filled ? formatMenuPlanForDate(dateIso) : '',
    },
    worksheetNote: filled ? {
      calloutTitle: SAMPLE_DAY_MENU_CALLOUT_TITLE,
      lead: SAMPLE_DAY_MENU_CALLOUT_LEAD,
      url: MENU_PLAN_WORKSHEET_URL,
      linkLabel: MENU_PLAN_WORKSHEET_LINK_LABEL,
    } : null,
    sections: buildMenuSections(planServings, { filled }),
  };
}

/** Blank Menu Plan worksheet — modern layout; no handwriting fills. */
export function buildMenuPlanWorksheetPayload() {
  return {
    view: 'menuplanworksheet',
    worksheet: true,
    title: 'Burn & Build Menu Plan',
    clientName: '',
    preparedDate: '',
    header: { ...SAMPLE_DIET_HEADER },
    sampleDayMenu: {
      filled: false,
      pageTitle: SAMPLE_DAY_MENU_PAGE_TITLE,
      planFor: {
        value: '',
      },
      worksheetNote: {
        calloutTitle: SAMPLE_DAY_MENU_CALLOUT_TITLE,
        lead: SAMPLE_DAY_MENU_CALLOUT_LEAD,
        url: MENU_PLAN_WORKSHEET_URL,
        linkLabel: MENU_PLAN_WORKSHEET_LINK_LABEL,
      },
      sections: buildMenuSections(null, { filled: false }),
    },
  };
}
