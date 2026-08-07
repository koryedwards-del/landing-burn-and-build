/**
 * Bodybuilder's Cutting Diet Grocery Staples — source list for program report PDF food list pages.
 * All PDF food lists derive from GROCERY_STAPLES_* below, except page 5 grains & starches (33 items).
 */

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
  'Mixed salad greens',
  'Mushrooms',
  'Spinach',
  'Tomatoes',
]);

/** ### Fruit — grocery staples + YouGov Q1 2025 popular. */
export const GROCERY_STAPLES_FRUIT = Object.freeze([
  'Apples',
  'Bananas',
  'Blueberries',
  'Clementines',
  'Grapes',
  'Pineapple',
  'Strawberries',
  'Tangerines',
  'Watermelon',
]);

/** ### Flavor Builders */
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

/** ### Seasonings */
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

/** ### Pantry */
export const GROCERY_STAPLES_PANTRY = Object.freeze([
  'Cooking spray',
  'Nonstick foil',
  'Coffee',
  'Tea',
  'Zero-calorie beverages',
]);

/** PDF page 5 — protein + dairy, A–Z. P1/D1 engine-curated servings (session work). */
export const CUTTING_STAPLES_PROTEIN_DAIRY = Object.freeze([
  { name: '1% milk', serving: '235g' },
  { name: 'Chicken breast', serving: '26g' },
  { name: 'Cod', serving: '35g' },
  { name: 'Cottage cheese, 1%', serving: '73g' },
  { name: 'Cottage cheese, 2%', serving: '73g' },
  { name: 'Cottage cheese, nonfat', serving: '73g' },
  { name: 'Egg whites (extra large)', serving: '2 whites' },
  { name: 'Egg whites (small)', serving: '3 whites' },
  { name: 'Eye of round', serving: '25g' },
  { name: 'Greek yogurt, lowfat', serving: '84g' },
  { name: 'Lactose-free skim milk', serving: '237g' },
  { name: 'Lean ground beef (ground round)', serving: '27g' },
  { name: 'Plain Greek yogurt, nonfat', serving: '78g' },
  { name: 'Ricotta, nonfat', serving: '73g' },
  { name: 'Shrimp', serving: '33g' },
  { name: 'Sirloin steak', serving: '28g' },
  { name: 'Skim milk', serving: '237g' },
  { name: 'Tilapia', serving: '31g' },
  { name: 'Tuna (canned)', serving: '34g' },
  { name: 'Turkey breast', serving: '28g' },
  { name: 'Yogurt, plain, nonfat', serving: '140g' },
]);

/** PDF page 5 — grains & starches, 33 items, A–Z. */
export const CUTTING_STAPLES_GRAINS_STARCHES = Object.freeze([
  { name: 'Bagel', serving: '25g' },
  { name: 'Beans (any on list)', serving: '66g' },
  { name: 'Cheerios', serving: '19g' },
  { name: 'Corn grits', serving: '23g' },
  { name: 'Corn, sweet', serving: '17g' },
  { name: 'Cream of Wheat (dry)', serving: '19g' },
  { name: 'English muffin', serving: '31g' },
  { name: 'Farina (dry)', serving: '19g' },
  { name: 'French bread', serving: '25g' },
  { name: 'Hard roll', serving: '23g' },
  { name: 'Mixed peas and carrots', serving: '139g' },
  { name: 'Multigrain bread', serving: '29g' },
  { name: 'Oatmeal (dry)', serving: '22g' },
  { name: 'Pasta (cooked)', serving: '61g' },
  { name: 'Pasta, whole wheat (cooked)', serving: '61g' },
  { name: 'Peas, green', serving: '83g' },
  { name: 'Peas, split', serving: '126g' },
  { name: 'Pita (pocket)', serving: '24g' },
  { name: 'Popcorn (air popped)', serving: '36g' },
  { name: 'Potato, baked (with skin)', serving: '86g' },
  { name: 'Potato, boiled', serving: '96g' },
  { name: 'Quinoa (cooked)', serving: '66g' },
  { name: 'Rice, brown (cooked)', serving: '55g' },
  { name: 'Rice, white (cooked)', serving: '58g' },
  { name: 'Rye bread', serving: '27g' },
  { name: 'Squash, summer (yellow)', serving: '325g' },
  { name: 'Squash, winter (hubbard)', serving: '160g' },
  { name: 'Squash, zucchini', serving: '479g' },
  { name: 'Sweet potato', serving: '55g' },
  { name: 'Tortilla, corn (6-inch)', serving: '31g' },
  { name: 'Tortilla, whole wheat', serving: '19g' },
  { name: 'Whole wheat bread', serving: '29g' },
  { name: 'Whole wheat roll', serving: '27g' },
]);

/**
 * PDF page 6 — Vegetables, A–Z. Burn Engine VE: ~10g carbs (40 cal), ≤3g fat.
 * Gram weights from data/foods.json (1000 / carbs_per_100g). Run: node scripts/veg-fruit-audit.mjs
 */
export const CUTTING_STAPLES_VEGETABLES = Object.freeze([
  { name: 'Asparagus', serving: '244g' },
  { name: 'Bell peppers', serving: '159g' },
  { name: 'Broccoli', serving: '139g' },
  { name: 'Carrots', serving: '122g' },
  { name: 'Cauliflower', serving: '244g' },
  { name: 'Cucumbers', serving: '278g' },
  { name: 'Green beans', serving: '141g' },
  { name: 'Mixed salad greens', serving: '303g' },
  { name: 'Mushrooms', serving: '189g' },
  { name: 'Spinach', serving: '263g' },
  { name: 'Tomatoes', serving: '256g' },
]);

/**
 * PDF page 6 — Fruit, A–Z. Burn Engine FQ: 72 cal, ≤4g fat.
 * Gram weights from data/foods.json (7200 / kcal_per_100g).
 */
export const CUTTING_STAPLES_FRUIT = Object.freeze([
  { name: 'Apples', serving: '130g' },
  { name: 'Bananas', serving: '79g' },
  { name: 'Blueberries', serving: '124g' },
  { name: 'Clementines', serving: '150g' },
  { name: 'Grapes', serving: '99g' },
  { name: 'Pineapple', serving: '137g' },
  { name: 'Strawberries', serving: '234g' },
  { name: 'Tangerines', serving: '135g' },
  { name: 'Watermelon', serving: '237g' },
]);
