/**
 * Locked Fast Start fruit list — store jargon, no knife, distinct at the shelf.
 * DIY mode shows the full foods.json fruit catalog.
 */

/** @type {readonly string[]} foods.json names, curated display order */
export const FAST_START_FRUIT_NAMES = [
  'Banana',
  'Apple',
  'Grapes',
  'Pear',
  'Orange',
  'Clementines',
  'Tangerines',
  'Strawberries',
  'Blueberries',
  'Peach',
  'Nectarine',
];

const FAST_START_FRUIT_ORDER = new Map(FAST_START_FRUIT_NAMES.map((name, index) => [name, index]));

export function isFastStartFruit(foodName) {
  return FAST_START_FRUIT_ORDER.has(foodName);
}

export function fastStartFruitSortKey(foodName) {
  return FAST_START_FRUIT_ORDER.get(foodName) ?? Number.MAX_SAFE_INTEGER;
}
