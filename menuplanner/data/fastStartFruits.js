/**
 * Locked Fast Start fruit list — must match fruitImages.js (picker thumbnails).
 * DIY mode shows the full foods.json fruit catalog.
 */

import { FRUIT_NAMES_WITH_IMAGES } from './fruitImages.js';
import { canonicalFruitName } from './fruitNames.js';

/** @type {readonly string[]} foods.json names, alphabetical display order */
export const FAST_START_FRUIT_NAMES = FRUIT_NAMES_WITH_IMAGES;

const FAST_START_FRUIT_ORDER = new Map(FAST_START_FRUIT_NAMES.map((name, index) => [name, index]));

export function isFastStartFruit(foodName) {
  return FAST_START_FRUIT_ORDER.has(canonicalFruitName(foodName));
}

export function fastStartFruitSortKey(foodName) {
  return FAST_START_FRUIT_ORDER.get(canonicalFruitName(foodName)) ?? Number.MAX_SAFE_INTEGER;
}
