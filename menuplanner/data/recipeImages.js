/** Hero photos for recipe cards — keyed by saved-meal id. */

export const MEAL_SLOT_COLUMNS = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
];

/** Preferred order per column; fills up to 3 slots per category. */
export const RECIPE_COLUMN_ORDER = {
  breakfast: ['power-breakfast'],
  lunch: ['power-lunch'],
  dinner: ['power-dinner-salad', 'power-dinner', 'fajitas', 'beef-strip-fajitas'],
};

export const RECIPES_PER_COLUMN = 3;

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
