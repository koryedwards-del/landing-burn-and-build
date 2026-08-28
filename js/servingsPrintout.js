/** Seminar page 4 — Servings grid printout. */

import { stapleCategoryServings } from './stapleServingPrintout.js';

/**
 * Split a daily total into whole-number servings across meal/snack slots.
 * For 3 slots (breakfast/lunch/dinner or 3 snacks), extras go to lunch then dinner —
 * not breakfast (e.g. 10 across 3 meals → 3, 4, 3).
 * @deprecated PDF grid uses daily ÷ 3 per slot via stapleCategoryServings instead.
 */
export function distributeWholeServings(total, slotCount) {
  const daily = Math.round(Number(total));
  const slots = Number(slotCount);
  if (!Number.isFinite(daily) || daily <= 0 || !Number.isFinite(slots) || slots <= 0) {
    return Array(Math.max(0, slots)).fill(0);
  }
  const base = Math.floor(daily / slots);
  const remainder = daily - base * slots;
  const parts = Array(slots).fill(base);
  if (slots === 3) {
    if (remainder >= 1) parts[1] += 1;
    if (remainder >= 2) parts[2] += 1;
    return parts;
  }
  for (let i = slots - 1; remainder > 0 && i >= 0; i -= 1) {
    parts[i] += 1;
    remainder -= 1;
  }
  return parts;
}

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
