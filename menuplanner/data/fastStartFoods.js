/**
 * Locked Fast Start food lists — top-ranked bodybuilding staples per planner lane.
 * Reactive planner generate/swap draws from these pools only (~10 max each).
 * Order = priority (meal-prep frequency, lean compliance, 1982 PDF alignment).
 */

import { FAST_START_FRUIT_NAMES, isFastStartFruit } from './fastStartFruits.js';

export { FAST_START_FRUIT_NAMES, isFastStartFruit };

/** Lunch & dinner — lean animal protein, no dairy/eggs. */
export const FAST_START_MAIN_PROTEIN_NAMES = [
  'Chicken breast, no skin',
  'Turkey breast',
  'Beef, eye of round',
  'Beef, top sirloin',
  'Beef, ground round',
  'Tuna, canned in water',
  'Cod, Atlantic, baked',
  'Shrimp, steamed',
  'Tilapia, baked',
  'Flounder, baked',
];

/** Breakfast — dairy & eggs only. */
export const FAST_START_BREAKFAST_PROTEIN_NAMES = [
  'Egg whites',
  'Greek yogurt, nonfat',
  'Cottage cheese, nonfat',
  'Egg substitute (liquid)',
  'Yogurt, plain, nonfat',
  'Skim milk (fat-free)',
];

/** Grains + starches combined (g/s lane). */
export const FAST_START_GS_NAMES = [
  'Rice, basmati',
  'Rice, brown',
  'Oats, rolled',
  'Bread, whole wheat',
  'Sweet potato, baked',
  'Potato, baked (flesh + skin)',
  'Beans, black',
  'Tortilla, corn (6-inch)',
  'Potato, red, boiled',
  'Pasta, regular',
];

/** Vegetables — high-volume, meal-prep friendly. */
export const FAST_START_VEGETABLE_NAMES = [
  'Broccoli, cooked',
  'Green beans, cooked',
  'Asparagus, cooked',
  'Spinach, cooked',
  'Kale, cooked',
  'Cauliflower, cooked',
  'Peppers, red bell, cooked',
  'Carrots, cooked',
  'Mushrooms, white, cooked',
  'Cabbage, green, cooked',
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
