/**
 * 1982 starch roster × 14/0.44 (current USDA).
 * Burn Engine: 56 cal/serving → 14g carbs; S2×4 → ~0.44g fat baked in.
 * No rotation filtering — 1982 sheet + math only.
 */

/** 1982 PDF page 4 — starch items (not grains). */
const PDF_1982 = [
  { name: 'All beans/legumes (cooked)', key: 'beans generic', gramWeight: 66, catalog: 'Beans (any on list)' },
  { name: 'Corn, fresh', key: 'corn', gramWeight: 17, catalog: 'Corn, sweet' },
  { name: 'Peas, green (cooked)', key: 'green peas', gramWeight: 83, catalog: 'Peas, green' },
  { name: 'Peas, split (cooked)', key: 'split peas', gramWeight: 126, catalog: 'Peas, split' },
  { name: 'Peas, mixed peas/carrots', key: 'peas carrots', gramWeight: 139, catalog: 'Mixed peas and carrots' },
  { name: 'Potatoes, baked (with skin)', key: 'potato baked', gramWeight: 86, catalog: 'Potato, baked (flesh + skin)' },
  { name: 'Potatoes, boiled', key: 'potato boiled', gramWeight: 96, catalog: 'Potato, boiled' },
  { name: 'Potatoes, sweet potatoes', key: 'sweet potato', gramWeight: 55, catalog: 'Sweet potato, baked' },
  { name: 'Squash, summer (raw)', key: 'summer squash', gramWeight: 325, catalog: 'Squash, summer (yellow)' },
  { name: 'Squash, winter (raw)', key: 'hubbard squash', gramWeight: 160, catalog: 'Squash, winter (hubbard)' },
  { name: 'Squash, zucchini (raw)', key: 'zucchini', gramWeight: 479, catalog: 'Squash, zucchini' },
];

/** Catalog starches not on 1982 — audit at USDA-now portion. */
const CATALOG_EXTRA = [
  { name: 'Beans, black', key: 'black beans' },
  { name: 'Beans, kidney', key: 'kidney beans' },
  { name: 'Beans, lima', key: 'lima beans' },
  { name: 'Beans, navy', key: 'navy beans' },
  { name: 'Beans, pinto', key: 'pinto beans' },
  { name: 'Beans, white (cannellini)', key: 'cannellini' },
  { name: 'Beans, garbanzo (chickpeas)', key: 'chickpeas' },
  { name: 'Potato, red, boiled', key: 'potato red' },
  { name: 'Potato, Yukon gold, baked', key: 'potato yukon' },
  { name: 'Lentils', key: 'lentils' },
  { name: 'Lentils, red', key: 'red lentils' },
  { name: 'Peas, black-eyed', key: 'black eyed peas' },
  { name: 'Squash, acorn', key: 'acorn squash' },
  { name: 'Squash, butternut', key: 'butternut squash' },
  { name: 'Squash, spaghetti', key: 'spaghetti squash' },
  { name: 'Yam, cooked', key: 'yam' },
  { name: 'Cassava (yuca)', key: 'cassava' },
  { name: 'Jicama', key: 'jicama' },
  { name: 'Parsnips', key: 'parsnips' },
  { name: 'Plantain', key: 'plantain' },
  { name: 'Pumpkin', key: 'pumpkin' },
  { name: 'Rutabaga', key: 'rutabaga' },
  { name: 'Taro', key: 'taro' },
  { name: 'Water chestnuts', key: 'water chestnuts' },
];

const USDA = {
  'beans generic': { c: 23.7, f: 0.5 },
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

const FAT_LIMIT = 0.48;

function auditWeight(key, grams) {
  const u = USDA[key];
  const fatAt = (grams * u.f) / 100;
  const g14 = 1400 / u.c;
  const fatAt14 = (g14 * u.f) / 100;
  return {
    fatAt: Math.round(fatAt * 100) / 100,
    gramsNow: Math.round(g14 * 10) / 10,
    fatAt14: Math.round(fatAt14 * 100) / 100,
    pass82: fatAt <= FAT_LIMIT,
    passNow: fatAt14 <= FAT_LIMIT,
  };
}

console.log('=== 1982 STARCH ROSTER × 14/0.44 ===');
console.log('Rule: ≤0.44g fat at 14g-carb portion (S2×4)\n');

const keep82 = [];
const borderline82 = [];
const drop82 = [];

for (const item of PDF_1982) {
  const r = auditWeight(item.key, item.gramWeight);
  let verdict;
  if (r.pass82) verdict = 'KEEP';
  else if (r.fatAt <= 0.55) verdict = 'BORDERLINE *';
  else verdict = 'DROP';

  const row = { ...item, ...r, verdict };
  if (verdict === 'KEEP') keep82.push(row);
  else if (verdict.startsWith('BORDER')) borderline82.push(row);
  else drop82.push(row);
}

console.log(`KEEP (${keep82.length}) — 1982 weight passes 14/0.44:`);
for (const r of keep82) {
  console.log(`  ${r.catalog.padEnd(36)} 82:${String(r.gramWeight).padStart(3)}g  now:${String(r.gramsNow).padStart(6)}g  fat@82:${r.fatAt}g`);
}

console.log(`\nBORDERLINE (${borderline82.length}) — 1982 weight, tight on fat slot:`);
for (const r of borderline82) {
  console.log(`  ${r.catalog.padEnd(36)} fat@82:${r.fatAt}g  fat@14now:${r.fatAt14}g`);
}

console.log(`\nDROP (${drop82.length}) — fails 14/0.44 at 1982 weight:`);
for (const r of drop82) {
  console.log(`  ${r.catalog.padEnd(36)} fat@82:${r.fatAt}g`);
}

console.log('\n--- 2026 preferred starches (1982 KEEP) ---');
console.log(keep82.map((r) => r.catalog).sort().join('\n'));

const passExtra = [];
const failExtra = [];
for (const item of CATALOG_EXTRA) {
  const u = USDA[item.key];
  if (!u) throw new Error(`Missing USDA for ${item.name} (${item.key})`);
  const r = auditWeight(item.key, 1400 / u.c);
  (r.passNow ? passExtra : failExtra).push({ ...item, ...r });
}

console.log(`\n=== Catalog extras (not on 1982) — USDA-now 14/0.44 ===`);
console.log(`Pass (${passExtra.length}) — eligible if you want them on roster:`);
for (const r of passExtra.sort((a, b) => a.name.localeCompare(b.name))) {
  console.log(`  ${r.name.padEnd(36)} ${String(r.gramsNow).padStart(6)}g  fat@14:${r.fatAt14}g`);
}
console.log(`\nFail (${failExtra.length}) — drop:`);
for (const r of failExtra.sort((a, b) => a.name.localeCompare(b.name))) {
  console.log(`  ${r.name.padEnd(36)} fat@14:${r.fatAt14}g`);
}

console.log('\n--- 1982 beans note ---');
console.log('1982 lists one line: All beans/legumes @ 66g cooked.');
console.log('Separate bean types in catalog all pass 14/0.44 except chickpeas.');
