/**
 * Meal templates for Page 4 — protein + grain/starch (+ optional veg).
 *
 * Slot-agnostic: any template can fill breakfast, lunch, or dinner.
 * Card title = ingredient names. Profile + caveat = cultural flavor spark.
 * Gram amounts live on the weekly PDF — apply still uses the user's program.
 *
 * Test set: 3 samples — same foods, different flavor profiles.
 */

/** Short labels for card titles — keep plain and recognizable. */
const FOOD_SHORT = {
  'Beef, eye of round': 'Steak',
  'Chicken breast, no skin': 'Chicken',
  'Rice, basmati': 'Rice',
  'Tortilla, corn (6-inch)': 'Tortilla',
  'Potato, baked (flesh + skin)': 'Potato',
  'Broccoli, cooked': 'Broccoli',
  'Peppers, red bell, cooked': 'Peppers',
};

const MEAL_GRID_SLOTS = new Set(['breakfast', 'lunch', 'dinner']);

/**
 * @typedef {{ slot: 'Protein' | 'Grains/Starches' | 'Veggie', foodName: string }} MealItem
 * @typedef {{ id: string, name: string, items: MealItem[], profile?: string, flavor?: string }} MealCard
 */

export function shortFoodLabel(foodName) {
  return FOOD_SHORT[foodName] || foodName.split(',')[0].trim();
}

/** Build card title from template items — the foods ARE the name. */
export function mealNameFromItems(items) {
  const labels = items.map((item) => shortFoodLabel(item.foodName));
  if (labels.length === 2) return `${labels[0]} & ${labels[1]}`;
  if (labels.length === 3) return `${labels[0]}, ${labels[1]} & ${labels[2]}`;
  return labels.join(' & ');
}

function meal(id, items, { profile, caveat } = {}) {
  return { id, name: mealNameFromItems(items), items, profile, flavor: caveat };
}

const CHICKEN_RICE_BROCCOLI = [
  { slot: 'Protein', foodName: 'Chicken breast, no skin' },
  { slot: 'Grains/Starches', foodName: 'Rice, basmati' },
  { slot: 'Veggie', foodName: 'Broccoli, cooked' },
];

/** @type {ReadonlyArray<MealCard>} */
export const MEAL_TEMPLATES = [
  meal('chicken-rice-broccoli-soy', CHICKEN_RICE_BROCCOLI, {
    profile: 'Soy stir-fry',
    caveat: 'Soy sauce, ginger, garlic — no extra oil. Broccoli steamed or crisp-tender.',
  }),
  meal('chicken-rice-broccoli-bbq', CHICKEN_RICE_BROCCOLI, {
    profile: 'BBQ',
    caveat: 'Dry rub or sugar-free sauce — watch fat and sugar points. Broccoli roasted; spray oil only.',
  }),
  meal('steak-tortilla-peppers-fajita', [
    { slot: 'Protein', foodName: 'Beef, eye of round' },
    { slot: 'Grains/Starches', foodName: 'Tortilla, corn (6-inch)' },
    { slot: 'Veggie', foodName: 'Peppers, red bell, cooked' },
  ], {
    profile: 'Fajita',
    caveat: 'Lime, cumin, chili powder, salsa. Peppers sautéed or roasted.',
  }),
];

export const RECIPE_LIBRARY = MEAL_TEMPLATES;

const mealsById = new Map(RECIPE_LIBRARY.map((entry) => [entry.id, entry]));

export function recipeById(id) {
  return mealsById.get(id) ?? null;
}

export function allMealTemplates() {
  return MEAL_TEMPLATES;
}

/** Any template fits breakfast, lunch, or dinner — scaling follows the target grid slot. */
export function libraryRecipeFitsMealSlot(meal, mealSlotId) {
  return Boolean(meal) && MEAL_GRID_SLOTS.has(mealSlotId);
}

/** @deprecated Use allMealTemplates — slot no longer filters the library. */
export function recipesForMealSlot() {
  return MEAL_TEMPLATES;
}
