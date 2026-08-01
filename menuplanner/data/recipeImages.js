/**
 * Meal suggestion plate photos — menuplanner/assets/meals/
 *
 * Upload as `{templateId}.jpg` or `.png` when meals are added.
 * Missing files show plate-fallback.jpg in the UI.
 *
 * Audit: npm run verify:meals
 */

const MEAL_ASSET_BASE = '../menuplanner/assets/meals';
const PLATE_FALLBACK_FILE = 'plate-fallback.jpg';

/** @type {Readonly<Record<string, string>>} DIY legacy filenames only */
export const MEAL_IMAGE_LEGACY = {
  'egg-substitute-oatmeal': 'power-breakfast.jpg',
  'egg-whites-bread': 'egg-toast.jpg',
  'yogurt-oatmeal-blueberries': 'oatmeal-bowl.jpg',
  'chicken-rice-broccoli-lemon': 'chicken-rice-broccoli.jpg',
  'chicken-rice-broccoli-cajun': 'chicken-rice-broccoli.jpg',
  'steak-tortilla-peppers-fajita': 'steak-fajita.jpg',
  'chicken-beans-rice': 'chicken-rice-broccoli.jpg',
};

/** Explicit filenames when extension is not .jpg */
export const MEAL_IMAGE_FILES = {
  'garlic-herb-shrimp-stir-fry': 'garlic-herb-shrimp-stir-fry.png',
};

export function mealImageFilename(templateId, imageFile) {
  if (imageFile) return imageFile;
  return MEAL_IMAGE_LEGACY[templateId] ?? MEAL_IMAGE_FILES[templateId] ?? `${templateId}.jpg`;
}

function mealImagePath(filename) {
  return `${MEAL_ASSET_BASE}/${filename}`;
}

export function recipeImageFallbackUrl(version = '') {
  const q = version ? `?v=${encodeURIComponent(version)}` : '';
  return `${mealImagePath(PLATE_FALLBACK_FILE)}${q}`;
}

export function recipeImageUrl(templateId, version = '', imageFile = '') {
  const q = version ? `?v=${encodeURIComponent(version)}` : '';
  return `${mealImagePath(mealImageFilename(templateId, imageFile))}${q}`;
}
