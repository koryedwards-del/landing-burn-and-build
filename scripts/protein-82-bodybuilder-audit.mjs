/**
 * 1982 protein roster × 8/2 (current USDA) × bodybuilder prep relevance.
 * Gram weight = grams for 8g protein at current USDA (now).
 */

/** 1982 PDF protein sheet */
const PDF_1982 = [
  { name: 'Beef, round steak (ground)', key: 'ground round' },
  { name: 'Eggs, medium (2 whites/1 yolk)', key: 'eggs 2w1y' },
  { name: 'Eggs, substitute (Eggbeaters)', key: 'eggbeaters' },
  { name: 'Fish, blue', key: 'bluefish' },
  { name: 'Fish, catfish', key: 'catfish' },
  { name: 'Fish, cod', key: 'cod' },
  { name: 'Fish, flounder', key: 'flounder' },
  { name: 'Fish, haddock', key: 'haddock' },
  { name: 'Fish, halibut', key: 'halibut' },
  { name: 'Fish, perch', key: 'perch' },
  { name: 'Fish, pike', key: 'pike' },
  { name: 'Fish, snapper', key: 'snapper' },
  { name: 'Fish, sole', key: 'sole' },
  { name: 'Fish, swordfish', key: 'swordfish' },
  { name: 'Fish, tuna (water-packed)', key: 'tuna canned' },
  { name: 'Poultry, chicken (no skin)', key: 'chicken' },
  { name: 'Poultry, turkey', key: 'turkey' },
  { name: 'Seafood, clams', key: 'clams' },
  { name: 'Seafood, crab meat', key: 'crab' },
  { name: 'Seafood, lobster', key: 'lobster' },
  { name: 'Seafood, oysters', key: 'oysters' },
  { name: 'Seafood, scallops', key: 'scallops' },
  { name: 'Seafood, shrimp', key: 'shrimp' },
  { name: 'Game, venison', key: 'venison' },
  { name: 'Egg whites (2 large)', key: 'egg whites', added: true },
];

/** USDA FoodData Central — cooked, per 100g (2026 reference) */
const USDA = {
  'ground round': { p: 29.9, f: 3.4 },
  'eggs 2w1y': { p: 10.0, f: 4.5 },
  'eggbeaters': { p: 10.2, f: 0.0 },
  'egg whites': { p: 10.9, f: 0.2, note: '2 large ≈66g, 7.2g pro' },
  'bluefish': { p: 23.4, f: 6.4 },
  'catfish': { p: 18.5, f: 2.9 },
  'cod': { p: 22.8, f: 0.9 },
  'flounder': { p: 15.2, f: 2.4 },
  'haddock': { p: 24.4, f: 0.8 },
  'halibut': { p: 22.6, f: 2.6 },
  'perch': { p: 24.8, f: 0.9 },
  'pike': { p: 24.6, f: 0.7 },
  'snapper': { p: 26.3, f: 1.3 },
  'sole': { p: 15.2, f: 2.4 },
  'swordfish': { p: 23.4, f: 7.5 },
  'tuna canned': { p: 23.6, f: 0.8 },
  'chicken': { p: 31.0, f: 3.6 },
  'turkey': { p: 29.0, f: 1.7 },
  'clams': { p: 25.5, f: 1.7 },
  'crab': { p: 20.9, f: 0.7 },
  'lobster': { p: 20.5, f: 0.5 },
  'oysters': { p: 9.5, f: 2.9 },
  'scallops': { p: 24.0, f: 0.8 },
  'shrimp': { p: 24.0, f: 0.3 },
  'venison': { p: 30.2, f: 3.4 },
};

/** Bodybuilder prep rotation — foods commonly used in cut/prep meal plans */
const BB_CORE = new Set([
  'chicken', 'turkey', 'egg whites', 'eggbeaters', 'cod', 'flounder', 'sole',
  'tuna canned', 'shrimp', 'haddock', 'scallops', 'ground round',
]);

const BB_OCCASIONAL = new Set([
  'halibut', 'snapper', 'crab', 'lobster',
]);

function audit(item) {
  const u = USDA[item.key];
  const g8 = 800 / u.p;
  const fatAt8 = g8 * u.f / 100;
  const fit82 = fatAt8 <= 2.05;
  let bb;
  if (BB_CORE.has(item.key)) bb = 'core';
  else if (BB_OCCASIONAL.has(item.key)) bb = 'occasional';
  else bb = 'rare';

  let verdict;
  if (!fit82) verdict = 'DROP — fails 8/2';
  else if (bb === 'core') verdict = 'KEEP — 8/2 + prep staple';
  else if (bb === 'occasional') verdict = 'MAYBE — 8/2, limited prep use';
  else verdict = 'DROP — 8/2 pass but not prep food';

  return {
    name: item.name,
    fit82,
    fatAt8: Math.round(fatAt8 * 100) / 100,
    gramsNow: Math.round(g8 * 10) / 10,
    bb,
    verdict,
    added: item.added || false,
  };
}

const rows = PDF_1982.map(audit);
const keep = rows.filter((r) => r.verdict.startsWith('KEEP'));
const maybe = rows.filter((r) => r.verdict.startsWith('MAYBE'));
const drop = rows.filter((r) => r.verdict.startsWith('DROP'));

console.log('=== 1982 ROSTER × 8/2 (current USDA) × BODYBUILDER PREP ===\n');

console.log(`KEEP (${keep.length}) — on the list, passes 8/2, prep actually uses:`);
for (const r of keep) {
  console.log(`  ${r.name.padEnd(38)} ${String(r.gramsNow).padStart(5)}g  (${r.fatAt8}g fat @ 8g pro)`);
}

console.log(`\nMAYBE (${maybe.length}) — passes 8/2, occasional/special:`);
for (const r of maybe) {
  console.log(`  ${r.name.padEnd(38)} ${String(r.gramsNow).padStart(5)}g  (${r.fatAt8}g fat)`);
}

console.log(`\nDROP (${drop.length}):`);
for (const r of drop) {
  const why = r.verdict.includes('8/2') && !r.fit82 ? 'fails 8/2' : 'nobody rotates this in prep';
  console.log(`  ${r.name.padEnd(38)} ${why}  (${r.fatAt8}g fat @ 8g pro)`);
}

console.log('\n--- Recommended trimmed protein list (12) ---');
console.log(keep.map((r) => r.name).join('\n'));
