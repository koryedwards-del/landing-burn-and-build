/** ETLF seminar meals for Page 4 recipe reels — names + ingredient names only. */

export const MEAL_SLOT_COLUMNS = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
];

/** Preferred reel order per column; remaining meals follow alphabetically. */
export const RECIPE_COLUMN_ORDER = {
  breakfast: ['cottage-cheese-pancakes'],
  lunch: [
    'tuna-spread',
    'poached-cod',
    'lemon-baked-sole',
    'herb-burgers',
    'shish-kabobs',
    'baked-tarragon-chicken',
    'shrimp-stir-fry',
    'easy-one-dish-dinner',
    'fast-chili',
  ],
  dinner: [
    'tuna-spread',
    'poached-cod',
    'lemon-baked-sole',
    'herb-burgers',
    'shish-kabobs',
    'baked-tarragon-chicken',
    'shrimp-stir-fry',
    'easy-one-dish-dinner',
    'fast-chili',
  ],
};

/** @type {ReadonlyArray<{ id: string, name: string, emoji: string, mealTypes: string[], ingredients: string[] }>} */
export const RECIPE_LIBRARY = [
  {
    id: 'cottage-cheese-pancakes',
    name: 'Cottage Cheese Pancakes',
    emoji: '🥞',
    mealTypes: ['breakfast'],
    ingredients: ['Egg whites', 'Cottage cheese, 2%'],
  },
  {
    id: 'tuna-spread',
    name: 'Tuna Spread',
    emoji: '🐟',
    mealTypes: ['lunch', 'dinner'],
    ingredients: ['Tuna, water-packed', 'Nonfat yogurt, plain', 'Dijon mustard', 'Sugar substitute'],
  },
  {
    id: 'poached-cod',
    name: 'Poached Cod',
    emoji: '🐟',
    mealTypes: ['lunch', 'dinner'],
    ingredients: ['Cod, fresh', 'Onion', 'Water', 'Lemon juice', 'Vinegar', 'Peppercorns'],
  },
  {
    id: 'lemon-baked-sole',
    name: 'Lemon-Baked Sole',
    emoji: '🐟',
    mealTypes: ['lunch', 'dinner'],
    ingredients: ['Sole, fresh', 'Warm water', 'Lemon juice', 'Parsley', 'Pepper'],
  },
  {
    id: 'herb-burgers',
    name: 'Herb Burgers',
    emoji: '🍔',
    mealTypes: ['lunch', 'dinner'],
    ingredients: [
      'Ground round steak',
      'Water',
      'Onion',
      'Garlic',
      'Lemon juice',
      'Oregano',
      'Marjoram',
      'Thyme',
      'Salt',
      'Pepper',
    ],
  },
  {
    id: 'shish-kabobs',
    name: 'Shish Kabobs',
    emoji: '🍢',
    mealTypes: ['lunch', 'dinner'],
    ingredients: ['Round steak', 'Cherry tomatoes', 'Onion', 'Green pepper'],
  },
  {
    id: 'baked-tarragon-chicken',
    name: 'Baked Tarragon Chicken',
    emoji: '🍗',
    mealTypes: ['lunch', 'dinner'],
    ingredients: [
      'Chicken breast',
      'Bread crumbs, dry',
      'Dry mustard',
      'Tarragon leaves',
      'Garlic powder',
      'Salt',
      'Pepper',
    ],
  },
  {
    id: 'easy-one-dish-dinner',
    name: 'Easy One-Dish Dinner',
    emoji: '🫕',
    mealTypes: ['lunch', 'dinner'],
    ingredients: [
      'Kidney beans',
      'Corn',
      'Whole tomatoes',
      'Dry bread crumbs',
      'Salt',
      'Onion',
      'Oregano',
      'Sweet basil',
    ],
  },
  {
    id: 'shrimp-stir-fry',
    name: 'Shrimp Stir-Fry',
    emoji: '🍤',
    mealTypes: ['lunch', 'dinner'],
    ingredients: [
      'Shrimp, fresh',
      'Mushrooms, fresh',
      'Green peas, fresh',
      'Onion',
      'Spinach leaves',
      'Celery, 7-1/2"',
      'Water',
      'Soy sauce',
      'Garlic',
      'Cornstarch',
    ],
  },
  {
    id: 'fast-chili',
    name: 'Fast Chili',
    emoji: '🌶️',
    mealTypes: ['lunch', 'dinner'],
    ingredients: [
      'Red beans',
      'Tomato paste',
      'Chili seasoning',
      'Onions',
      'Green pepper',
      'Black pepper',
    ],
  },
];

const recipesById = new Map(RECIPE_LIBRARY.map((recipe) => [recipe.id, recipe]));

export function recipeById(id) {
  return recipesById.get(id) ?? null;
}

export function libraryRecipeFitsMealSlot(recipe, mealSlotId) {
  if (!recipe?.mealTypes?.length) return false;
  if (mealSlotId === 'breakfast') return recipe.mealTypes.includes('breakfast');
  if (mealSlotId === 'lunch') return recipe.mealTypes.includes('lunch');
  if (mealSlotId === 'dinner') return recipe.mealTypes.includes('dinner');
  return false;
}

export function recipesForMealSlot(mealSlotId) {
  const preferredIds = RECIPE_COLUMN_ORDER[mealSlotId] || [];
  const ordered = preferredIds.map((id) => recipesById.get(id)).filter(Boolean);
  const seen = new Set(ordered.map((recipe) => recipe.id));

  const extras = RECIPE_LIBRARY
    .filter((recipe) => libraryRecipeFitsMealSlot(recipe, mealSlotId) && !seen.has(recipe.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  return [...ordered, ...extras];
}
