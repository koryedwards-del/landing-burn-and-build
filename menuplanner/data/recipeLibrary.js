/**
 * Meal ideas for Page 4 — protein + grain/starch (+ optional veg).
 *
 * Fast Start: no fat, sugar, or alcohol in template items or caveats.
 * Use salt/peppers, herbs and spices to taste — appended as the last sentence on every idea card.
 * Slot-agnostic: any template can fill breakfast, lunch, or dinner.
 * Card title = ingredient names. Profile + caveat = optional flavor spark.
 * Gram amounts live on the weekly PDF — apply still uses the user's program.
 *
 * Split categories: multiple foods in the same slot share servings
 * (e.g. black beans + rice both Grains/Starches — each gets half).
 *
 * Curated meal patterns from the food lists — lean protein, grain/starch, optional veg.
 */

import {
  isTransformationMeal,
  transformationMealSortKey,
} from './transformationMeals.js';

/** Short labels for card titles — keep plain and recognizable. */
const FOOD_SHORT = {
  'Beef, eye of round': 'Steak',
  'Beef, top sirloin': 'Sirloin',
  'Beef, ground round': 'Ground Round',
  'Chicken breast, no skin': 'Chicken',
  'Turkey breast': 'Turkey',
  'Tuna, canned in water': 'Tuna',
  'Tilapia, baked': 'Tilapia',
  'Cod, Atlantic, baked': 'Cod',
  'Shrimp, steamed': 'Shrimp',
  'Beans, black': 'Black Beans',
  'Rice, basmati': 'Rice',
  'Tortilla, corn (6-inch)': 'Tortilla',
  'Potato, baked (flesh + skin)': 'Potato',
  'Sweet potato, baked': 'Sweet Potato',
  'Broccoli, cooked': 'Broccoli',
  'Green beans, cooked': 'Green Beans',
  'Asparagus, cooked': 'Asparagus',
  'Kale, cooked': 'Kale',
  'Cauliflower, cooked': 'Cauliflower',
  'Cabbage, green, cooked': 'Cabbage',
  'Bok choy': 'Bok Choy',
  'Spinach, cooked': 'Spinach',
  'Peppers, red bell, cooked': 'Bell Peppers',
  'Egg whites': 'Egg Whites',
  'Egg substitute (liquid)': 'Egg Substitute',
  'Oats, rolled': 'Oatmeal',
  'Yogurt, plain, nonfat': 'Yogurt',
  'Bread, whole wheat': 'Whole Wheat Bread',
};

const MEAL_GRID_SLOTS = new Set(['breakfast', 'lunch', 'dinner']);

/** Filter pills in the Meal Ideas panel. */
export const MEAL_SORTER_PILLS = [
  { id: 'all', label: 'All' },
  { id: 'beef', label: 'Beef' },
  { id: 'dairy-eggs', label: 'Dairy & Eggs' },
  { id: 'grain', label: 'Grain' },
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
    || name.includes('tilapia')
  ) return 'seafood';
  if (
    name === 'eggs'
    || name.includes('egg white')
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

const SEASONING_CLOSER = 'Use salt/peppers, herbs and spices to taste.';

function meal(id, items, { profile, caveat, tags, name } = {}) {
  const body = (caveat ?? '').trim();
  const flavor = body ? `${body} ${SEASONING_CLOSER}` : SEASONING_CLOSER;
  return {
    id,
    name: name ?? mealNameFromItems(items),
    items,
    profile,
    flavor,
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
  // —— Breakfast staples ——
  meal('egg-substitute-oatmeal', [
    { slot: 'Protein', foodName: 'Egg substitute (liquid)' },
    { slot: 'Grains/Starches', foodName: 'Oats, rolled' },
  ], {
    name: 'Egg Substitute & Oatmeal',
    profile: 'Classic',
    caveat: 'Oats are measured dry. Add water and salt to taste. Scramble egg substitute in a non-stick pan — PAM cooking spray is recommended to prevent sticking.',
  }),
  meal('egg-whites-bread', [
    { slot: 'Protein', foodName: 'Egg whites' },
    { slot: 'Grains/Starches', foodName: 'Bread, whole wheat' },
  ], {
    name: 'Egg Whites & Whole Wheat Bread',
    profile: 'Classic',
    caveat: 'Scramble egg whites in a non-stick pan — PAM cooking spray is recommended to prevent sticking. Bread plain — no butter, jam, or spread.',
  }),
  meal('yogurt-oatmeal-blueberries', [
    { slot: 'Protein', foodName: 'Yogurt, plain, nonfat' },
    { slot: 'Grains/Starches', foodName: 'Oats, rolled' },
  ], {
    name: 'Yogurt & Oatmeal',
    profile: 'Proats',
    caveat: 'Oats are measured dry. Add water and salt to taste. Cool slightly. Add a handful of berries — they don\'t count toward your fruit servings.',
  }),
  meal('turkey-sweet-potato-spinach', [
    { slot: 'Protein', foodName: 'Turkey breast' },
    { slot: 'Grains/Starches', foodName: 'Sweet potato, baked' },
    { slot: 'Veggie', foodName: 'Spinach, cooked' },
  ], {
    profile: 'Power bowl',
    caveat: 'Dice cooked sweet potato. Sauté turkey in a non-stick pan — PAM cooking spray is recommended to prevent sticking. Garlic powder. When turkey is done, add spinach to the hot pan — toss 1–2 minutes on medium heat until every leaf wilts. No need to drain.',
  }),

  // —— Chicken & rice bowls ——
  meal('chicken-rice-broccoli-lemon', CHICKEN_RICE_BROCCOLI, {
    profile: 'Lemon-herb',
    caveat: 'Roast chicken and broccoli on one oven tray. Lemon juice and dried herbs on everything — cook extra if you\'re meal prepping.',
  }),
  meal('chicken-rice-broccoli-cajun', [
    { slot: 'Protein', foodName: 'Chicken breast, no skin' },
    { slot: 'Grains/Starches', foodName: 'Rice, basmati' },
    { slot: 'Veggie', foodName: 'Green beans, cooked' },
  ], {
    profile: 'Cajun',
    caveat: 'Use a dry rub to coat chicken — your choice. PAM cooking spray is recommended to prevent sticking. Cook in a hot non-stick pan until the chicken is dark on the outside and cooked through. Green beans steamed; rice cooked separately.',
  }),
  meal('shrimp-stir-fry-rice', [
    { slot: 'Protein', foodName: 'Shrimp, steamed' },
    { slot: 'Grains/Starches', foodName: 'Rice, basmati' },
    { slot: 'Veggie', foodName: 'Broccoli, cooked' },
    { slot: 'Veggie', foodName: 'Mushrooms, white, cooked' },
    { slot: 'Veggie', foodName: 'Peppers, red bell, cooked' },
  ], {
    name: 'Shrimp Stir-Fry',
    profile: 'Meal prep',
    caveat: 'Stir-fry a double batch in a wok — PAM recommended. Cook shrimp with broccoli, mushrooms, and bell peppers until pink. Portion into containers; cook rice separately and add when you eat.',
  }),
  meal('cod-rice-kale', [
    { slot: 'Protein', foodName: 'Cod, Atlantic, baked' },
    { slot: 'Grains/Starches', foodName: 'Rice, basmati' },
    { slot: 'Veggie', foodName: 'Kale, cooked' },
  ], {
    name: 'Cod, Rice & Kale',
    profile: 'Lemon-herb',
    caveat: 'Heat the oven. Put cod and kale on one tray. Lemon juice and dried herbs on the fish. Bake until the cod flakes and the kale is tender. Rice cooked separately.',
  }),

  // —— Variations on the classic bowl ——
  meal('turkey-beans-cabbage', [
    { slot: 'Protein', foodName: 'Turkey breast' },
    { slot: 'Grains/Starches', foodName: 'Beans, black' },
    { slot: 'Veggie', foodName: 'Cabbage, green, cooked' },
  ], {
    name: 'Turkey, Black Beans & Cabbage',
    profile: 'Latin',
    caveat: 'Slice or dice turkey breast. PAM cooking spray is recommended to prevent sticking. Cook in a non-stick pan until done. Black beans heated; cabbage steamed or sautéed until tender.',
  }),
  meal('tuna-sweet-potato', [
    { slot: 'Protein', foodName: 'Tuna, canned in water' },
    { slot: 'Grains/Starches', foodName: 'Sweet potato, baked' },
    { slot: 'Grains/Starches', foodName: 'Potato, boiled' },
    { slot: 'Veggie', foodName: 'Cauliflower, cooked' },
  ], {
    name: 'Tuna, Potato Mash & Cauliflower',
    profile: 'Classic',
    caveat: 'Drain tuna well. Boil the sweet potato and white potato together, or microwave until tender — then mash together. Cauliflower steamed or roasted until tender.',
  }),
  meal('chicken-sweet-potato-green-beans', [
    { slot: 'Protein', foodName: 'Chicken breast, no skin' },
    { slot: 'Grains/Starches', foodName: 'Potato, red, boiled' },
    { slot: 'Veggie', foodName: 'Carrots, cooked' },
  ], {
    name: 'Chicken, Baby Reds & Carrots',
    profile: 'Cut',
    caveat: 'Heat the oven. Put chicken, baby red potatoes, and carrots on one tray. Roast until the chicken is done and the potatoes and carrots are tender.',
  }),
  meal('tuna-tortilla-bok-choy', [
    { slot: 'Protein', foodName: 'Tuna, canned in water' },
    { slot: 'Grains/Starches', foodName: 'Tortilla, corn (6-inch)' },
    { slot: 'Veggie', foodName: 'Bok choy' },
  ], {
    name: 'Tuna, Tortilla & Bok Choy',
    profile: 'Classic',
    caveat: 'Drain tuna well. PAM cooking spray is recommended to prevent sticking. Sauté bok choy in a non-stick pan until tender. Load the tortilla with tuna and bok choy.',
  }),

  // —— Hearty / dinner ——
  meal('steak-tortilla-peppers-fajita', [
    { slot: 'Protein', foodName: 'Beef, eye of round' },
    { slot: 'Grains/Starches', foodName: 'Tortilla, corn (6-inch)' },
    { slot: 'Veggie', foodName: 'Peppers, red bell, cooked' },
  ], {
    profile: 'Fajita',
    caveat: 'Slice steak thin; cumin, chili powder, lime. Peppers sautéed — load the tortilla.',
  }),
  meal('chicken-beans-rice', [
    { slot: 'Protein', foodName: 'Chicken breast, no skin' },
    { slot: 'Grains/Starches', foodName: 'Beans, black' },
    { slot: 'Grains/Starches', foodName: 'Rice, basmati' },
    { slot: 'Veggie', foodName: 'Asparagus, cooked' },
  ], {
    name: 'Chicken, Black Beans, Rice & Asparagus',
    profile: 'Latin',
    caveat: 'Cumin, garlic, cilantro on chicken. PAM cooking spray is recommended to prevent sticking. Cook chicken in a hot non-stick pan until done. Black beans and rice heated separately; asparagus steamed or roasted until tender.',
  }),
  meal('sirloin-baked-potato-snap-peas', [
    { slot: 'Protein', foodName: 'Beef, top sirloin' },
    { slot: 'Grains/Starches', foodName: 'Potato, baked (flesh + skin)' },
    { slot: 'Veggie', foodName: 'Snap peas (sugar snap)' },
  ], {
    name: 'Sirloin, Baked Potato & Snap Peas',
    profile: 'Classic',
    caveat: 'PAM cooking spray is recommended to prevent sticking. Cook steak in a non-stick pan until done to your liking. Bake the potato until tender. Oversalt the potato — tastes like it has butter on it. Ok, not really, but better than struggling. Some people love plain yogurt as a replacement for sour cream on the potato. Snap peas steamed or roasted until tender. A good steak deserves a good steak sauce.',
  }),
  meal('beef-ground-round-potato', [
    { slot: 'Protein', foodName: 'Beef, ground round' },
    { slot: 'Grains/Starches', foodName: 'Hamburger/hot dog bun' },
  ], {
    name: 'Ground Round Burgers',
    profile: 'Classic',
    caveat: 'Ask the butcher to grind trimmed ground round — not grab-and-go hamburger. PAM cooking spray is recommended to prevent sticking. Form patties and cook in a non-stick pan until done. Buns plain — no butter or spread.',
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

/** 8-Week Transformation curated prep cards (fast-start panel). */
export function transformationMealTemplates() {
  return MEAL_TEMPLATES
    .filter((meal) => isTransformationMeal(meal.id))
    .sort((a, b) => transformationMealSortKey(a.id) - transformationMealSortKey(b.id));
}

/** Any template fits breakfast, lunch, or dinner — scaling follows the target grid slot. */
export function libraryRecipeFitsMealSlot(meal, mealSlotId) {
  return Boolean(meal) && MEAL_GRID_SLOTS.has(mealSlotId);
}

/** @deprecated Use allMealTemplates — slot no longer filters the library. */
export function recipesForMealSlot() {
  return MEAL_TEMPLATES;
}
