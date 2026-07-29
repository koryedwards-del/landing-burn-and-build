/**
 * Meal templates for Page 4 — protein + grain/starch (+ optional veg).
 *
 * Slot-agnostic: any template can fill breakfast, lunch, or dinner.
 * Card title = short ingredient names ("Chicken & Rice", "Milk & Egg Whites").
 * Amounts come from the user's program when they pick a card.
 *
 * Split categories: multiple foods in the same slot share that slot's servings
 * (e.g. skim milk + egg whites both Protein — each gets half the protein servings).
 *
 * To expand: run `node scripts/suggest-meal-combos.mjs`
 */

/** Short labels for card titles — keep plain and recognizable. */
const FOOD_SHORT = {
  'Beef, eye of round': 'Steak',
  'Beef, top sirloin': 'Steak',
  'Beef, 95% lean ground': 'Ground Beef',
  'Chicken breast, no skin': 'Chicken',
  'Turkey breast': 'Turkey',
  'Tuna, canned in water': 'Tuna',
  'Cod, Atlantic, baked': 'Cod',
  'Shrimp, fresh': 'Shrimp',
  'Egg whites': 'Egg Whites',
  'Skim milk (fat-free)': 'Skim Milk',
  'Cottage cheese, 2% fat': 'Cottage Cheese',
  'Yogurt, plain, nonfat': 'Yogurt',
  'Tortilla, corn (6-inch)': 'Tortilla',
  'Oats, rolled': 'Oatmeal',
  'Rice, basmati': 'Rice',
  'Rice, white': 'Rice',
  'Potato, baked (flesh + skin)': 'Potato',
  'Potato, boiled': 'Potato',
  'Broccoli, cooked': 'Broccoli',
  'Peppers, red bell, cooked': 'Peppers',
};

const MEAL_GRID_SLOTS = new Set(['breakfast', 'lunch', 'dinner']);

/**
 * @typedef {{ slot: 'Protein' | 'Grains/Starches' | 'Veggie', foodName: string }} MealItem
 * @typedef {{ id: string, name: string, items: MealItem[], flavor?: string }} MealCard
 */

export function shortFoodLabel(foodName) {
  return FOOD_SHORT[foodName] || foodName.split(',')[0].trim();
}

/** Build card title from template items — the two (or three) main foods ARE the name. */
export function mealNameFromItems(items) {
  const labels = items.map((item) => shortFoodLabel(item.foodName));
  if (labels.length === 2) return `${labels[0]} & ${labels[1]}`;
  if (labels.length === 3) return `${labels[0]}, ${labels[1]} & ${labels[2]}`;
  return labels.join(' & ');
}

function meal(id, items, flavor) {
  return { id, name: mealNameFromItems(items), items, flavor };
}

/** @type {ReadonlyArray<MealCard>} */
export const MEAL_TEMPLATES = [
  meal(
    'egg-whites-oatmeal',
    [
      { slot: 'Protein', foodName: 'Egg whites' },
      { slot: 'Grains/Starches', foodName: 'Oats, rolled' },
    ],
    'Cinnamon or sweetener. Skip butter unless you count fat points.',
  ),
  meal(
    'milk-egg-whites',
    [
      { slot: 'Protein', foodName: 'Skim milk (fat-free)' },
      { slot: 'Protein', foodName: 'Egg whites' },
    ],
    'Vanilla, cinnamon, or hot sauce on the eggs. Both count toward your protein serving — split evenly.',
  ),
  meal(
    'cottage-cheese-egg-whites',
    [
      { slot: 'Protein', foodName: 'Cottage cheese, 2% fat' },
      { slot: 'Protein', foodName: 'Egg whites' },
    ],
    'Black pepper, chives, or everything-bagel seasoning.',
  ),
  meal(
    'yogurt-oatmeal',
    [
      { slot: 'Protein', foodName: 'Yogurt, plain, nonfat' },
      { slot: 'Grains/Starches', foodName: 'Oats, rolled' },
    ],
    'Vanilla, cinnamon, or a few berries on top.',
  ),
  meal(
    'steak-tortilla',
    [
      { slot: 'Protein', foodName: 'Beef, eye of round' },
      { slot: 'Grains/Starches', foodName: 'Tortilla, corn (6-inch)' },
    ],
    'Pepper, garlic powder, hot sauce. Seasonings never replace steak or tortilla.',
  ),
  meal(
    'turkey-tortilla',
    [
      { slot: 'Protein', foodName: 'Turkey breast' },
      { slot: 'Grains/Starches', foodName: 'Tortilla, corn (6-inch)' },
    ],
    'Mustard, salsa, or dry rub on the turkey.',
  ),
  meal(
    'chicken-rice',
    [
      { slot: 'Protein', foodName: 'Chicken breast, no skin' },
      { slot: 'Grains/Starches', foodName: 'Rice, basmati' },
    ],
    'Salt, pepper, Mrs. Dash, lemon. Do not swap extra rice for the chicken serving.',
  ),
  meal(
    'tuna-rice',
    [
      { slot: 'Protein', foodName: 'Tuna, canned in water' },
      { slot: 'Grains/Starches', foodName: 'Rice, white' },
    ],
    'Mustard, lemon, or hot sauce. Mayo uses fat points.',
  ),
  meal(
    'steak-potato',
    [
      { slot: 'Protein', foodName: 'Beef, top sirloin' },
      { slot: 'Grains/Starches', foodName: 'Potato, baked (flesh + skin)' },
    ],
    'Salt, pepper, steak seasoning. Potato is your grain/starch serving.',
  ),
  meal(
    'ground-beef-tortilla',
    [
      { slot: 'Protein', foodName: 'Beef, 95% lean ground' },
      { slot: 'Grains/Starches', foodName: 'Tortilla, corn (6-inch)' },
    ],
    'Taco seasoning, salsa, onion powder.',
  ),
  meal(
    'steak-potato-broccoli',
    [
      { slot: 'Protein', foodName: 'Beef, eye of round' },
      { slot: 'Grains/Starches', foodName: 'Potato, baked (flesh + skin)' },
      { slot: 'Veggie', foodName: 'Broccoli, cooked' },
    ],
    'Salt, pepper, garlic. Classic plate — potato is G/S, broccoli is your veg.',
  ),
  meal(
    'chicken-potato-broccoli',
    [
      { slot: 'Protein', foodName: 'Chicken breast, no skin' },
      { slot: 'Grains/Starches', foodName: 'Potato, baked (flesh + skin)' },
      { slot: 'Veggie', foodName: 'Broccoli, cooked' },
    ],
    'Poultry seasoning, lemon pepper, rosemary.',
  ),
  meal(
    'cod-potato-broccoli',
    [
      { slot: 'Protein', foodName: 'Cod, Atlantic, baked' },
      { slot: 'Grains/Starches', foodName: 'Potato, boiled' },
      { slot: 'Veggie', foodName: 'Broccoli, cooked' },
    ],
    'Lemon, dill, parsley. Light spray oil only.',
  ),
  meal(
    'chicken-rice-broccoli',
    [
      { slot: 'Protein', foodName: 'Chicken breast, no skin' },
      { slot: 'Grains/Starches', foodName: 'Rice, basmati' },
      { slot: 'Veggie', foodName: 'Broccoli, cooked' },
    ],
    'Soy sauce, ginger, garlic — stir-fry vibe without extra oil.',
  ),
  meal(
    'steak-tortilla-peppers',
    [
      { slot: 'Protein', foodName: 'Beef, eye of round' },
      { slot: 'Grains/Starches', foodName: 'Tortilla, corn (6-inch)' },
      { slot: 'Veggie', foodName: 'Peppers, red bell, cooked' },
    ],
    'Fajita-style: lime, cumin, chili powder, salsa.',
  ),
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
