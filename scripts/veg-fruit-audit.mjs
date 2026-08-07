/**
 * Vegetables × 10g carb (40 cal) × fruits × 72 cal — Burn Engine VE/FQ slots.
 * Also compares raw vs cooked catalog portions for page-6 vegetables.
 * Run: node scripts/veg-fruit-audit.mjs
 */

import foods from '../data/foods.json' with { type: 'json' };
import {
  CUTTING_STAPLES_FRUIT,
  CUTTING_STAPLES_VEGETABLES,
} from '../data/cuttingStaplesPrintout.js';

/** @type {ReadonlyArray<[string, string, string?]>} label, selected catalog, optional raw catalog */
const VEG_RAW_COOKED = [
  ['Asparagus', 'Asparagus, cooked', 'Asparagus, raw'],
  ['Bell peppers, orange', 'Peppers, orange bell, cooked', 'Peppers, orange bell, raw'],
  ['Bell peppers, red', 'Peppers, red bell, cooked', 'Peppers, red bell, raw'],
  ['Bell peppers, yellow', 'Peppers, yellow bell, cooked', 'Peppers, yellow bell, raw'],
  ['Broccoli', 'Broccoli, cooked', 'Broccoli, raw'],
  ['Carrots', 'Carrots, cooked', 'Carrots, raw'],
  ['Cauliflower', 'Cauliflower, cooked', 'Cauliflower, raw'],
  ['Cucumbers', 'Cucumber'],
  ['Green beans', 'Green beans, cooked', 'Green beans, raw'],
  ['Mushrooms, white', 'Mushrooms, white, cooked', 'Mushrooms, white, raw'],
  ['Spinach', 'Spinach, cooked', 'Spinach, raw'],
  ['Tomatoes', 'Tomato, raw', 'Tomato, cooked'],
];

const VEG_CARB_TARGET = 10;
const VEG_FAT_LIMIT = 3;
const FRUIT_CAL_TARGET = 72;
const FRUIT_FAT_LIMIT = 4;

/** @param {string} name */
function foodRow(name) {
  const f = foods.find((x) => x.name === name);
  if (!f) return null;
  return f;
}

/** @param {string} name @param {number} carbsPer100 */
function vegAudit(name, carbsPer100, grams) {
  const carbsAt = Math.round((grams * carbsPer100) / 100 * 10) / 10;
  const fatAt = Math.round((grams * (foodRow(name)?.fatBracket ?? 0)) / 100 * 10) / 10;
  return {
    grams,
    carbsAt,
    fatAt,
    pass: Math.abs(carbsAt - VEG_CARB_TARGET) <= 1.5 && fatAt <= VEG_FAT_LIMIT,
  };
}

console.log('=== RAW vs COOKED — page 6 vegetables ===');
console.log('Handbook: measure after cooking (vegetableTipsPrintout.js)\n');
console.log(
  'Item'.padEnd(24),
  'Selected'.padEnd(10),
  'Raw'.padStart(6),
  'Cooked'.padStart(8),
  'Delta'.padStart(7),
);
for (const [label, selected, alt] of VEG_RAW_COOKED) {
  const sel = foodRow(selected);
  const rawName = selected.includes(', raw') ? selected : alt?.includes('raw') ? alt : null;
  const cookedName = selected.includes(', cooked') ? selected : alt?.includes('cooked') ? alt : null;
  const rawG = rawName ? foodRow(rawName)?.gramWeight : null;
  const cookedG = cookedName ? foodRow(cookedName)?.gramWeight : null;
  const selPrep = sel?.servingDescription === 'raw' ? 'raw' : 'cooked';
  const delta = rawG != null && cookedG != null ? cookedG - rawG : null;
  console.log(
    label.padEnd(24),
    `${sel?.gramWeight}g ${selPrep}`.padEnd(10),
    rawG != null ? `${rawG}g` : '—',
    cookedG != null ? `${cookedG}g` : '—',
    delta != null ? `${delta > 0 ? '+' : ''}${delta}g` : '—',
  );
}

console.log('\n=== PDF LIST — VE / FQ check ===\n');
console.log('VEGETABLES (~10g carb, ≤3g fat):');
for (const row of CUTTING_STAPLES_VEGETABLES) {
  console.log(`  ${row.name.padEnd(32)} ${row.serving}`);
}

console.log('\nFRUITS (~72 cal, ≤4g fat):');
for (const row of CUTTING_STAPLES_FRUIT) {
  console.log(`  ${row.name.padEnd(32)} ${row.serving}`);
}

console.log(`\n${CUTTING_STAPLES_VEGETABLES.length} vegetables, ${CUTTING_STAPLES_FRUIT.length} fruits on page 6.`);
