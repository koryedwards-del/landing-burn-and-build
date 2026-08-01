/**
 * Fruit picker images — hosted in repo (menuplanner/assets/fruits/).
 */

import { canonicalFruitName } from './fruitNames.js';

/** @type {Readonly<Record<string, string>>} foods.json name → filename */
const FRUIT_IMAGE_FILES = {
  Apples: 'apples.png',
  Bananas: 'bananas.png',
  Blueberries: 'blueberries.png',
  Clementines: 'clementines.png',
  Grapes: 'grapes.png',
  Nectarines: 'nectarines.png',
  Oranges: 'oranges.png',
  Peaches: 'peaches.png',
  Pears: 'pears.png',
  Strawberries: 'strawberries.png',
  Tangerines: 'tangerines.png',
};

/** Single source — planner fruit pool = fruits with picker images only. */
export const FRUIT_NAMES_WITH_IMAGES = Object.keys(FRUIT_IMAGE_FILES).sort((a, b) => a.localeCompare(b));

const FRUIT_ASSET_BASE = '../menuplanner/assets/fruits';

export function fruitImageUrl(foodName, version = '') {
  const file = FRUIT_IMAGE_FILES[canonicalFruitName(foodName)];
  if (!file) return null;
  const q = version ? `?v=${encodeURIComponent(version)}` : '';
  return `${FRUIT_ASSET_BASE}/${file}${q}`;
}

export function fruitHasImage(foodName) {
  return Boolean(FRUIT_IMAGE_FILES[canonicalFruitName(foodName)]);
}
