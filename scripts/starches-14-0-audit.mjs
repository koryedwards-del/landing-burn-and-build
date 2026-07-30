/**
 * Starches × 14/0.44 (current USDA) × bodybuilder prep relevance.
 * Burn Engine: (G1+S2)*56 → 14g carbs/serving; S2×4 → ~0.44g fat baked in per starch serving.
 * Gram weight = grams for 14g carbs at current USDA (now).
 */

/** @type {ReadonlyArray<{ name: string, key: string }>} */
const CATALOG = [
  { name: 'Beans, black', key: 'black beans' },
  { name: 'Beans, garbanzo (chickpeas)', key: 'chickpeas' },
  { name: 'Beans, kidney', key: 'kidney beans' },
  { name: 'Beans, lima', key: 'lima beans' },
  { name: 'Beans, navy', key: 'navy beans' },
  { name: 'Beans, pinto', key: 'pinto beans' },
  { name: 'Beans, white (cannellini)', key: 'cannellini' },
  { name: 'Cassava (yuca)', key: 'cassava' },
  { name: 'Corn, sweet', key: 'corn' },
  { name: 'Jicama', key: 'jicama' },
  { name: 'Lentils', key: 'lentils' },
  { name: 'Lentils, red', key: 'red lentils' },
  { name: 'Mixed peas and carrots', key: 'peas carrots' },
  { name: 'Parsnips', key: 'parsnips' },
  { name: 'Peas, black-eyed', key: 'black eyed peas' },
  { name: 'Peas, green', key: 'green peas' },
  { name: 'Peas, split', key: 'split peas' },
  { name: 'Plantain', key: 'plantain' },
  { name: 'Potato, baked (flesh + skin)', key: 'potato baked' },
  { name: 'Potato, boiled', key: 'potato boiled' },
  { name: 'Potato, red, boiled', key: 'potato red' },
  { name: 'Potato, Yukon gold, baked', key: 'potato yukon' },
  { name: 'Pumpkin', key: 'pumpkin' },
  { name: 'Rutabaga', key: 'rutabaga' },
  { name: 'Squash, acorn', key: 'acorn squash' },
  { name: 'Squash, butternut', key: 'butternut squash' },
  { name: 'Squash, spaghetti', key: 'spaghetti squash' },
  { name: 'Squash, summer (yellow)', key: 'summer squash' },
  { name: 'Squash, winter (hubbard)', key: 'hubbard squash' },
  { name: 'Squash, zucchini', key: 'zucchini' },
  { name: 'Sweet potato, baked', key: 'sweet potato' },
  { name: 'Taro', key: 'taro' },
  { name: 'Water chestnuts', key: 'water chestnuts' },
  { name: 'Yam, cooked', key: 'yam' },
];

/** USDA FoodData Central — c=carbs g/100g, f=fat g/100g (2026 reference) */
const USDA = {
  'black beans': { c: 23.7, f: 0.5 },
  chickpeas: { c: 27.4, f: 2.6 },
  'kidney beans': { c: 22.8, f: 0.5 },
  'lima beans': { c: 20.9, f: 0.4 },
  'navy beans': { c: 26.0, f: 0.6 },
  'pinto beans': { c: 26.2, f: 0.7 },
  cannellini: { c: 25.1, f: 0.4 },
  cassava: { c: 38.1, f: 0.3 },
  corn: { c: 21.7, f: 1.2 },
  jicama: { c: 8.8, f: 0.1 },
  lentils: { c: 20.1, f: 0.4 },
  'red lentils': { c: 20.1, f: 0.4 },
  'peas carrots': { c: 10.0, f: 0.3 },
  parsnips: { c: 17.0, f: 0.3 },
  'black eyed peas': { c: 20.8, f: 0.6 },
  'green peas': { c: 15.6, f: 0.4 },
  'split peas': { c: 20.5, f: 0.4 },
  plantain: { c: 31.2, f: 0.3 },
  'potato baked': { c: 21.2, f: 0.1 },
  'potato boiled': { c: 20.1, f: 0.1 },
  'potato red': { c: 19.6, f: 0.1 },
  'potato yukon': { c: 21.2, f: 0.1 },
  pumpkin: { c: 4.9, f: 0.1 },
  rutabaga: { c: 8.7, f: 0.2 },
  'acorn squash': { c: 10.4, f: 0.1 },
  'butternut squash': { c: 11.7, f: 0.1 },
  'spaghetti squash': { c: 6.9, f: 0.6 },
  'summer squash': { c: 3.4, f: 0.2 },
  'hubbard squash': { c: 8.7, f: 0.5 },
  zucchini: { c: 3.1, f: 0.3 },
  'sweet potato': { c: 20.7, f: 0.1 },
  taro: { c: 34.6, f: 0.1 },
  'water chestnuts': { c: 23.7, f: 0.1 },
  yam: { c: 27.5, f: 0.1 },
};

/** Classic bodybuilding prep — starches actually rotated in prescribed diets */
const BB_CORE = new Set([
  'sweet potato', 'potato baked', 'potato boiled', 'potato red', 'potato yukon',
  'black beans',
]);

const BB_OCCASIONAL = new Set([
  'corn', 'lentils', 'navy beans', 'pinto beans', 'yam',
]);

const FAT_LIMIT = 0.48; // S2×4 ≈ 0.44g fat/serving baked in (+ tolerance)

function audit(item) {
  const u = USDA[item.key];
  const g14 = 1400 / u.c;
  const fatAt14 = (g14 * u.f) / 100;
  const fit140 = fatAt14 <= FAT_LIMIT;

  let bb;
  if (BB_CORE.has(item.key)) bb = 'core';
  else if (BB_OCCASIONAL.has(item.key)) bb = 'occasional';
  else bb = 'rare';

  let verdict;
  if (!fit140) verdict = 'DROP — fails 14/0.44';
  else if (bb === 'core') verdict = 'KEEP — 14/0.44 + prep staple';
  else if (bb === 'occasional') verdict = 'MAYBE — 14/0.44, limited prep use';
  else verdict = 'DROP — 14/0.44 pass but not prep food';

  return {
    name: item.name,
    fit140,
    fatAt14: Math.round(fatAt14 * 100) / 100,
    gramsNow: Math.round(g14 * 10) / 10,
    bb,
    verdict,
  };
}

const rows = CATALOG.map(audit);
const keep = rows.filter((r) => r.verdict.startsWith('KEEP'));
const maybe = rows.filter((r) => r.verdict.startsWith('MAYBE'));
const drop = rows.filter((r) => r.verdict.startsWith('DROP'));

console.log('=== STARCHES × 14/0.44 (current USDA) × BODYBUILDER PREP ===');
console.log('Burn Engine: 56 cal/serving → 14g carbs; S2×4 → ~0.44g fat baked in\n');

console.log(`KEEP (${keep.length}) — passes 14/0.44, prep actually uses:`);
for (const r of keep.sort((a, b) => a.name.localeCompare(b.name))) {
  console.log(`  ${r.name.padEnd(36)} ${String(r.gramsNow).padStart(6)}g  (${r.fatAt14}g fat @ 14g carb)`);
}

console.log(`\nMAYBE (${maybe.length}) — passes 14/0.44, occasional/special:`);
for (const r of maybe.sort((a, b) => a.name.localeCompare(b.name))) {
  console.log(`  ${r.name.padEnd(36)} ${String(r.gramsNow).padStart(6)}g  (${r.fatAt14}g fat)`);
}

console.log(`\nDROP (${drop.length}):`);
for (const r of drop.sort((a, b) => a.name.localeCompare(b.name))) {
  const why = !r.fit140 ? `fails 14/0.44 (${r.fatAt14}g fat)` : 'not prep rotation';
  console.log(`  ${r.name.padEnd(36)} ${why}`);
}

console.log('\n--- Recommended trimmed starch list ---');
console.log(keep.map((r) => r.name).sort().join('\n'));
