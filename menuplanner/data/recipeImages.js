/**
 * Meal suggestion plate photos — hosted in repo (menuplanner/assets/meals/).
 * Curated from docs/mockups/menu-planner-meal-reels.html (saved locally).
 */

const MEAL_ASSET_BASE = '../menuplanner/assets/meals';

const TEMPLATE_IMAGES = {
  'egg-substitute-toast': `${MEAL_ASSET_BASE}/egg-toast.jpg`,
  'egg-whites-oatmeal': `${MEAL_ASSET_BASE}/power-breakfast.jpg`,
  'egg-whites-toast': `${MEAL_ASSET_BASE}/egg-toast.jpg`,
  'yogurt-oatmeal-blueberries': `${MEAL_ASSET_BASE}/oatmeal-bowl.jpg`,
  'chicken-rice-broccoli-soy': `${MEAL_ASSET_BASE}/chicken-rice-broccoli.jpg`,
  'chicken-rice-broccoli-bbq': `${MEAL_ASSET_BASE}/chicken-rice-bbq.jpg`,
  'steak-tortilla-peppers-fajita': `${MEAL_ASSET_BASE}/steak-fajita.jpg`,
  'chicken-beans-rice': `${MEAL_ASSET_BASE}/chicken-rice-broccoli.jpg`,
  'steak-tortilla-texas': `${MEAL_ASSET_BASE}/steak-tortilla.jpg`,
  'salmon-potato': `${MEAL_ASSET_BASE}/plate-fallback.jpg`,
};

const PLATE_FALLBACK = `${MEAL_ASSET_BASE}/plate-fallback.jpg`;

export function recipeImageUrl(templateId, version = '') {
  const path = TEMPLATE_IMAGES[templateId] || PLATE_FALLBACK;
  const q = version ? `?v=${encodeURIComponent(version)}` : '';
  return `${path}${q}`;
}
