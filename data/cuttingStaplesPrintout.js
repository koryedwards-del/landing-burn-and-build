/**
 * Bodybuilder's Cutting Diet Grocery Staples — source list for program report PDF food list pages.
 * All PDF food lists derive from GROCERY_STAPLES_* below, except page 5 grains & starches (33 items).
 */

import foods from './foods.json' with { type: 'json' };

/** @typedef {{ name: string, serving?: string }} StapleRow */

/** ### Protein */
export const GROCERY_STAPLES_PROTEIN = Object.freeze([
  'Chicken breast',
  'Lean ground turkey',
  '93–96% lean ground beef',
  'Sirloin steak',
  'Egg whites',
  'Eggs',
  'White fish (cod, tilapia)',
  'Shrimp',
  'Tuna (canned)',
  'Plain Greek yogurt',
  'Cottage cheese',
]);

/** ### Carbohydrates */
export const GROCERY_STAPLES_CARBOHYDRATES = Object.freeze([
  'Old-fashioned oats',
  'Basmati or jasmine rice',
  'Sweet potatoes',
  'Russet potatoes',
  'Whole wheat bread',
  'Whole wheat tortillas',
  'Rice cakes',
  'Black beans',
]);

/** ### Vegetables — grocery staples + YouGov Q1 2025 popular (starches excluded). */
export const GROCERY_STAPLES_VEGETABLES = Object.freeze([
  'Asparagus',
  'Bell peppers',
  'Broccoli',
  'Carrots',
  'Cauliflower',
  'Cucumbers',
  'Green beans',
  'Mushrooms',
  'Spinach',
  'Tomatoes',
]);

/** ### Fruit — grocery staples + YouGov Q1 2025 popular. */
export const GROCERY_STAPLES_FRUIT = Object.freeze([
  'Apples',
  'Bananas',
  'Blueberries',
  'Cantaloupe',
  'Clementines',
  'Dried plums (pitted prunes)',
  'Grapes',
  'Pineapple',
  'Strawberries',
  'Tangerines',
  'Watermelon',
]);

/** ### Flavor Builders — PDF page 7 (shop checklist, no gram servings). */
export const GROCERY_STAPLES_FLAVOR = Object.freeze([
  'Salsa',
  'Mustard',
  'Hot sauce',
  'Low-sodium soy sauce',
  'Lemon/lime',
  'Garlic',
  'Onion',
  'Fresh herbs',
]);

/** ### Seasonings — PDF page 7 (shop checklist, no gram servings). */
export const GROCERY_STAPLES_SEASONINGS = Object.freeze([
  'Salt',
  'Black pepper',
  'Paprika',
  'Chili powder',
  'Cumin',
  'Italian seasoning',
  'Garlic powder',
  'Onion powder',
  'Cinnamon',
]);

/** ### Pantry — PDF page 7 (shop checklist, no gram servings). */
export const GROCERY_STAPLES_PANTRY = Object.freeze([
  'Cooking spray',
  'Nonstick foil',
  'Coffee',
  'Tea',
  'Zero-calorie beverages',
]);

/** PDF page 5 — protein + dairy, A–Z. P1/D1 engine-curated servings (session work). */
export const CUTTING_STAPLES_PROTEIN_DAIRY = Object.freeze([
  { name: 'Chicken breast', serving: '26g' },
  { name: 'Cod', serving: '35g' },
  { name: 'Cottage cheese, 1%', serving: '73g' },
  { name: 'Cottage cheese, 2%', serving: '73g' },
  { name: 'Cottage cheese, nonfat', serving: '78g' },
  { name: 'Egg whites (extra large)', serving: '2 whites' },
  { name: 'Egg whites (small)', serving: '3 whites' },
  { name: 'Eye of round', serving: '27g' },
  { name: 'Greek yogurt, lowfat', serving: '80g' },
  { name: 'Lean ground beef (ground round)', serving: '27g' },
  { name: 'Plain Greek yogurt, nonfat', serving: '78g' },
  { name: 'Ricotta, nonfat', serving: '70g' },
  { name: 'Shrimp', serving: '33g' },
  { name: 'Sirloin steak', serving: '27g' },
  { name: 'Tilapia', serving: '31g' },
  { name: 'Tuna (canned)', serving: '34g' },
  { name: 'Turkey breast', serving: '28g' },
  { name: 'Yogurt, plain, nonfat', serving: '140g' },
]);

/** PDF page 5 — grains & starches, 30 items, A–Z. */
export const CUTTING_STAPLES_GRAINS_STARCHES = Object.freeze([
  { name: 'Bagel', serving: '28g' },
  { name: 'Beans (any on list)', serving: '59g' },
  { name: 'Cheerios', serving: '19g' },
  { name: 'Corn grits', serving: '18g' },
  { name: 'Corn, sweet', serving: '65g' },
  { name: 'Cream of Wheat (dry)', serving: '18g' },
  { name: 'English muffin', serving: '32g' },
  { name: 'Farina (dry)', serving: '18g' },
  { name: 'French bread', serving: '27g' },
  { name: 'Hard roll', serving: '27g' },
  { name: 'Mixed peas and carrots', serving: '140g' },
  { name: 'Multigrain bread', serving: '32g' },
  { name: 'Oatmeal (dry)', serving: '21g' },
  { name: 'Pasta (cooked)', serving: '56g' },
  { name: 'Pasta, whole wheat (cooked)', serving: '53g' },
  { name: 'Peas, green', serving: '90g' },
  { name: 'Peas, split', serving: '68g' },
  { name: 'Pita (pocket)', serving: '25g' },
  { name: 'Popcorn (air popped)', serving: '18g' },
  { name: 'Potato, baked (with skin)', serving: '66g' },
  { name: 'Potato, boiled', serving: '70g' },
  { name: 'Quinoa (cooked)', serving: '66g' },
  { name: 'Rice, brown (cooked)', serving: '60g' },
  { name: 'Rice, white (cooked)', serving: '50g' },
  { name: 'Rye bread', serving: '29g' },
  { name: 'Sweet potato', serving: '68g' },
  { name: 'Tortilla, corn (6-inch)', serving: '31g' },
  { name: 'Tortilla, whole wheat', serving: '31g' },
  { name: 'Whole wheat bread', serving: '34g' },
  { name: 'Whole wheat roll', serving: '27g' },
]);

/**
 * Build a PDF staple row from a foods.json catalog entry.
 * Prep label matches catalog servingDescription (fresh / cooked on the PDF food list).
 * @param {string} label
 * @param {string} catalogName
 */
function catalogStapleRow(label, catalogName) {
  const food = foods.find((f) => f.name === catalogName);
  if (!food) throw new Error(`Missing catalog food: ${catalogName}`);
  const prep = food.servingDescription === 'raw'
    ? 'fresh'
    : food.servingDescription === 'dry'
      ? null
      : 'cooked';
  return Object.freeze({
    name: prep ? `${label} (${prep})` : label,
    serving: `${food.gramWeight}g`,
  });
}

/**
 * PDF page 6 — Vegetables, A–Z. Burn Engine VE slot (see js/burnEngineServingTargetsData.js).
 * Both raw and cooked catalog entries where available (measure per prep).
 * Run: node scripts/veg-fruit-audit.mjs
 */
const VEGETABLE_CATALOG = [
  ['Asparagus', ['Asparagus, cooked', 'Asparagus, raw']],
  ['Bell peppers, orange', ['Peppers, orange bell, cooked', 'Peppers, orange bell, raw']],
  ['Bell peppers, red', ['Peppers, red bell, cooked', 'Peppers, red bell, raw']],
  ['Bell peppers, yellow', ['Peppers, yellow bell, cooked', 'Peppers, yellow bell, raw']],
  ['Broccoli', ['Broccoli, cooked', 'Broccoli, raw']],
  ['Carrots', ['Carrots, cooked', 'Carrots, raw']],
  ['Cauliflower', ['Cauliflower, cooked', 'Cauliflower, raw']],
  ['Cucumbers', ['Cucumber']],
  ['Green beans', ['Green beans, cooked', 'Green beans, raw']],
  ['Mushrooms, white', ['Mushrooms, white, cooked', 'Mushrooms, white, raw']],
  ['Spinach', ['Spinach, cooked', 'Spinach, raw']],
  ['Squash, summer (yellow)', ['Squash, summer (yellow)']],
  ['Squash, winter (hubbard)', ['Squash, winter (hubbard)']],
  ['Squash, zucchini', ['Squash, zucchini']],
  ['Tomatoes', ['Tomato, cooked', 'Tomato, raw']],
];

export const CUTTING_STAPLES_VEGETABLES = Object.freeze(
  VEGETABLE_CATALOG.flatMap(([label, catalogs]) =>
    catalogs.map((catalog) => catalogStapleRow(label, catalog)),
  ).sort((a, b) => a.name.localeCompare(b.name)),
);

/**
 * PDF page 6 — Fruit, A–Z. Burn Engine FQ slot (see js/burnEngineServingTargetsData.js).
 * Gram weights from data/foods.json (BURN_ENGINE_SLOT_TARGETS.FQ.gramNumerator ÷ carbs_per_100g).
 */
const FRUIT_CATALOG = [
  ['Apples', 'Apples'],
  ['Bananas', 'Bananas'],
  ['Blueberries', 'Blueberries'],
  ['Cantaloupe', 'Cantaloupe'],
  ['Clementines', 'Clementines'],
  ['Dried plums (pitted prunes)', 'Prunes, dried, pitted'],
  ['Grapes', 'Grapes'],
  ['Pineapple', 'Pineapple'],
  ['Strawberries', 'Strawberries'],
  ['Tangerines', 'Tangerines'],
  ['Watermelon', 'Watermelon'],
];

export const CUTTING_STAPLES_FRUIT = Object.freeze(
  FRUIT_CATALOG.map(([label, catalog]) => catalogStapleRow(label, catalog)),
);
