/**
 * Bodybuilding staple pools — ~5 per lane (planner rotate + future shop list).
 * Sized for how you actually shop: a few proteins, a few carbs, a few veg —
 * not 10 items per category. Full catalog stays on the print food list.
 */

import { FAST_START_FRUIT_NAMES, isFastStartFruit } from './fastStartFruits.js';

export { FAST_START_FRUIT_NAMES, isFastStartFruit };

/** Lunch & dinner — lean animal protein, no dairy/eggs. */
export const FAST_START_MAIN_PROTEIN_NAMES = [
  'Chicken breast, no skin',
  'Beef, top sirloin',
  'Tuna, canned in water',
  'Tilapia, baked',
  'Turkey breast',
];

/** Breakfast — dairy & eggs only. */
export const FAST_START_BREAKFAST_PROTEIN_NAMES = [
  'Egg whites',
  'Greek yogurt, nonfat',
  'Cottage cheese, nonfat',
  'Yogurt, plain, nonfat',
];

/** Grains + starches combined (g/s lane). */
export const FAST_START_GS_NAMES = [
  'Rice, basmati',
  'Oats, rolled',
  'Sweet potato, baked',
  'Beans, black',
  'Bread, whole wheat',
];

/** Vegetables — high-volume, meal-prep friendly. */
export const FAST_START_VEGETABLE_NAMES = [
  'Broccoli, cooked',
  'Green beans, cooked',
  'Asparagus, cooked',
  'Spinach, cooked',
  'Peppers, red bell, cooked',
];

const MAIN_PROTEIN_ORDER = nameOrderMap(FAST_START_MAIN_PROTEIN_NAMES);
const BREAKFAST_PROTEIN_ORDER = nameOrderMap(FAST_START_BREAKFAST_PROTEIN_NAMES);
const GS_ORDER = nameOrderMap(FAST_START_GS_NAMES);
const VEGETABLE_ORDER = nameOrderMap(FAST_START_VEGETABLE_NAMES);

function nameOrderMap(names) {
  return new Map(names.map((name, index) => [name, index]));
}

export function fastStartNameListForLane(lane, mealSlotId = null) {
  if (lane === 'fruit') return FAST_START_FRUIT_NAMES;
  if (lane === 'protein' && mealSlotId === 'breakfast') return FAST_START_BREAKFAST_PROTEIN_NAMES;
  if (lane === 'protein') return FAST_START_MAIN_PROTEIN_NAMES;
  if (lane === 'gs') return FAST_START_GS_NAMES;
  if (lane === 'vegetable') return FAST_START_VEGETABLE_NAMES;
  return [];
}

export function isFastStartLaneFood(lane, foodName, mealSlotId = null) {
  if (!foodName) return false;
  if (lane === 'fruit') return isFastStartFruit(foodName);
  return fastStartNameListForLane(lane, mealSlotId).includes(foodName);
}

export function fastStartLaneSortKey(lane, foodName, mealSlotId = null) {
  if (lane === 'fruit') {
    const idx = FAST_START_FRUIT_NAMES.indexOf(foodName);
    return idx >= 0 ? idx : Number.MAX_SAFE_INTEGER;
  }
  const order = lane === 'protein' && mealSlotId === 'breakfast'
    ? BREAKFAST_PROTEIN_ORDER
    : lane === 'protein'
      ? MAIN_PROTEIN_ORDER
      : lane === 'gs'
        ? GS_ORDER
        : lane === 'vegetable'
          ? VEGETABLE_ORDER
          : null;
  return order?.get(foodName) ?? Number.MAX_SAFE_INTEGER;
}
