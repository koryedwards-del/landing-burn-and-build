/** Sample Day Menu — fill-in meal worksheet for sample diet PDF (page 7). */

import {
  CUTTING_STAPLES_FRUIT,
  CUTTING_STAPLES_GRAINS_STARCHES,
  CUTTING_STAPLES_PROTEIN_DAIRY,
  CUTTING_STAPLES_VEGETABLES,
} from '../data/cuttingStaplesPrintout.js';
import {
  SAMPLE_DAY_MENU_PLAN_FOR_LABEL,
  SAMPLE_DAY_MENU_TEMPLATE_NOTE_LEAD,
  SAMPLE_DIET_HEADER,
} from './sampleDietPrintoutCopyData.js';
import { MENU_PLAN_TEMPLATE_URL } from './siteUrls.js';
import { scaleStapleServingLabel } from './stapleServingPrintout.js';
import { servingsGridRows } from './servingsPrintout.js';

export const SAMPLE_DAY_MENU_FRUIT_SNACK_LABEL = 'Fruit Snack';

/** Illustrative food picks — serving sizes scale from the customer's plan. */
const FOOD_PICKS = Object.freeze({
  breakfast: {
    protein: 'Egg whites (extra large)',
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
      { label: 'Proteins/Dairy', pickKey: 'protein', staples: 'protein', slot: 'breakfast' },
      { label: 'Grains/Starches', pickKey: 'grains', staples: 'grains', slot: 'breakfast' },
    ],
  },
  {
    key: 'snack1',
    title: null,
    rows: [{ label: SAMPLE_DAY_MENU_FRUIT_SNACK_LABEL, staples: 'fruit', slot: 'snack1' }],
  },
  {
    key: 'lunch',
    title: 'Lunch',
    rows: [
      { label: 'Proteins/Dairy', pickKey: 'protein', staples: 'protein', slot: 'lunch' },
      { label: 'Grains/Starches', pickKey: 'grains', staples: 'grains', slot: 'lunch' },
    ],
  },
  {
    key: 'snack2',
    title: null,
    rows: [{ label: SAMPLE_DAY_MENU_FRUIT_SNACK_LABEL, staples: 'fruit', slot: 'snack2' }],
  },
  {
    key: 'dinner',
    title: 'Dinner',
    rows: [
      { label: 'Proteins/Dairy', pickKey: 'protein', staples: 'protein', slot: 'dinner' },
      { label: 'Grains/Starches', pickKey: 'grains', staples: 'grains', slot: 'dinner' },
      { label: 'Veggies', pickKey: 'veggies', staples: 'vegetables', slot: 'daily' },
    ],
  },
  {
    key: 'snack3',
    title: null,
    rows: [{ label: SAMPLE_DAY_MENU_FRUIT_SNACK_LABEL, staples: 'fruit', slot: 'snack3' }],
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

function gridSlotCount(gridRows, rowLabel, slotKey) {
  const row = gridRows.find((entry) => entry.label === rowLabel);
  const count = Number(row?.[slotKey]);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

function gridDailyCount(gridRows, rowLabel) {
  const row = gridRows.find((entry) => entry.label === rowLabel);
  const count = Number(row?.daily);
  return Number.isFinite(count) && count > 0 ? Math.round(count) : 0;
}

function servingCountForRow(gridRows, rowDef) {
  if (rowDef.slot === 'daily') return gridDailyCount(gridRows, 'Veggies');
  if (rowDef.staples === 'fruit') return gridSlotCount(gridRows, 'Fruits', rowDef.slot);
  const rowLabel = rowDef.label === 'Grains/Starches' ? 'Grains/Starches' : 'Protein';
  return gridSlotCount(gridRows, rowLabel, rowDef.slot);
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

function buildRow(rowDef, mealKey, gridRows, filled) {
  const row = { label: rowDef.label };
  if (!filled) return row;

  const stapleName = pickNameForRow(rowDef, mealKey);
  const staple = findStaple(stapleListFor(rowDef.staples), stapleName);
  const servingCount = servingCountForRow(gridRows, rowDef);
  row.food = staple.name;
  row.servingSize = scaledServing(staple, servingCount);
  return row;
}

function buildMenuSections(gridRows, { filled = false } = {}) {
  return MENU_SECTION_DEFS.map((sectionDef, index) => ({
    title: sectionDef.title,
    time: filled ? { ...EXAMPLE_SECTION_TIMES[index] } : null,
    rows: sectionDef.rows.map((rowDef) => buildRow(rowDef, sectionDef.key, gridRows, filled)),
  }));
}

export function buildSampleDayMenu(pkg, { filled = true } = {}) {
  const gridRows = servingsGridRows(pkg);
  const dateIso = pkg?.program?.issuedAt
    || pkg?.program?.foodPlanCreatedDate
    || pkg?.program?.issuedAtLocalDate;

  return {
    filled,
    pageTitle: 'Menu Plan',
    planFor: {
      label: SAMPLE_DAY_MENU_PLAN_FOR_LABEL,
      value: filled ? formatMenuPlanForDate(dateIso) : '',
    },
    templateNote: filled ? {
      lead: SAMPLE_DAY_MENU_TEMPLATE_NOTE_LEAD,
      url: MENU_PLAN_TEMPLATE_URL,
      linkLabel: 'burnandbuilddiet.com/docs/samples/menu-plan-template.pdf',
    } : null,
    sections: buildMenuSections(gridRows, { filled }),
  };
}

/** Blank printable template — no handwriting fills; same layout as page 7. */
export function buildMenuPlanTemplatePayload() {
  return {
    view: 'menuplantemplate',
    template: true,
    title: 'Burn & Build Menu Plan',
    clientName: '',
    preparedDate: '',
    header: { ...SAMPLE_DIET_HEADER },
    sampleDayMenu: {
      filled: false,
      pageTitle: 'Menu Plan',
      planFor: {
        label: SAMPLE_DAY_MENU_PLAN_FOR_LABEL,
        value: '',
      },
      sections: buildMenuSections([], { filled: false }),
    },
  };
}
