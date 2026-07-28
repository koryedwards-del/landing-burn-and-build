/** Hero photos for recipe cards — keyed by saved-meal id. */

export const RECIPE_ROW_MEAL_IDS = [
  'power-breakfast',
  'power-lunch',
  'power-dinner-salad',
];

const RECIPE_IMAGES = {
  'power-breakfast': 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=480&h=320&fit=crop',
  'power-lunch': 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=480&h=320&fit=crop',
  'power-dinner-salad': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=480&h=320&fit=crop',
  'power-dinner': 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=480&h=320&fit=crop',
  fajitas: 'https://images.unsplash.com/photo-1599974579688-e97571258369?w=480&h=320&fit=crop',
  'beef-strip-fajitas': 'https://images.unsplash.com/photo-1599974579688-e97571258369?w=480&h=320&fit=crop',
};

const RECIPE_IMAGE_FALLBACK = RECIPE_IMAGES['power-dinner-salad'];

export function recipeImageUrl(mealId) {
  return RECIPE_IMAGES[mealId] || RECIPE_IMAGE_FALLBACK;
}
