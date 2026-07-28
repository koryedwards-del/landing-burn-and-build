/** Meal ideas for Page 4 reels — short sparks, not full recipes. */

export const MEAL_SLOT_COLUMNS = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
];

/** @type {Readonly<Record<string, ReadonlyArray<{ id: string, name: string, emoji: string }>>>} */
export const MEALS_BY_SLOT = {
  breakfast: [
    { id: 'power-breakfast', name: 'Power', emoji: '🥩' },
    { id: 'eggs', name: 'Eggs', emoji: '🍳' },
    { id: 'wrap-breakfast', name: 'Wrap', emoji: '🌯' },
    { id: 'yogurt', name: 'Yogurt', emoji: '🥣' },
    { id: 'cottage-cheese', name: 'Cottage cheese', emoji: '🧀' },
    { id: 'burrito', name: 'Burrito', emoji: '🌮' },
  ],
  lunch: [
    { id: 'power-lunch', name: 'Power', emoji: '🥩' },
    { id: 'tuna', name: 'Tuna', emoji: '🐟' },
    { id: 'salad', name: 'Salad', emoji: '🥗' },
    { id: 'wrap-lunch', name: 'Wrap', emoji: '🌯' },
    { id: 'shrimp', name: 'Shrimp', emoji: '🍤' },
    { id: 'burger', name: 'Burger', emoji: '🍔' },
  ],
  dinner: [
    { id: 'power-dinner', name: 'Power', emoji: '🥩' },
    { id: 'chicken', name: 'Chicken', emoji: '🍗' },
    { id: 'fish', name: 'Fish', emoji: '🐟' },
    { id: 'fajitas', name: 'Fajitas', emoji: '🌶️' },
    { id: 'stir-fry', name: 'Stir-fry', emoji: '🥘' },
    { id: 'chili', name: 'Chili', emoji: '🫕' },
  ],
};

export const RECIPE_LIBRARY = Object.entries(MEALS_BY_SLOT).flatMap(([mealSlot, meals]) =>
  meals.map((meal) => ({ ...meal, mealSlot })),
);

const mealsById = new Map(RECIPE_LIBRARY.map((meal) => [meal.id, meal]));

export function recipeById(id) {
  return mealsById.get(id) ?? null;
}

export function libraryRecipeFitsMealSlot(meal, mealSlotId) {
  return meal?.mealSlot === mealSlotId;
}

export function recipesForMealSlot(mealSlotId) {
  return MEALS_BY_SLOT[mealSlotId] ?? [];
}
