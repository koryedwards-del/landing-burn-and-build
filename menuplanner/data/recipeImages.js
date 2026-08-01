/**
 * Meal suggestion plate photos — menuplanner/assets/meals/
 *
 * 8-Week Transformation meals: upload as `{templateId}.jpg` (or .png).
 * Missing files show plate-fallback.jpg in the UI.
 *
 * Transformation template ids (transformationMealLibrary.js):
 *   southwest-chicken-bowl
 *   steakhouse-sirloin-plate
 *   garlic-herb-shrimp-stir-fry
 *   tex-mex-steak-fajitas
 *   lemon-pepper-cod-dinner
 *   turkey-harvest-skillet
 *   classic-beef-potato-plate
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

export function mealImageFilename(templateId) {
  return MEAL_IMAGE_LEGACY[templateId] ?? `${templateId}.jpg`;
}

function mealImagePath(filename) {
  return `${MEAL_ASSET_BASE}/${filename}`;
}

export function recipeImageFallbackUrl(version = '') {
  const q = version ? `?v=${encodeURIComponent(version)}` : '';
  return `${mealImagePath(PLATE_FALLBACK_FILE)}${q}`;
}

export function recipeImageUrl(templateId, version = '') {
  const q = version ? `?v=${encodeURIComponent(version)}` : '';
  return `${mealImagePath(mealImageFilename(templateId))}${q}`;
}
