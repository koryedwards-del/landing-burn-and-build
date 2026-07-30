/**
 * Fruit picker images — hosted in repo (menuplanner/assets/fruits/).
 */

/** @type {Readonly<Record<string, string>>} foods.json name → filename */
const FRUIT_IMAGE_FILES = {
  Apple: 'apples.png',
  Banana: 'bananas.png',
  Grapes: 'grapes.png',
  Orange: 'oranges.png',
  Pear: 'pears.png',
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
