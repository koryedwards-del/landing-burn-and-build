/**
 * Back-compat re-exports — planner fruit pool lives in fruitImages.js.
 * @deprecated Prefer fruitHasImage / FRUIT_NAMES_WITH_IMAGES from fruitImages.js.
 */

import {
  FRUIT_NAMES_WITH_IMAGES,
  fruitHasImage,
  fruitImageSortKey,
} from './fruitImages.js';

export const FAST_START_FRUIT_NAMES = FRUIT_NAMES_WITH_IMAGES;
export const isFastStartFruit = fruitHasImage;
export const fastStartFruitSortKey = fruitImageSortKey;
