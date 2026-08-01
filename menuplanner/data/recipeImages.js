/**
 * Meal suggestion plate photos — menuplanner/assets/meals/
 *
 * Upload new images as `{templateId}.jpg` (or .png). Legacy filenames below
 * until re-uploaded. Missing files show plate-fallback.jpg in the UI.
 *
 * Template ids (from recipeLibrary.js):
 *   egg-substitute-oatmeal        Egg Substitute & Oatmeal
 *   egg-whites-bread              Egg Whites & Whole Wheat Bread
 *   yogurt-oatmeal-blueberries    Yogurt & Oatmeal
 *   turkey-sweet-potato-spinach   Turkey, Sweet Potato & Spinach
 *   chicken-rice-broccoli-lemon   Chicken, Rice & Broccoli
 *   chicken-rice-broccoli-cajun   Chicken, Rice & Green Beans
 *   shrimp-stir-fry-rice          Shrimp Stir-Fry
 *   cod-rice-kale                 Cod, Rice & Kale
 *   turkey-beans-cabbage          Turkey, Black Beans & Cabbage
 *   tuna-sweet-potato             Tuna, Potato Mash & Cauliflower
 *   chicken-sweet-potato-green-beans  Chicken, Baby Reds & Carrots
 *   tuna-tortilla-bok-choy        Tuna, Tortilla & Bok Choy
 *   steak-tortilla-peppers-fajita Steak, Tortilla & Bell Peppers
 *   chicken-beans-rice            Chicken, Black Beans, Rice & Asparagus
 *   sirloin-baked-potato-snap-peas Sirloin, Baked Potato & Snap Peas
 *   beef-ground-round-potato      Ground Round Burgers
 *   southwest-chicken-bowl        Southwest Chicken Bowl
 *
 * Audit: npm run verify:meals
 */

const MEAL_ASSET_BASE = '../menuplanner/assets/meals';
const PLATE_FALLBACK_FILE = 'plate-fallback.jpg';

/** @type {Readonly<Record<string, string>>} templateId → filename (legacy names) */
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
