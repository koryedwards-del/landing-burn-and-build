/** Sample Day Menu — teaching layout for sample diet PDF (page 2). */

import {
  SAMPLE_DAY_MENU_CALLOUT_LEAD,
  SAMPLE_DAY_MENU_CALLOUT_TITLE,
  SAMPLE_DAY_MENU_INTRO,
  SAMPLE_DAY_MENU_PAGE_TITLE,
  SAMPLE_DIET_HEADER,
} from './sampleDietPrintoutCopyData.js';
import { MENU_PLAN_WORKSHEET_LINK_LABEL, MENU_PLAN_WORKSHEET_URL } from './siteUrls.js';

export const SAMPLE_DAY_MENU_FRUIT_SNACK_LABEL = 'Fruit Snack';

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
      { label: 'Proteins/Dairy', pickKey: 'protein', staples: 'protein' },
      { label: 'Grains/Starches', pickKey: 'grains', staples: 'grains' },
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
      { label: 'Proteins/Dairy', pickKey: 'protein', staples: 'protein' },
      { label: 'Grains/Starches', pickKey: 'grains', staples: 'grains' },
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
      { label: 'Proteins/Dairy', pickKey: 'protein', staples: 'protein' },
      { label: 'Grains/Starches', pickKey: 'grains', staples: 'grains' },
      { label: 'Veggies', pickKey: 'veggies', staples: 'vegetables' },
    ],
  },
  {
    key: 'snack3',
    title: null,
    rows: [{ label: SAMPLE_DAY_MENU_FRUIT_SNACK_LABEL, labelBold: true, staples: 'fruit' }],
  },
]);

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

function buildRow(rowDef) {
  const row = { label: rowDef.label };
  if (rowDef.labelBold) row.labelBold = true;
  return row;
}

function buildMenuSections(_planServings, { filled = false } = {}) {
  return MENU_SECTION_DEFS.map((sectionDef, index) => ({
    title: sectionDef.title,
    time: filled ? { ...EXAMPLE_SECTION_TIMES[index] } : null,
    rows: sectionDef.rows.map((rowDef) => buildRow(rowDef)),
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

/** Blank Menu Plan worksheet — no handwriting fills; same layout as sample diet page 7. */
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
      sections: buildMenuSections(null, { filled: false }),
    },
  };
}
