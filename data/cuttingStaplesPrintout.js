/**
 * Bodybuilder's Cutting Diet Grocery Staples — source list for program report PDF food list pages.
 * Names match the user master list; servings added per section as pages are built.
 */
import { readFileSync } from 'node:fs';
import { foodListLabel } from '../js/foodDisplay.js';

const FOODS_CATALOG = JSON.parse(
  readFileSync(new URL('./foods.json', import.meta.url), 'utf8'),
);

/** @typedef {{ name: string, serving?: string }} StapleRow */

function compCatalogStaples(category) {
  return FOODS_CATALOG
    .filter((food) => food.category === category)
    .sort((a, b) => foodListLabel(a).localeCompare(foodListLabel(b)))
    .map((food) => ({
      name: foodListLabel(food),
      serving: `${food.gramWeight}g`,
    }));
}

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

/** From grocery Carbohydrates — 8-item cutting shop subset (see comp roster below for full list). */

/** 1982 competition grains + starches — 33 items, seminar gram weights, A–Z. */
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

/** Competition catalog — vegetables (Print Shop / foods.json), A–Z. */
export const CUTTING_STAPLES_VEGETABLES = Object.freeze(compCatalogStaples('vegetable'));

/** Competition catalog — fruit (Print Shop / foods.json), A–Z. */
export const CUTTING_STAPLES_FRUIT = Object.freeze(compCatalogStaples('fruit'));
