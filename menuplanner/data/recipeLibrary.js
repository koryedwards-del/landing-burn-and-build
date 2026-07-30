/**
 * Meal ideas for Page 4 — protein + grain/starch (+ optional veg).
 *
 * Fast Start: no fat, sugar, or alcohol in template items or caveats.
 * Use salt/pepper and spices as desired — appended as the last sentence on every idea card.
 * Slot-agnostic: any template can fill breakfast, lunch, or dinner.
 * Card title = ingredient names. Profile + caveat = optional flavor spark.
 * Gram amounts live on the weekly PDF — apply still uses the user's program.
 *
 * Split categories: multiple foods in the same slot share servings
 * (e.g. black beans + rice both Grains/Starches — each gets half).
 *
 * Curated from classic bodybuilding prep patterns — lean protein, starch, veg;
 * batch-cook friendly; flavor rotation to beat meal fatigue.
 */

/** Short labels for card titles — keep plain and recognizable. */
const FOOD_SHORT = {
  'Beef, eye of round': 'Steak',
  'Beef, top sirloin': 'Sirloin',
  'Beef, 95% lean ground': 'Lean Ground Beef',
  'Beef, ground round': 'Ground Round',
  'Chicken breast, no skin': 'Chicken',
  'Turkey breast': 'Turkey',
  'Tuna, canned in water': 'Tuna',
  'Tilapia, baked': 'Tilapia',
  'Beans, black': 'Black Beans',
  'Rice, basmati': 'Rice',
  'Tortilla, corn (6-inch)': 'Tortilla',
  'Potato, baked (flesh + skin)': 'Potato',
  'Sweet potato, baked': 'Sweet Potato',
  'Broccoli, cooked': 'Broccoli',
  'Green beans, cooked': 'Green Beans',
  'Asparagus, cooked': 'Asparagus',
  'Spinach, cooked': 'Spinach',
  'Peppers, red bell, cooked': 'Peppers',
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

const SEASONING_CLOSER = 'Use salt/pepper and spices as desired.';

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
    caveat: 'Scramble egg substitute dry in a non-stick pan. Cook oats plain; cinnamon is fine.',
  }),
  meal('egg-substitute-toast', [
    { slot: 'Protein', foodName: 'Egg substitute (liquid)' },
    { slot: 'Grains/Starches', foodName: 'Bread, whole wheat' },
  ], {
    profile: 'Classic',
    caveat: 'Scramble egg substitute dry in a non-stick pan. Toast bread without spread.',
  }),
  meal('yogurt-oatmeal-blueberries', [
    { slot: 'Protein', foodName: 'Yogurt, plain, nonfat' },
    { slot: 'Grains/Starches', foodName: 'Oats, rolled' },
  ], {
    name: 'Yogurt & Oatmeal',
    profile: 'Proats',
    caveat: 'Cook oats, cool slightly, stir in yogurt. Fruit servings stay on snack slots.',
  }),
  meal('turkey-sweet-potato-spinach', [
    { slot: 'Protein', foodName: 'Turkey breast' },
    { slot: 'Grains/Starches', foodName: 'Sweet potato, baked' },
    { slot: 'Veggie', foodName: 'Spinach, cooked' },
  ], {
    profile: 'Power bowl',
    caveat: 'Dice cooked sweet potato. Sauté turkey with garlic powder; wilt spinach at the end.',
  }),

  // —— Chicken & rice bowls (bodybuilding rotation) ——
  meal('chicken-rice-broccoli-lemon', CHICKEN_RICE_BROCCOLI, {
    profile: 'Lemon-herb',
    caveat: 'Sheet-pan chicken and broccoli. Lemon juice and dried herbs on everything — batch six at once.',
  }),
  meal('chicken-rice-broccoli-cajun', CHICKEN_RICE_BROCCOLI, {
    profile: 'Cajun',
    caveat: 'Blackened seasoning on chicken. Broccoli steamed; rice cooked separately.',
  }),
  meal('chicken-rice-broccoli-teriyaki', CHICKEN_RICE_BROCCOLI, {
    profile: 'Teriyaki',
    caveat: 'Soy, ginger, garlic on chicken — light coat only. Broccoli crisp-tender.',
  }),
  meal('chicken-rice-broccoli-bbq', CHICKEN_RICE_BROCCOLI, {
    profile: 'BBQ',
    caveat: 'Dry rub — paprika, garlic powder, chili. No sauce. Broccoli roasted or steamed.',
  }),

  // —— Variations on the classic bowl ——
  meal('turkey-rice-broccoli', [
    { slot: 'Protein', foodName: 'Turkey breast' },
    { slot: 'Grains/Starches', foodName: 'Rice, basmati' },
    { slot: 'Veggie', foodName: 'Broccoli, cooked' },
  ], {
    profile: 'Classic',
    caveat: 'Same prep as chicken and rice. Slice or dice turkey breast; weigh cooked.',
  }),
  meal('tuna-sweet-potato', [
    { slot: 'Protein', foodName: 'Tuna, canned in water' },
    { slot: 'Grains/Starches', foodName: 'Sweet potato, baked' },
  ], {
    profile: 'Classic',
    caveat: 'Drain tuna well. Lemon and pepper over baked or microwaved sweet potato.',
  }),
  meal('chicken-sweet-potato-green-beans', [
    { slot: 'Protein', foodName: 'Chicken breast, no skin' },
    { slot: 'Grains/Starches', foodName: 'Sweet potato, baked' },
    { slot: 'Veggie', foodName: 'Green beans, cooked' },
  ], {
    profile: 'Cut',
    caveat: 'One sheet pan: chicken, sweet potato chunks, green beans. Rotate with rice bowls.',
  }),
  meal('tilapia-rice-broccoli', [
    { slot: 'Protein', foodName: 'Tilapia, baked' },
    { slot: 'Grains/Starches', foodName: 'Rice, basmati' },
    { slot: 'Veggie', foodName: 'Broccoli, cooked' },
  ], {
    profile: 'Classic',
    caveat: 'Bake tilapia plain. Same bowl structure as chicken — mild fish, same prep rhythm.',
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
  ], {
    profile: 'Latin',
    caveat: 'Cumin, garlic, cilantro. Beans and rice each get half your grain/starch serving.',
  }),
  meal('steak-tortilla-texas', [
    { slot: 'Protein', foodName: 'Beef, eye of round' },
    { slot: 'Grains/Starches', foodName: 'Tortilla, corn (6-inch)' },
  ], {
    profile: 'Texas',
    caveat: 'Mesquite and chili dry rub. Jalapeño for heat is free.',
  }),
  meal('top-sirloin-rice-peppers', [
    { slot: 'Protein', foodName: 'Beef, top sirloin' },
    { slot: 'Grains/Starches', foodName: 'Rice, basmati' },
    { slot: 'Veggie', foodName: 'Peppers, red bell, cooked' },
  ], {
    profile: 'Stir-fry',
    caveat: 'Sirloin strips with peppers. Rice on the side — weigh steak cooked.',
  }),
  meal('beef-ground-round-potato', [
    { slot: 'Protein', foodName: 'Beef, ground round' },
    { slot: 'Grains/Starches', foodName: 'Potato, boiled' },
  ], {
    name: 'Ground Round & Potato',
    profile: 'Classic',
    caveat: 'Ask the butcher to grind trimmed ground round — not grab-and-go hamburger.',
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
