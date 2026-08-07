/**
 * Vegetables × 10g carb (40 cal) × fruits × 72 cal — Burn Engine VE/FQ slots.
 * From js/burnEngine.js computeServingsPhase:
 *   VE × 40 cal/serving, VE × 3g fat baked in → ~10g carbs @ 4 cal/g
 *   FQ × 72 cal/serving, FQ × 4g fat baked in → 72 kcal portion
 * Gram weights match data/foods.json (catalog source of truth).
 */

/** @type {ReadonlyArray<{ label: string, catalog: string, kind: 'vegetable'|'fruit' }>} */
const MERGED = [
  { label: 'Asparagus', catalog: 'Asparagus, cooked', kind: 'vegetable' },
  { label: 'Bell peppers', catalog: 'Peppers, red bell, cooked', kind: 'vegetable' },
  { label: 'Broccoli', catalog: 'Broccoli, cooked', kind: 'vegetable' },
  { label: 'Carrots', catalog: 'Carrots, cooked', kind: 'vegetable' },
  { label: 'Cauliflower', catalog: 'Cauliflower, cooked', kind: 'vegetable' },
  { label: 'Cucumbers', catalog: 'Cucumber', kind: 'vegetable' },
  { label: 'Garlic', catalog: 'Garlic', kind: 'vegetable' },
  { label: 'Green beans', catalog: 'Green beans, cooked', kind: 'vegetable' },
  { label: 'Mixed salad greens', catalog: 'Lettuce, romaine', kind: 'vegetable' },
  { label: 'Mushrooms', catalog: 'Mushrooms, white, cooked', kind: 'vegetable' },
  { label: 'Spinach', catalog: 'Spinach, cooked', kind: 'vegetable' },
  { label: 'Tomatoes', catalog: 'Tomato, raw', kind: 'vegetable' },
  { label: 'Apples', catalog: 'Apples', kind: 'fruit' },
  { label: 'Bananas', catalog: 'Bananas', kind: 'fruit' },
  { label: 'Blueberries', catalog: 'Blueberries', kind: 'fruit' },
  { label: 'Clementines', catalog: 'Clementines', kind: 'fruit' },
  { label: 'Grapes', catalog: 'Grapes', kind: 'fruit' },
  { label: 'Pineapple', catalog: 'Pineapple', kind: 'fruit' },
  { label: 'Strawberries', catalog: 'Strawberries', kind: 'fruit' },
  { label: 'Tangerines', catalog: 'Tangerines', kind: 'fruit' },
  { label: 'Watermelon', catalog: 'Watermelon', kind: 'fruit' },
];

/** USDA FoodData Central — c=carbs g/100g, k=kcal/100g, f=fat g/100g */
const USDA = {
  'Asparagus, cooked': { c: 4.1, k: 22, f: 0.2 },
  'Peppers, red bell, cooked': { c: 6.3, k: 28, f: 0.2 },
  'Broccoli, cooked': { c: 7.2, k: 35, f: 0.4 },
  'Carrots, cooked': { c: 8.2, k: 35, f: 0.2 },
  'Cauliflower, cooked': { c: 4.1, k: 23, f: 0.5 },
  Cucumber: { c: 3.6, k: 15, f: 0.1 },
  Garlic: { c: 33.1, k: 149, f: 0.5 },
  'Green beans, cooked': { c: 7.1, k: 35, f: 0.3 },
  'Lettuce, romaine': { c: 3.3, k: 17, f: 0.3 },
  'Mushrooms, white, cooked': { c: 5.3, k: 28, f: 0.5 },
  'Spinach, cooked': { c: 3.8, k: 23, f: 0.3 },
  'Tomato, raw': { c: 3.9, k: 18, f: 0.2 },
  Apples: { c: 13.8, k: 52, f: 0.2 },
  Bananas: { c: 22.8, k: 89, f: 0.3 },
  Blueberries: { c: 14.5, k: 57, f: 0.3 },
  Clementines: { c: 12.0, k: 47, f: 0.2 },
  Grapes: { c: 18.1, k: 69, f: 0.2 },
  Pineapple: { c: 13.1, k: 50, f: 0.1 },
  Strawberries: { c: 7.7, k: 32, f: 0.3 },
  Tangerines: { c: 13.3, k: 53, f: 0.3 },
  Watermelon: { c: 7.6, k: 30, f: 0.2 },
};

const VEG_CARB_TARGET = 10;
const VEG_CAL = 40;
const VEG_FAT_LIMIT = 3;
const FRUIT_CAL_TARGET = 72;
const FRUIT_FAT_LIMIT = 4;

import foods from '../data/foods.json' with { type: 'json' };

function audit(item) {
  const u = USDA[item.catalog];
  const catalogRow = foods.find((f) => f.name === item.catalog);
  const grams = catalogRow?.gramWeight ?? 0;

  if (item.kind === 'vegetable') {
    const carbsAt = Math.round((grams * u.c) / 100 * 10) / 10;
    const calAt = Math.round((grams * u.k) / 100);
    const fatAt = Math.round((grams * u.f) / 100 * 10) / 10;
    const expected = Math.round(1000 / u.c);
    return {
      label: item.label,
      kind: item.kind,
      grams,
      expected,
      carbsAt,
      calAt,
      fatAt,
      pass: Math.abs(carbsAt - VEG_CARB_TARGET) <= 1.5 && fatAt <= VEG_FAT_LIMIT,
    };
  }

  const calAt = Math.round((grams * u.k) / 100);
  const fatAt = Math.round((grams * u.f) / 100 * 10) / 10;
  const expected = Math.round(7200 / u.k);
  return {
    label: item.label,
    kind: item.kind,
    grams,
    expected,
    calAt,
    fatAt,
    pass: Math.abs(calAt - FRUIT_CAL_TARGET) <= 8 && fatAt <= FRUIT_FAT_LIMIT,
  };
}

const rows = MERGED.map(audit);
const veg = rows.filter((r) => r.kind === 'vegetable');
const fruit = rows.filter((r) => r.kind === 'fruit');

console.log('=== VEGETABLES × 10g carb (40 cal) — Burn Engine VE ===');
console.log(`Target: ~${VEG_CARB_TARGET}g carbs (~${VEG_CAL} cal), fat ≤ ${VEG_FAT_LIMIT}g\n`);
for (const r of veg) {
  console.log(
    `  ${r.label.padEnd(22)} ${String(r.grams).padStart(3)}g  ${r.carbsAt}g carb  ${r.calAt} cal  ${r.fatAt}g fat  ${r.pass ? 'OK' : 'CHECK'}`,
  );
}

console.log('\n=== FRUITS × 72 cal — Burn Engine FQ ===');
console.log(`Target: ~${FRUIT_CAL_TARGET} cal, fat ≤ ${FRUIT_FAT_LIMIT}g\n`);
for (const r of fruit) {
  console.log(
    `  ${r.label.padEnd(22)} ${String(r.grams).padStart(3)}g  ${r.calAt} cal  ${r.fatAt}g fat  ${r.pass ? 'OK' : 'CHECK'}`,
  );
}

const fails = rows.filter((r) => !r.pass);
if (fails.length) {
  console.log(`\n${fails.length} item(s) need review.`);
  process.exitCode = 1;
} else {
  console.log(`\nAll ${rows.length} merged staples pass VE/FQ criteria.`);
}
