/**
 * Audit 1982 seminar protein sheet against Burn Engine criteria:
 * - 8g protein per serving (32 cal in T9 loop)
 * - 2g fat per serving (18 cal in TF loop)
 *
 * Weights from 1982 PDF. USDA cooked values per 100g.
 */

/** 1982 protein sheet — exact names and tested gram weights from PDF. */
const PDF_1982_PROTEINS = [
  { name: 'Beef, round steak (ground)', gramWeight: 24 },
  { name: 'Eggs, medium (2 whites/1 yolk)', gramWeight: 69 },
  { name: 'Eggs, substitute (Eggbeaters)', gramWeight: 80 },
  { name: 'Fish, blue', gramWeight: 25 },
  { name: 'Fish, catfish', gramWeight: 31 },
  { name: 'Fish, cod', gramWeight: 28 },
  { name: 'Fish, flounder', gramWeight: 26 },
  { name: 'Fish, haddock', gramWeight: 34 },
  { name: 'Fish, halibut', gramWeight: 38 },
  { name: 'Fish, perch', gramWeight: 42 },
  { name: 'Fish, pike', gramWeight: 44 },
  { name: 'Fish, snapper', gramWeight: 40 },
  { name: 'Fish, sole', gramWeight: 48 },
  { name: 'Fish, swordfish', gramWeight: 28 },
  { name: 'Fish, tuna (water-packed)', gramWeight: 28 },
  { name: 'Poultry, chicken (no skin)', gramWeight: 24 },
  { name: 'Poultry, turkey', gramWeight: 29 },
  { name: 'Seafood, clams', gramWeight: 51 },
  { name: 'Seafood, crab meat', gramWeight: 46 },
  { name: 'Seafood, lobster', gramWeight: 43 },
  { name: 'Seafood, oysters', gramWeight: 95 },
  { name: 'Seafood, scallops', gramWeight: 34 },
  { name: 'Seafood, shrimp', gramWeight: 33 },
  { name: 'Game, venison', gramWeight: 38 },
];

/** USDA FoodData Central — cooked, per 100g. */
const USDA = {
  'Beef, round steak (ground)': { protein: 29.9, fat: 3.4, note: 'trimmed round, cooked' },
  'Eggs, medium (2 whites/1 yolk)': { protein: 10.0, fat: 4.5, note: '2 whites + 1 yolk blend' },
  'Eggs, substitute (Eggbeaters)': { protein: 10.2, fat: 0.0, note: 'liquid egg substitute' },
  'Fish, blue': { protein: 23.4, fat: 6.4, note: 'bluefish baked' },
  'Fish, catfish': { protein: 18.5, fat: 2.9, note: 'channel catfish cooked' },
  'Fish, cod': { protein: 22.8, fat: 0.9 },
  'Fish, flounder': { protein: 15.2, fat: 2.4, note: 'flatfish mix' },
  'Fish, haddock': { protein: 24.4, fat: 0.8 },
  'Fish, halibut': { protein: 22.6, fat: 2.6, note: 'Atlantic halibut cooked' },
  'Fish, perch': { protein: 24.8, fat: 0.9, note: 'ocean perch' },
  'Fish, pike': { protein: 24.6, fat: 0.7 },
  'Fish, snapper': { protein: 26.3, fat: 1.3 },
  'Fish, sole': { protein: 15.2, fat: 2.4 },
  'Fish, swordfish': { protein: 23.4, fat: 7.5, note: 'cooked dry heat' },
  'Fish, tuna (water-packed)': { protein: 23.6, fat: 0.8, note: 'canned drained' },
  'Poultry, chicken (no skin)': { protein: 31.0, fat: 3.6, note: 'breast roasted' },
  'Poultry, turkey': { protein: 29.0, fat: 1.7, note: 'breast roasted' },
  'Seafood, clams': { protein: 25.5, fat: 1.7 },
  'Seafood, crab meat': { protein: 20.9, fat: 0.7, note: 'blue crab' },
  'Seafood, lobster': { protein: 20.5, fat: 0.5 },
  'Seafood, oysters': { protein: 9.5, fat: 2.9, note: 'moist heat cooked' },
  'Seafood, scallops': { protein: 24.0, fat: 0.8 },
  'Seafood, shrimp': { protein: 24.0, fat: 0.3 },
  'Game, venison': { protein: 30.2, fat: 3.4, note: 'roasted' },
};

const PROTEIN_TARGET = 8;
const FAT_MAX = 2;
const PROTEIN_TOLERANCE = 0.6;

function auditEntry(pdfEntry) {
  const usda = USDA[pdfEntry.name];
  if (!usda) return { ...pdfEntry, error: 'missing USDA row' };

  const grams = pdfEntry.gramWeight;
  const protein = grams * usda.protein / 100;
  const fat = grams * usda.fat / 100;
  const gramsFor8 = 800 / usda.protein;
  const fatAt8 = gramsFor8 * usda.fat / 100;

  const proteinOk = Math.abs(protein - PROTEIN_TARGET) <= PROTEIN_TOLERANCE;
  const fatOk = fat <= FAT_MAX + 0.05;
  const fatAt8Ok = fatAt8 <= FAT_MAX + 0.05;

  return {
    name: pdfEntry.name,
    grams,
    protein: Math.round(protein * 100) / 100,
    fat: Math.round(fat * 100) / 100,
    gramsFor8: Math.round(gramsFor8 * 10) / 10,
    fatAt8gProtein: Math.round(fatAt8 * 100) / 100,
    proteinOk,
    fatOk,
    pass: proteinOk && fatOk,
    passIfPortionedFor8: fatAt8Ok,
    note: usda.note || '',
  };
}

const rows = PDF_1982_PROTEINS.map(auditEntry);

const pass = rows.filter((r) => r.pass);
const failFatAtPortion = rows.filter((r) => r.proteinOk && !r.fatOk);
const failFatAlways = rows.filter((r) => !r.passIfPortionedFor8);
const portionOnly = rows.filter((r) => !r.pass && r.passIfPortionedFor8);

console.log('=== 1982 PDF PROTEIN SHEET × 8g protein / 2g fat ===\n');

console.log(`PASS — hits 8g pro ±0.6 AND ≤2g fat at tested weight (${pass.length}):`);
for (const r of pass.sort((a, b) => a.fat - b.fat)) {
  console.log(`  ✓ ${r.name.padEnd(36)} ${String(r.grams).padStart(3)}g  ${r.protein}g pro  ${r.fat}g fat`);
}

console.log(`\nFAIL fat at tested portion — protein OK, fat >2g (${failFatAtPortion.length}):`);
for (const r of failFatAtPortion) {
  console.log(`  ✗ ${r.name.padEnd(36)} ${String(r.grams).padStart(3)}g  ${r.protein}g pro  ${r.fat}g fat  (at 8g pro: ${r.fatAt8gProtein}g / ${r.gramsFor8}g)`);
}

console.log(`\nFAIL fat even at 8g-protein scale (${failFatAlways.length}):`);
for (const r of failFatAlways) {
  console.log(`  ✗ ${r.name.padEnd(36)} tested ${r.grams}g → ${r.fat}g fat; at 8g pro → ${r.fatAt8gProtein}g fat`);
}

console.log(`\nPortion mismatch — fat OK, protein off at tested weight (${portionOnly.length}):`);
for (const r of portionOnly) {
  console.log(`  ~ ${r.name.padEnd(36)} ${String(r.grams).padStart(3)}g  ${r.protein}g pro  ${r.fat}g fat  (8g scale: ${r.gramsFor8}g / ${r.fatAt8gProtein}g fat)`);
}

console.log('\n--- Summary ---');
console.log(`Total: ${rows.length}`);
console.log(`Pass @ tested weight: ${pass.length}`);
console.log(`Fail fat @ tested (protein OK): ${failFatAtPortion.length}`);
console.log(`Fail fat always: ${failFatAlways.length}`);
console.log(`Portion mismatch only: ${portionOnly.length}`);
