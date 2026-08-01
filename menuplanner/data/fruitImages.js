/**
 * Fruit picker images — hosted in repo (menuplanner/assets/fruits/).
 *
 * **Planner fruit pool:** any fruit listed here (with a PNG) is eligible for
 * generate/swap. Add a row below + drop the asset in assets/fruits/ — the list
 * expands automatically; no other file to edit.
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

/** Alphabetical — derived from FRUIT_IMAGE_FILES; grows when you add images. */
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

export function fruitImageSortKey(foodName) {
  const name = canonicalFruitName(foodName);
  const idx = FRUIT_NAMES_WITH_IMAGES.indexOf(name);
  return idx >= 0 ? idx : Number.MAX_SAFE_INTEGER;
}
