/**
 * Meal suggestion plate photos — hosted in repo (menuplanner/assets/meals/).
 * Curated from docs/mockups/menu-planner-meal-reels.html (saved locally).
 * New templates fall back to plate-fallback until photorealistic assets are added.
 */

const MEAL_ASSET_BASE = '../menuplanner/assets/meals';

const TEMPLATE_IMAGES = {
  'egg-substitute-oatmeal': `${MEAL_ASSET_BASE}/power-breakfast.jpg`,
  'egg-whites-bread': `${MEAL_ASSET_BASE}/egg-toast.jpg`,
  'yogurt-oatmeal-blueberries': `${MEAL_ASSET_BASE}/oatmeal-bowl.jpg`,
  'chicken-rice-broccoli-lemon': `${MEAL_ASSET_BASE}/chicken-rice-broccoli.jpg`,
  'chicken-rice-broccoli-cajun': `${MEAL_ASSET_BASE}/chicken-rice-broccoli.jpg`,
  'shrimp-stir-fry-rice': `${MEAL_ASSET_BASE}/plate-fallback.jpg`,
  'cod-rice-kale': `${MEAL_ASSET_BASE}/plate-fallback.jpg`,
  'turkey-beans-cabbage': `${MEAL_ASSET_BASE}/plate-fallback.jpg`,
  'turkey-sweet-potato-spinach': `${MEAL_ASSET_BASE}/plate-fallback.jpg`,
  'tuna-sweet-potato': `${MEAL_ASSET_BASE}/plate-fallback.jpg`,
  'chicken-sweet-potato-green-beans': `${MEAL_ASSET_BASE}/plate-fallback.jpg`,
  'tuna-tortilla-bok-choy': `${MEAL_ASSET_BASE}/plate-fallback.jpg`,
  'steak-tortilla-peppers-fajita': `${MEAL_ASSET_BASE}/steak-fajita.jpg`,
  'chicken-beans-rice': `${MEAL_ASSET_BASE}/chicken-rice-broccoli.jpg`,
  'sirloin-baked-potato-snap-peas': `${MEAL_ASSET_BASE}/plate-fallback.jpg`,
  'beef-ground-round-potato': `${MEAL_ASSET_BASE}/plate-fallback.jpg`,
};

const PLATE_FALLBACK = `${MEAL_ASSET_BASE}/plate-fallback.jpg`;

export function recipeImageUrl(templateId, version = '') {
  const path = TEMPLATE_IMAGES[templateId] || PLATE_FALLBACK;
  const q = version ? `?v=${encodeURIComponent(version)}` : '';
  return `${path}${q}`;
}
