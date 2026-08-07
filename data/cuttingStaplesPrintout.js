/**
 * Bodybuilder's Cutting Diet Grocery Staples — source list for program report PDF food list pages.
 * Names match the user master list; servings added per section as pages are built.
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

/** ### Vegetables */
export const GROCERY_STAPLES_VEGETABLES = Object.freeze([
  'Broccoli',
  'Green beans',
  'Spinach',
  'Bell peppers',
  'Mushrooms',
  'Cauliflower',
  'Asparagus',
  'Mixed salad greens',
]);

/** ### Fruit */
export const GROCERY_STAPLES_FRUIT = Object.freeze([
  'Apples',
  'Bananas',
  'Blueberries',
  'Clementines',
  'Strawberries',
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

/** PDF page 5 — Carbohydrates block, A–Z (catalog gram weights for 14g-carb / starch portions). */
export const CUTTING_STAPLES_CARBOHYDRATES = Object.freeze([
  { name: 'Basmati or jasmine rice', serving: '50g' },
  { name: 'Black beans', serving: '59g' },
  { name: 'Old-fashioned oats', serving: '21g' },
  { name: 'Rice cakes', serving: '17g' },
  { name: 'Russet potatoes', serving: '66g' },
  { name: 'Sweet potatoes', serving: '68g' },
  { name: 'Whole wheat bread', serving: '32g' },
  { name: 'Whole wheat tortillas', serving: '31g' },
]);
