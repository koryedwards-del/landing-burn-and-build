/** Seminar page 4 — Servings grid printout. */

import { stapleCategoryServings } from './stapleServingPrintout.js';

function cellFromDailyThird(planServings, category) {
  const count = stapleCategoryServings(planServings, category);
  if (!Number.isFinite(count) || count <= 0) return '';
  return formatServingCell(count);
}

const SLOT_COLUMNS = [
  { key: 'breakfast', label: 'Breakfast', slotLabel: 'Breakfast' },
  { key: 'snack1', label: 'Snack', slotLabel: 'Morning Snack' },
  { key: 'lunch', label: 'Lunch', slotLabel: 'Lunch' },
  { key: 'snack2', label: 'Snack', slotLabel: 'Afternoon Snack' },
  { key: 'dinner', label: 'Dinner', slotLabel: 'Dinner' },
  { key: 'snack3', label: 'Snack', slotLabel: 'Evening Snack' },
];

export function formatServingCell(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '';
  if (Math.abs(n - Math.round(n)) < 0.05) return String(Math.round(n));
  return n.toFixed(1);
}

/** Page 4 grid — daily total in the first column; meal/snack columns show daily ÷ 3. */
export function servingsGridRows(pkg) {
  const servings = pkg?.plan?.servings;
  if (!servings) return [];

  const proteinThird = cellFromDailyThird(servings, 'protein');
  const grainThird = cellFromDailyThird(servings, 'grains');
  const fruitThird = cellFromDailyThird(servings, 'fruit');

  return [
    {
      label: 'Protein',
      daily: formatServingCell(servings.protein),
      breakfast: proteinThird,
      snack1: '',
      lunch: proteinThird,
      snack2: '',
      dinner: proteinThird,
      snack3: '',
    },
    {
      label: 'Grains/Starches',
      daily: formatServingCell(servings.grainsStarches),
      breakfast: grainThird,
      snack1: '',
      lunch: grainThird,
      snack2: '',
      dinner: grainThird,
      snack3: '',
    },
    {
      label: 'Veggies',
      daily: formatServingCell(servings.vegetables),
      breakfast: '',
      snack1: '',
      lunch: '',
      snack2: '',
      dinner: '',
      snack3: '',
    },
    {
      label: 'Fruits',
      daily: formatServingCell(servings.fruits),
      breakfast: '',
      snack1: fruitThird,
      lunch: '',
      snack2: fruitThird,
      dinner: '',
      snack3: fruitThird,
    },
  ];
}

export { SLOT_COLUMNS };
