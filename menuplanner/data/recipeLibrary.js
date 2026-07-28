/** Meal choices for Page 4 reels — name only, no recipe details. */

export const MEAL_SLOT_COLUMNS = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
];

/** @type {Readonly<Record<string, ReadonlyArray<{ id: string, name: string, emoji: string }>>>} */
export const MEALS_BY_SLOT = {
  breakfast: [
    { id: 'power-breakfast', name: 'Power Breakfast', emoji: '🥩' },
    { id: 'scrambled-eggs', name: 'Scrambled Eggs', emoji: '🍳' },
    { id: 'turkey-wrap-breakfast', name: 'Turkey Wrap', emoji: '🌯' },
    { id: 'yogurt-oats', name: 'Yogurt & Oats', emoji: '🥣' },
    { id: 'cottage-cheese', name: 'Cottage Cheese', emoji: '🧀' },
    { id: 'burrito-breakfast', name: 'Burrito', emoji: '🌮' },
  ],
  lunch: [
    { id: 'power-lunch', name: 'Power Lunch', emoji: '🥩' },
    { id: 'tuna', name: 'Tuna', emoji: '🐟' },
    { id: 'chicken-salad', name: 'Chicken Salad', emoji: '🥗' },
    { id: 'turkey-wrap-lunch', name: 'Turkey Wrap', emoji: '🌯' },
    { id: 'shrimp', name: 'Shrimp', emoji: '🍤' },
    { id: 'burger', name: 'Burger', emoji: '🍔' },
  ],
  dinner: [
    { id: 'power-dinner', name: 'Power Dinner', emoji: '🥩' },
    { id: 'grilled-chicken', name: 'Grilled Chicken', emoji: '🍗' },
    { id: 'fish', name: 'Fish', emoji: '🐟' },
    { id: 'fajitas', name: 'Fajitas', emoji: '🌶️' },
    { id: 'stir-fry', name: 'Stir-Fry', emoji: '🥘' },
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
