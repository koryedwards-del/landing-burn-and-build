/**
 * Planner rotate pools — derived from cuttingStaples.js (same foods, lane groupings).
 */

import { fruitHasImage } from './fruitImages.js';
import {
  STAPLE_DAIRY_EGG_NAMES,
  STAPLE_FRUIT_NAMES,
  STAPLE_GS_NAMES,
  STAPLE_MAIN_PROTEIN_NAMES,
  STAPLE_VEGETABLE_NAMES,
} from './cuttingStaples.js';

export const FAST_START_FRUIT_NAMES = STAPLE_FRUIT_NAMES;
export const isFastStartFruit = (foodName) => STAPLE_FRUIT_NAMES.includes(foodName) && fruitHasImage(foodName);

export {
  STAPLE_FRUIT_NAMES,
  STAPLE_DAIRY_EGG_NAMES,
  STAPLE_RED_MEAT_NAMES,
  STAPLE_WHITE_MEAT_NAMES,
  STAPLE_SEAFOOD_NAMES,
  STAPLE_GRAIN_NAMES,
  STAPLE_STARCH_NAMES,
  STAPLE_VEGETABLE_NAMES,
  STAPLE_MAIN_PROTEIN_NAMES,
  STAPLE_GS_NAMES,
  STAPLE_CATALOG_NAMES,
  CUTTING_STAPLE_SHOP_SECTIONS,
} from './cuttingStaples.js';

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
