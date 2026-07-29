/**
 * Fruit picker images — hosted in repo (menuplanner/assets/fruits/).
 * Add PNGs with transparent backgrounds; map foods.json names to filenames.
 */

/** @type {Readonly<Record<string, string>>} foods.json name → filename (no path) */
const FRUIT_IMAGE_FILES = {
  Apple: 'apple.png',
};

const FRUIT_ASSET_BASE = '../menuplanner/assets/fruits';

export function fruitImageUrl(foodName, version = '') {
  const file = FRUIT_IMAGE_FILES[foodName];
  if (!file) return null;
  const q = version ? `?v=${encodeURIComponent(version)}` : '';
  return `${FRUIT_ASSET_BASE}/${file}${q}`;
}

export function fruitHasImage(foodName) {
  return Boolean(FRUIT_IMAGE_FILES[foodName]);
}
