/** Seminar page 4 — Servings grid printout. */

import { stapleCategoryServings } from './stapleServingPrintout.js';

function cellFromDailyThird(planServings, category) {
  const count = stapleCategoryServings(planServings, category);
  if (!Number.isFinite(count) || count <= 0) return '';
  return formatServingCell(count);
}

const SLOT_COLUMNS = [
  { key: 'breakfast', label: 'Breakfast', slotLabel: 'Breakfast' },
  { key: 'snack1', label: 'Fruit', slotLabel: 'Morning Snack' },
  { key: 'lunch', label: 'Lunch', slotLabel: 'Lunch' },
  { key: 'snack2', label: 'Fruit', slotLabel: 'Afternoon Snack' },
  { key: 'dinner', label: 'Dinner', slotLabel: 'Dinner' },
  { key: 'snack3', label: 'Fruit', slotLabel: 'Evening Snack' },
];

export function formatServingCell(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '';
  if (Math.abs(n - Math.round(n)) < 0.005) return String(Math.round(n));
  const truncated = Math.floor(n * 100) / 100;
  const two = truncated.toFixed(2);
  if (two.endsWith('00')) return String(Math.round(truncated));
  if (two.endsWith('0')) return truncated.toFixed(1);
  return two;
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
      label: 'Protein & Dairy',
      daily: formatServingCell(servings.protein),
      breakfast: proteinThird,
      snack1: '',
      lunch: proteinThird,
      snack2: '',
      dinner: proteinThird,
      snack3: '',
    },
    {
      label: 'Grains & Starches',
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
      label: 'Fruit',
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
