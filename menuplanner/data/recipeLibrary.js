/**
 * Meal suggestions for Page 4 — protein + grain/starch (+ optional veg).
 *
 * Slot-agnostic: any template can fill breakfast, lunch, or dinner.
 * Card title = ingredient names. Profile + caveat = cultural flavor spark.
 * Gram amounts live on the weekly PDF — apply still uses the user's program.
 *
 * Split categories: multiple foods in the same slot share servings
 * (e.g. black beans + rice both Grains/Starches — each gets half).
 */

/** Short labels for card titles — keep plain and recognizable. */
const FOOD_SHORT = {
  'Beef, eye of round': 'Steak',
  'Chicken breast, no skin': 'Chicken',
  'Beans, black': 'Black Beans',
  'Rice, basmati': 'Rice',
  'Tortilla, corn (6-inch)': 'Tortilla',
  'Potato, baked (flesh + skin)': 'Potato',
  'Broccoli, cooked': 'Broccoli',
  'Peppers, red bell, cooked': 'Peppers',
  'Egg whites': 'Egg Whites',
  'Egg substitute (liquid)': 'Egg Substitute',
  'Oats, rolled': 'Oatmeal',
  'Yogurt, plain, nonfat': 'Yogurt',
  'Bread, whole wheat': 'Whole Wheat Toast',
  'Salmon, Atlantic, baked': 'Salmon',
};

const MEAL_GRID_SLOTS = new Set(['breakfast', 'lunch', 'dinner']);

/** Filter pills in the Meal Suggestions panel. */
export const MEAL_SORTER_PILLS = [
  { id: 'all', label: 'All' },
  { id: 'beef', label: 'Beef' },
  { id: 'dairy-eggs', label: 'Dairy & Eggs' },
  { id: 'grain', label: 'Grain' },
  { id: 'pork', label: 'Pork' },
  { id: 'poultry', label: 'Poultry' },
  { id: 'seafood', label: 'Seafood' },
  { id: 'starch', label: 'Starch' },
];

/**
 * @typedef {{ slot: 'Protein' | 'Grains/Starches' | 'Veggie', foodName: string }} MealItem
 * @typedef {{ id: string, name: string, items: MealItem[], profile?: string, flavor?: string, tags?: string[] }} MealCard
 */

function proteinTagForFood(foodName) {
  const name = foodName.toLowerCase();
  if (name.startsWith('beef') || name.includes('bison') || name.includes('venison')) return 'beef';
  if (name.startsWith('chicken') || name.startsWith('turkey')) return 'poultry';
  if (name.startsWith('pork') || name.includes('ham')) return 'pork';
  if (
    name.startsWith('tuna')
    || name.startsWith('cod')
    || name.startsWith('shrimp')
    || name.includes('fish')
    || name.includes('salmon')
    || name.includes('halibut')
    || name.includes('haddock')
    || name.includes('flounder')
  ) return 'seafood';
  if (
    name.includes('egg white')
    || name.includes('egg substitute')
    || name.includes('milk')
    || name.includes('yogurt')
    || name.includes('cottage cheese')
  ) return 'dairy-eggs';
  return null;
}

/** Match foods.json grain vs starch category for G/S filter pills. */
function grainStarchTagForFood(foodName) {
  const name = foodName.toLowerCase();
  if (
    name.includes('rice')
    || name.includes('oat')
    || name.includes('tortilla')
    || name.includes('bread')
    || name.includes('pasta')
    || name.includes('noodle')
    || name.includes('cereal')
    || name.includes('corn,')
    || name.startsWith('corn ')
  ) return 'grain';
  if (
    name.includes('bean')
    || name.includes('potato')
    || name.includes('peas,')
    || name.includes('lentil')
    || name.includes('yam')
    || name.includes('plantain')
  ) return 'starch';
  return null;
}

export function inferMealTags(items) {
  const tags = new Set();

  items.forEach((item) => {
    if (item.slot === 'Grains/Starches') {
      const tag = grainStarchTagForFood(item.foodName);
      if (tag) tags.add(tag);
      return;
    }
    if (item.slot !== 'Protein') return;
    const tag = proteinTagForFood(item.foodName);
    if (tag) tags.add(tag);
  });

  return [...tags];
}

export function mealMatchesSorter(meal, sorterId) {
  if (!sorterId || sorterId === 'all') return true;
  return meal.tags?.includes(sorterId) ?? false;
}

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

function meal(id, items, { profile, caveat, tags, name } = {}) {
  return {
    id,
    name: name ?? mealNameFromItems(items),
    items,
    profile,
    flavor: caveat,
    tags: tags ?? inferMealTags(items),
  };
}

const CHICKEN_RICE_BROCCOLI = [
  { slot: 'Protein', foodName: 'Chicken breast, no skin' },
  { slot: 'Grains/Starches', foodName: 'Rice, basmati' },
  { slot: 'Veggie', foodName: 'Broccoli, cooked' },
];

/** @type {ReadonlyArray<MealCard>} */
export const MEAL_TEMPLATES = [
  meal('egg-whites-oatmeal', [
    { slot: 'Protein', foodName: 'Egg whites' },
    { slot: 'Grains/Starches', foodName: 'Oats, rolled' },
  ], {
    profile: 'Classic',
    caveat: 'Cinnamon or sweetener. Skip butter unless you count fat points.',
  }),
  meal('egg-substitute-toast', [
    { slot: 'Protein', foodName: 'Egg substitute (liquid)' },
    { slot: 'Grains/Starches', foodName: 'Bread, whole wheat' },
  ], {
    profile: 'Classic',
    caveat: 'Scramble the substitute; toast the bread dry or with spray oil. Skip butter unless you count fat points.',
  }),
  meal('egg-whites-toast', [
    { slot: 'Protein', foodName: 'Egg whites' },
    { slot: 'Grains/Starches', foodName: 'Bread, whole wheat' },
  ], {
    profile: 'Classic',
    caveat: 'Scramble the egg whites; toast the bread dry or with spray oil. Skip butter unless you count fat points.',
  }),
  meal('yogurt-oatmeal-blueberries', [
    { slot: 'Protein', foodName: 'Yogurt, plain, nonfat' },
    { slot: 'Grains/Starches', foodName: 'Oats, rolled' },
  ], {
    name: 'Yogurt & Oatmeal with Blueberries',
    profile: 'Classic',
    caveat: 'Cook oats; stir in yogurt. A splash of blueberries on top — not a whole fruit serving.',
  }),
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
  meal('chicken-beans-rice', [
    { slot: 'Protein', foodName: 'Chicken breast, no skin' },
    { slot: 'Grains/Starches', foodName: 'Beans, black' },
    { slot: 'Grains/Starches', foodName: 'Rice, basmati' },
  ], {
    profile: 'Latin',
    caveat: 'Cumin, garlic, cilantro — no extra oil. Black beans and rice split your grain/starch serving evenly.',
  }),
  meal('steak-tortilla-texas', [
    { slot: 'Protein', foodName: 'Beef, eye of round' },
    { slot: 'Grains/Starches', foodName: 'Tortilla, corn (6-inch)' },
  ], {
    profile: 'Texas',
    caveat: 'Mesquite, chili powder, black pepper — dry rub or sugar-free BBQ. Jalapeño for heat is free.',
  }),
  meal('salmon-potato', [
    { slot: 'Protein', foodName: 'Salmon, Atlantic, baked' },
    { slot: 'Grains/Starches', foodName: 'Potato, baked (flesh + skin)' },
  ], {
    profile: 'Classic',
    caveat: 'Lemon, dill, parsley — light spray oil only. Potato roasted or baked; count extra fat if you use more oil.',
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
