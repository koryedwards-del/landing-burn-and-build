import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { FOOD_LIST_PRINT_PAGES } from '../../data/foodListPrintout.js';
import { foodListLabel } from '../../js/foodDisplay.js';
import { PROTEIN_TIPS_QA } from '../../data/proteinTipsPrintout.js';
import { GRAINS_STARCHES_TIPS_QA } from '../../data/grainsStarchesTipsPrintout.js';
import { VEGETABLE_TIPS_QA } from '../../data/vegetableTipsPrintout.js';
import { FRUIT_TIPS_QA } from '../../data/fruitTipsPrintout.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const foodsPath = path.join(root, 'data/foods.json');

const TIPS_BY_KEY = {
  protein: PROTEIN_TIPS_QA,
  grainsStarches: GRAINS_STARCHES_TIPS_QA,
  vegetable: VEGETABLE_TIPS_QA,
  fruit: FRUIT_TIPS_QA,
};

let foodsCatalog = null;

export function loadFoodsCatalog() {
  if (!foodsCatalog) {
    foodsCatalog = JSON.parse(readFileSync(foodsPath, 'utf8'));
  }
  return foodsCatalog;
}

export function foodsByCategory(categoryId) {
  return loadFoodsCatalog()
    .filter((food) => food.category === categoryId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function splitFoodsInHalf(foods) {
  const splitAt = Math.ceil(foods.length / 2);
  return [foods.slice(0, splitAt), foods.slice(splitAt)];
}

export function foodsForFoodListColumn(columnDef) {
  const foods = foodsByCategory(columnDef.category);
  if (columnDef.split === 'first') return splitFoodsInHalf(foods)[0];
  if (columnDef.split === 'second') return splitFoodsInHalf(foods)[1];
  return foods;
}

export function tipsForColumn(qaKey) {
  return TIPS_BY_KEY[qaKey] || [];
}

/** Food-list tip columns — same titles/order as Print Shop food sheets. */
export const FOOD_SHEET_TIPS_SECTIONS = [
  { title: 'Protein Tips', qaKey: 'protein' },
  { title: 'Grains & Starches Tips', qaKey: 'grainsStarches' },
  { title: 'Vegetable Tips', qaKey: 'vegetable' },
  { title: 'Fruit Tips', qaKey: 'fruit' },
];

export function foodSheetTipsSections() {
  return FOOD_SHEET_TIPS_SECTIONS.map(({ title, qaKey }) => ({
    title,
    items: tipsForColumn(qaKey),
  }));
}

export { FOOD_LIST_PRINT_PAGES, foodListLabel };
