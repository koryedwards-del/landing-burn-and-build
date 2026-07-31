/**
 * Locked Fast Start fruit list — store jargon, no knife, distinct at the shelf.
 * DIY mode shows the full foods.json fruit catalog.
 */

import { canonicalFruitName } from './fruitNames.js';

/** @type {readonly string[]} foods.json names, curated display order */
export const FAST_START_FRUIT_NAMES = [
  'Bananas',
  'Apples',
  'Grapes',
  'Pears',
  'Oranges',
  'Clementines',
  'Tangerines',
  'Strawberries',
  'Blueberries',
  'Peaches',
  'Nectarines',
];

const FAST_START_FRUIT_ORDER = new Map(FAST_START_FRUIT_NAMES.map((name, index) => [name, index]));

export function isFastStartFruit(foodName) {
  return FAST_START_FRUIT_ORDER.has(canonicalFruitName(foodName));
}

export function fastStartFruitSortKey(foodName) {
  return FAST_START_FRUIT_ORDER.get(canonicalFruitName(foodName)) ?? Number.MAX_SAFE_INTEGER;
}
