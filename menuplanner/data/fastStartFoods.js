/**
 * Bodybuilding staple pools — shop-sized lists by protein/carb type.
 * Planner generate/swap draws from these only. Counts target real grocery runs.
 */

import { FAST_START_FRUIT_NAMES, isFastStartFruit } from './fastStartFruits.js';

export { FAST_START_FRUIT_NAMES, isFastStartFruit };

/** Breakfast — dairy & eggs (5). */
export const STAPLE_DAIRY_EGG_NAMES = [
  'Egg whites',
  'Greek yogurt, nonfat',
  'Cottage cheese, nonfat',
  'Yogurt, plain, nonfat',
  'Skim milk (fat-free)',
];

/** Lunch/dinner — lean red meat (5). Catalog currently has 3 lean beef cuts. */
export const STAPLE_RED_MEAT_NAMES = [
  'Beef, top sirloin',
  'Beef, eye of round',
  'Beef, ground round',
];

/** Lunch/dinner — poultry (5). Catalog currently has 2 — add cuts in foods.json to fill. */
export const STAPLE_WHITE_MEAT_NAMES = [
  'Chicken breast, no skin',
  'Turkey breast',
];

/** Lunch/dinner — seafood (2). */
export const STAPLE_SEAFOOD_NAMES = [
  'Tuna, canned in water',
  'Tilapia, baked',
];

/** Grains (5). */
export const STAPLE_GRAIN_NAMES = [
  'Rice, basmati',
  'Rice, brown',
  'Oats, rolled',
  'Bread, whole wheat',
  'Pasta, regular',
];

/** Starches (5). */
export const STAPLE_STARCH_NAMES = [
  'Sweet potato, baked',
  'Beans, black',
  'Potato, baked (flesh + skin)',
  'Lentils',
  'Beans, kidney',
];

/** Vegetables — high-volume meal-prep (5). */
export const STAPLE_VEGETABLE_NAMES = [
  'Broccoli, cooked',
  'Green beans, cooked',
  'Asparagus, cooked',
  'Spinach, cooked',
  'Peppers, red bell, cooked',
];

export const STAPLE_MAIN_PROTEIN_NAMES = [
  ...STAPLE_RED_MEAT_NAMES,
  ...STAPLE_WHITE_MEAT_NAMES,
  ...STAPLE_SEAFOOD_NAMES,
];

export const STAPLE_GS_NAMES = [
  ...STAPLE_GRAIN_NAMES,
  ...STAPLE_STARCH_NAMES,
];

const DAIRY_EGG_ORDER = nameOrderMap(STAPLE_DAIRY_EGG_NAMES);
const MAIN_PROTEIN_ORDER = nameOrderMap(STAPLE_MAIN_PROTEIN_NAMES);
const GS_ORDER = nameOrderMap(STAPLE_GS_NAMES);
const VEGETABLE_ORDER = nameOrderMap(STAPLE_VEGETABLE_NAMES);

function nameOrderMap(names) {
  return new Map(names.map((name, index) => [name, index]));
}

export function fastStartNameListForLane(lane, mealSlotId = null) {
  if (lane === 'fruit') return FAST_START_FRUIT_NAMES;
  if (lane === 'protein' && mealSlotId === 'breakfast') return STAPLE_DAIRY_EGG_NAMES;
  if (lane === 'protein') return STAPLE_MAIN_PROTEIN_NAMES;
  if (lane === 'gs') return STAPLE_GS_NAMES;
  if (lane === 'vegetable') return STAPLE_VEGETABLE_NAMES;
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
    ? DAIRY_EGG_ORDER
    : lane === 'protein'
      ? MAIN_PROTEIN_ORDER
      : lane === 'gs'
        ? GS_ORDER
        : lane === 'vegetable'
          ? VEGETABLE_ORDER
          : null;
  return order?.get(foodName) ?? Number.MAX_SAFE_INTEGER;
}
