/**
 * Meal templates for Page 4 — protein + grain/starch (+ veg at dinner).
 *
 * Card title = short ingredient names ("Chicken & Rice", "Steak, Potato & Broccoli").
 * Amounts come from the user's program when they pick a card.
 *
 * To expand the library: run `node scripts/suggest-meal-combos.mjs` for combo ideas,
 * then add items + flavor here (or wire an AI step that outputs the same shape).
 */

export const MEAL_SLOT_COLUMNS = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
];

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

/** @type {Readonly<Record<string, ReadonlyArray<MealCard>>>} */
export const MEALS_BY_SLOT = {
  breakfast: [
    meal(
      'steak-tortilla-breakfast',
      [
        { slot: 'Protein', foodName: 'Beef, eye of round' },
        { slot: 'Grains/Starches', foodName: 'Tortilla, corn (6-inch)' },
      ],
      'Pepper, garlic powder, hot sauce. Seasonings never replace steak or tortilla.',
    ),
    meal(
      'egg-whites-oatmeal',
      [
        { slot: 'Protein', foodName: 'Egg whites' },
        { slot: 'Grains/Starches', foodName: 'Oats, rolled' },
      ],
      'Cinnamon or sweetener. Skip butter unless you count fat points.',
    ),
    meal(
      'turkey-tortilla-breakfast',
      [
        { slot: 'Protein', foodName: 'Turkey breast' },
        { slot: 'Grains/Starches', foodName: 'Tortilla, corn (6-inch)' },
      ],
      'Mustard, salsa, or dry rub on the turkey.',
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
      'ground-beef-tortilla-breakfast',
      [
        { slot: 'Protein', foodName: 'Beef, 95% lean ground' },
        { slot: 'Grains/Starches', foodName: 'Tortilla, corn (6-inch)' },
      ],
      'Cumin, chili powder, salsa. Keep it dry — skip cheese unless counted.',
    ),
  ],
  lunch: [
    meal(
      'steak-tortilla-lunch',
      [
        { slot: 'Protein', foodName: 'Beef, eye of round' },
        { slot: 'Grains/Starches', foodName: 'Tortilla, corn (6-inch)' },
      ],
      'Pepper, garlic powder, hot sauce.',
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
      'turkey-tortilla-lunch',
      [
        { slot: 'Protein', foodName: 'Turkey breast' },
        { slot: 'Grains/Starches', foodName: 'Tortilla, corn (6-inch)' },
      ],
      'Mustard, lettuce, tomato — tomato is free flavor, not a veg serving.',
    ),
    meal(
      'steak-potato-lunch',
      [
        { slot: 'Protein', foodName: 'Beef, top sirloin' },
        { slot: 'Grains/Starches', foodName: 'Potato, baked (flesh + skin)' },
      ],
      'Salt, pepper, steak seasoning. Potato is your grain/starch serving.',
    ),
    meal(
      'ground-beef-tortilla-lunch',
      [
        { slot: 'Protein', foodName: 'Beef, 95% lean ground' },
        { slot: 'Grains/Starches', foodName: 'Tortilla, corn (6-inch)' },
      ],
      'Taco seasoning, salsa, onion powder.',
    ),
  ],
  dinner: [
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
      'steak-tortilla-peppers',
      [
        { slot: 'Protein', foodName: 'Beef, eye of round' },
        { slot: 'Grains/Starches', foodName: 'Tortilla, corn (6-inch)' },
        { slot: 'Veggie', foodName: 'Peppers, red bell, cooked' },
      ],
      'Fajita-style: lime, cumin, chili powder, salsa.',
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
      'steak-tortilla-peppers-sirloin',
      [
        { slot: 'Protein', foodName: 'Beef, top sirloin' },
        { slot: 'Grains/Starches', foodName: 'Tortilla, corn (6-inch)' },
        { slot: 'Veggie', foodName: 'Peppers, red bell, cooked' },
      ],
      'Lime, cumin, salsa. One tortilla — no extras unless counted.',
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
  ],
};

export const RECIPE_LIBRARY = Object.entries(MEALS_BY_SLOT).flatMap(([mealSlot, meals]) =>
  meals.map((entry) => ({ ...entry, mealSlot })),
);

const mealsById = new Map(RECIPE_LIBRARY.map((entry) => [entry.id, entry]));

export function recipeById(id) {
  return mealsById.get(id) ?? null;
}

export function libraryRecipeFitsMealSlot(meal, mealSlotId) {
  return meal?.mealSlot === mealSlotId;
}

export function recipesForMealSlot(mealSlotId) {
  return MEALS_BY_SLOT[mealSlotId] ?? [];
}
