/** Simple meal ideas for Page 4 recipe reels — 5–6 choices per slot, short ingredient hints. */

export const MEAL_SLOT_COLUMNS = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
];

/** @type {Readonly<Record<string, ReadonlyArray<{ id: string, name: string, emoji: string, ingredients: string[] }>>>} */
export const RECIPES_BY_SLOT = {
  breakfast: [
    {
      id: 'power-breakfast',
      name: 'Power Breakfast',
      emoji: '🥩',
      ingredients: ['Beef, eye of round', 'Tortilla, corn'],
    },
    {
      id: 'egg-white-scramble',
      name: 'Egg White Scramble',
      emoji: '🍳',
      ingredients: ['Egg whites', 'Cottage cheese, 2%'],
    },
    {
      id: 'turkey-wrap-breakfast',
      name: 'Turkey Wrap',
      emoji: '🌯',
      ingredients: ['Turkey breast', 'Tortilla, corn'],
    },
    {
      id: 'yogurt-oats',
      name: 'Yogurt & Oats',
      emoji: '🥣',
      ingredients: ['Nonfat yogurt, plain', 'Oats, rolled'],
    },
    {
      id: 'cottage-cheese-bowl',
      name: 'Cottage Cheese Bowl',
      emoji: '🧀',
      ingredients: ['Cottage cheese, 2%', 'Egg whites'],
    },
    {
      id: 'lean-breakfast-burrito',
      name: 'Lean Breakfast Burrito',
      emoji: '🌮',
      ingredients: ['Beef, 95% lean ground', 'Tortilla, corn'],
    },
  ],
  lunch: [
    {
      id: 'power-lunch',
      name: 'Power Lunch',
      emoji: '🥩',
      ingredients: ['Beef, eye of round', 'Tortilla, corn'],
    },
    {
      id: 'tuna-salad',
      name: 'Tuna Salad',
      emoji: '🐟',
      ingredients: ['Tuna, canned in water', 'Nonfat yogurt, plain'],
    },
    {
      id: 'chicken-salad',
      name: 'Chicken Salad',
      emoji: '🥗',
      ingredients: ['Chicken breast, no skin', 'Peppers, red bell'],
    },
    {
      id: 'turkey-wrap-lunch',
      name: 'Turkey Wrap',
      emoji: '🌯',
      ingredients: ['Turkey breast', 'Tortilla, corn'],
    },
    {
      id: 'shrimp-plate',
      name: 'Shrimp Plate',
      emoji: '🍤',
      ingredients: ['Shrimp, fresh', 'Tortilla, corn'],
    },
    {
      id: 'lean-burger',
      name: 'Lean Burger',
      emoji: '🍔',
      ingredients: ['Beef, 95% lean ground', 'Tortilla, corn'],
    },
  ],
  dinner: [
    {
      id: 'power-dinner-salad',
      name: 'Power Dinner w/ Salad',
      emoji: '🥩',
      ingredients: ['Beef, eye of round', 'Tortilla, corn', 'Peppers, red bell'],
    },
    {
      id: 'grilled-chicken',
      name: 'Grilled Chicken',
      emoji: '🍗',
      ingredients: ['Chicken breast, no skin', 'Peppers, red bell'],
    },
    {
      id: 'baked-fish',
      name: 'Baked Fish',
      emoji: '🐟',
      ingredients: ['Cod, fresh', 'Lemon juice'],
    },
    {
      id: 'fajitas',
      name: 'Fajitas',
      emoji: '🌶️',
      ingredients: ['Chicken breast, no skin', 'Peppers, red bell', 'Tortilla, corn'],
    },
    {
      id: 'beef-stir-fry',
      name: 'Beef Stir-Fry',
      emoji: '🥘',
      ingredients: ['Beef, top sirloin', 'Peppers, red bell'],
    },
    {
      id: 'fast-chili',
      name: 'Fast Chili',
      emoji: '🫕',
      ingredients: ['Beef, 95% lean ground', 'Kidney beans'],
    },
  ],
};

/** Flat list for lookup by id (each recipe appears in one slot only). */
export const RECIPE_LIBRARY = Object.entries(RECIPES_BY_SLOT).flatMap(([mealSlot, recipes]) =>
  recipes.map((recipe) => ({ ...recipe, mealSlot })),
);

const recipesById = new Map(RECIPE_LIBRARY.map((recipe) => [recipe.id, recipe]));

export function recipeById(id) {
  return recipesById.get(id) ?? null;
}

export function libraryRecipeFitsMealSlot(recipe, mealSlotId) {
  return recipe?.mealSlot === mealSlotId;
}

export function recipesForMealSlot(mealSlotId) {
  return RECIPES_BY_SLOT[mealSlotId] ?? [];
}
