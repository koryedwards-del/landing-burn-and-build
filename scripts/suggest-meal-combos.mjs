#!/usr/bin/env node
/**
 * Exploratory meal-combo generator — prints template ideas from foods.json.
 *
 * Run: node scripts/suggest-meal-combos.mjs
 *
 * Use output to seed recipeLibrary.js, or pipe to an AI prompt for flavor lines.
 * Rules: breakfast/lunch = 1 protein + 1 G/S; dinner adds 1 vegetable.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mealNameFromItems, shortFoodLabel } from '../menuplanner/data/recipeLibrary.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const foods = JSON.parse(readFileSync(join(root, 'data/foods.json'), 'utf8'));

const proteins = foods.filter((f) => f.category === 'protein').map((f) => f.name);
const starches = foods.filter((f) => f.category === 'grain').map((f) => f.name);
const vegetables = foods.filter((f) => f.category === 'vegetable').map((f) => f.name);

const FLAVOR_HINTS = {
  Steak: 'Salt, pepper, garlic powder.',
  Chicken: 'Poultry seasoning, lemon pepper.',
  Turkey: 'Mustard, sage, poultry seasoning.',
  Tuna: 'Mustard, lemon, hot sauce.',
  Cod: 'Lemon, dill, parsley.',
  'Egg Whites': 'Cinnamon, hot sauce, or everything seasoning.',
  'Skim Milk': 'Vanilla, cinnamon. Both split your protein serving.',
  default: 'Salt, pepper, and one spice you actually like.',
};

function flavorFor(items) {
  const main = shortFoodLabel(items[0].foodName);
  return FLAVOR_HINTS[main] || FLAVOR_HINTS.default;
}

function sample(arr, n) {
  const copy = [...arr].sort(() => Math.random() - 0.5);
  return copy.slice(0, n);
}

function twoPartSlot(slot, foodName) {
  return { slot, foodName };
}

console.log('# Suggested meal combos (explore — paste favorites into recipeLibrary.js)\n');

for (const slot of ['breakfast', 'lunch']) {
  console.log(`## ${slot}`);
  const pairs = [];
  for (const p of sample(proteins, 8)) {
    for (const s of sample(starches, 3)) {
      pairs.push([
        twoPartSlot('Protein', p),
        twoPartSlot('Grains/Starches', s),
      ]);
    }
  }
  sample(pairs, 6).forEach((items, i) => {
    const name = mealNameFromItems(items);
    console.log(`- ${name}`);
    items.forEach((item) => console.log(`    ${item.slot}: ${item.foodName}`));
    console.log(`    flavor: ${flavorFor(items)}`);
    console.log('');
  });
}

console.log('## split protein (same slot — servings split)');
const splitProteins = [
  ['Skim milk (fat-free)', 'Egg whites'],
  ['Cottage cheese, 2% fat', 'Egg whites'],
  ['Yogurt, plain, nonfat', 'Egg whites'],
  ['Turkey breast', 'Egg whites'],
];
splitProteins.forEach(([a, b]) => {
  const items = [
    twoPartSlot('Protein', a),
    twoPartSlot('Protein', b),
  ];
  console.log(`- ${mealNameFromItems(items)}`);
  items.forEach((item) => console.log(`    ${item.slot}: ${item.foodName}`));
  console.log(`    flavor: ${flavorFor(items)}`);
  console.log('');
});

console.log('## dinner');
const dinners = [];
for (const p of sample(proteins, 6)) {
  for (const s of sample(starches, 2)) {
    for (const v of sample(vegetables, 2)) {
      dinners.push([
        twoPartSlot('Protein', p),
        twoPartSlot('Grains/Starches', s),
        twoPartSlot('Veggie', v),
      ]);
    }
  }
}
sample(dinners, 6).forEach((items) => {
  const name = mealNameFromItems(items);
  console.log(`- ${name}`);
  items.forEach((item) => console.log(`    ${item.slot}: ${item.foodName}`));
  console.log(`    flavor: ${flavorFor(items)}`);
  console.log('');
});
