/**
 * Grains × 14/1 (current USDA) × bodybuilder prep relevance.
 * Burn Engine: (G1+S2)*56 → 14g carbs/serving; G1*9 → ~1g fat baked in per grain serving.
 * Gram weight = grams for 14g carbs at current USDA (now).
 */

/** @type {ReadonlyArray<{ name: string, key: string, form: 'dry'|'cooked'|'as-is' }>} */
const CATALOG = [
  { name: 'Amaranth', key: 'amaranth', form: 'cooked' },
  { name: 'Bagel, plain', key: 'bagel', form: 'as-is' },
  { name: 'Barley, pearled', key: 'barley', form: 'cooked' },
  { name: 'Bran flakes', key: 'bran flakes', form: 'dry' },
  { name: 'Bread, French/Italian', key: 'bread french', form: 'as-is' },
  { name: 'Bread, multigrain', key: 'bread multigrain', form: 'as-is' },
  { name: 'Bread, pita, white', key: 'pita white', form: 'as-is' },
  { name: 'Bread, pita, whole wheat', key: 'pita ww', form: 'as-is' },
  { name: 'Bread, pumpernickel', key: 'bread pumpernickel', form: 'as-is' },
  { name: 'Bread, rye', key: 'bread rye', form: 'as-is' },
  { name: 'Bread, sourdough', key: 'bread sourdough', form: 'as-is' },
  { name: 'Bread, white', key: 'bread white', form: 'as-is' },
  { name: 'Bread, whole wheat', key: 'bread ww', form: 'as-is' },
  { name: 'Buckwheat groats', key: 'buckwheat', form: 'cooked' },
  { name: 'Bulgur', key: 'bulgur', form: 'cooked' },
  { name: 'Cheerios', key: 'cheerios', form: 'dry' },
  { name: 'Corn flakes', key: 'corn flakes', form: 'dry' },
  { name: 'Corn grits', key: 'corn grits', form: 'dry' },
  { name: 'Couscous', key: 'couscous', form: 'cooked' },
  { name: 'Crackers, saltine', key: 'saltine', form: 'as-is' },
  { name: 'Cream of Rice', key: 'cream of rice', form: 'dry' },
  { name: 'Cream of Wheat', key: 'cream of wheat', form: 'dry' },
  { name: 'Egg noodles', key: 'egg noodles', form: 'cooked' },
  { name: 'English muffin', key: 'english muffin', form: 'as-is' },
  { name: 'Farina', key: 'farina', form: 'dry' },
  { name: 'Farro (emmer)', key: 'farro', form: 'cooked' },
  { name: 'Grape-Nuts', key: 'grape nuts', form: 'dry' },
  { name: 'Hamburger/hot dog bun', key: 'hot dog bun', form: 'as-is' },
  { name: 'Hard roll', key: 'hard roll', form: 'as-is' },
  { name: 'Millet', key: 'millet', form: 'cooked' },
  { name: 'Oats, rolled', key: 'oats', form: 'dry' },
  { name: 'Pasta, regular', key: 'pasta', form: 'cooked' },
  { name: 'Pasta, whole wheat', key: 'pasta ww', form: 'cooked' },
  { name: 'Popcorn, air-popped', key: 'popcorn', form: 'popped' },
  { name: 'Pretzels, hard', key: 'pretzels', form: 'as-is' },
  { name: 'Quinoa', key: 'quinoa', form: 'cooked' },
  { name: 'Rice cakes, plain', key: 'rice cakes', form: 'as-is' },
  { name: 'Rice Chex', key: 'rice chex', form: 'dry' },
  { name: 'Rice noodles', key: 'rice noodles', form: 'cooked' },
  { name: 'Rice, basmati', key: 'rice basmati', form: 'cooked' },
  { name: 'Rice, brown', key: 'rice brown', form: 'cooked' },
  { name: 'Rice, jasmine', key: 'rice jasmine', form: 'cooked' },
  { name: 'Rice, white', key: 'rice white', form: 'cooked' },
  { name: 'Rice, wild', key: 'rice wild', form: 'cooked' },
  { name: 'Shredded Wheat', key: 'shredded wheat', form: 'dry' },
  { name: 'Soba noodles', key: 'soba', form: 'cooked' },
  { name: 'Tortilla, corn (6-inch)', key: 'tortilla corn', form: 'as-is' },
];

/** USDA FoodData Central — c=carbs g/100g, f=fat g/100g (2026 reference) */
const USDA = {
  amaranth: { c: 18.7, f: 1.6 },
  bagel: { c: 50.9, f: 1.7 },
  barley: { c: 28.2, f: 0.4 },
  'bran flakes': { c: 74.0, f: 2.0 },
  'bread french': { c: 51.9, f: 3.1 },
  'bread multigrain': { c: 43.3, f: 4.2 },
  'pita white': { c: 55.7, f: 1.2 },
  'pita ww': { c: 55.0, f: 1.7 },
  'bread pumpernickel': { c: 47.5, f: 3.1 },
  'bread rye': { c: 48.3, f: 3.3 },
  'bread sourdough': { c: 49.0, f: 0.9 },
  'bread white': { c: 49.4, f: 3.3 },
  'bread ww': { c: 41.3, f: 3.5 },
  buckwheat: { c: 19.9, f: 0.6 },
  bulgur: { c: 18.6, f: 0.2 },
  cheerios: { c: 73.2, f: 6.4 },
  'corn flakes': { c: 84.0, f: 0.4 },
  'corn grits': { c: 79.6, f: 1.2 },
  couscous: { c: 23.2, f: 0.2 },
  saltine: { c: 74.0, f: 8.6 },
  'cream of rice': { c: 82.0, f: 0.1 },
  'cream of wheat': { c: 76.5, f: 0.5 },
  'egg noodles': { c: 25.2, f: 2.1 },
  'english muffin': { c: 44.2, f: 2.0 },
  farina: { c: 76.5, f: 0.5 },
  farro: { c: 26.9, f: 0.9 },
  'grape nuts': { c: 80.0, f: 4.8 },
  'hot dog bun': { c: 50.0, f: 3.6 },
  'hard roll': { c: 52.7, f: 2.0 },
  millet: { c: 23.7, f: 1.0 },
  oats: { c: 66.3, f: 6.9 },
  pasta: { c: 25.0, f: 0.9 },
  'pasta ww': { c: 26.5, f: 0.5 },
  popcorn: { c: 77.8, f: 4.5 },
  pretzels: { c: 79.2, f: 2.6 },
  quinoa: { c: 21.3, f: 1.9 },
  'rice cakes': { c: 81.5, f: 2.8 },
  'rice chex': { c: 84.0, f: 1.0 },
  'rice noodles': { c: 24.0, f: 0.2 },
  'rice basmati': { c: 28.2, f: 0.3 },
  'rice brown': { c: 23.5, f: 0.8 },
  'rice jasmine': { c: 28.2, f: 0.3 },
  'rice white': { c: 28.2, f: 0.3 },
  'rice wild': { c: 21.3, f: 0.3 },
  'shredded wheat': { c: 75.0, f: 1.5 },
  soba: { c: 21.4, f: 0.1 },
  'tortilla corn': { c: 44.6, f: 2.3 },
};

/** Classic bodybuilding prep — grains actually rotated in prescribed diets */
const BB_CORE = new Set([
  'oats', 'rice basmati', 'rice white', 'rice jasmine', 'bread ww',
  'cream of rice', 'cream of wheat', 'pasta', 'tortilla corn', 'rice cakes',
  'english muffin', 'corn grits', 'rice brown',
]);

const BB_OCCASIONAL = new Set([
  'pita ww', 'bread white', 'bread sourdough', 'rice wild', 'soba', 'rice noodles',
  'corn flakes', 'shredded wheat', 'barley', 'bulgur',
]);

const FAT_LIMIT = 1.05; // G1*9 ≈ 1g fat/serving baked in

function audit(item) {
  const u = USDA[item.key];
  const g14 = 1400 / u.c;
  const fatAt14 = (g14 * u.f) / 100;
  const fit141 = fatAt14 <= FAT_LIMIT;

  let bb;
  if (BB_CORE.has(item.key)) bb = 'core';
  else if (BB_OCCASIONAL.has(item.key)) bb = 'occasional';
  else bb = 'rare';

  let verdict;
  if (!fit141) verdict = 'DROP — fails 14/1';
  else if (bb === 'core') verdict = 'KEEP — 14/1 + prep staple';
  else if (bb === 'occasional') verdict = 'MAYBE — 14/1, limited prep use';
  else verdict = 'DROP — 14/1 pass but not prep food';

  return {
    name: item.name,
    fit141,
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

console.log('=== GRAINS × 14/1 (current USDA) × BODYBUILDER PREP ===');
console.log('Burn Engine: 56 cal/serving → 14g carbs; G1×9 → ~1g fat baked in\n');

console.log(`KEEP (${keep.length}) — passes 14/1, prep actually uses:`);
for (const r of keep.sort((a, b) => a.name.localeCompare(b.name))) {
  console.log(`  ${r.name.padEnd(32)} ${String(r.gramsNow).padStart(5)}g  (${r.fatAt14}g fat @ 14g carb)`);
}

console.log(`\nMAYBE (${maybe.length}) — passes 14/1, occasional/special:`);
for (const r of maybe.sort((a, b) => a.name.localeCompare(b.name))) {
  console.log(`  ${r.name.padEnd(32)} ${String(r.gramsNow).padStart(5)}g  (${r.fatAt14}g fat)`);
}

console.log(`\nDROP (${drop.length}):`);
for (const r of drop.sort((a, b) => a.name.localeCompare(b.name))) {
  const why = !r.fit141 ? `fails 14/1 (${r.fatAt14}g fat)` : 'not prep rotation';
  console.log(`  ${r.name.padEnd(32)} ${why}`);
}

console.log('\n--- Recommended trimmed grain list ---');
console.log(keep.map((r) => r.name).sort().join('\n'));
