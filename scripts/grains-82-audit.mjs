/**
 * 1982 Grains/Starches PDF — GRAIN items only (starches on separate audit).
 * Burn Engine grain rule: 14g carbs/serving, ~1g fat baked in (14/1).
 * Gram weight = 1982 seminar weight; also compute current-USDA grams for 14g carb.
 */

/** 1982 page 4 — items we classify as GRAIN (not starch) in foods.json */
const PDF_1982_GRAINS = [
  { name: 'Bread, bagel (regular)', key: 'bagel', gramWeight: 25 },
  { name: 'Bread, English muffin', key: 'english muffin', gramWeight: 31 },
  { name: 'Bread, French', key: 'bread french', gramWeight: 25 },
  { name: 'Bread, hard roll', key: 'hard roll', gramWeight: 23 },
  { name: 'Bread, multi-grain', key: 'bread multigrain', gramWeight: 29 },
  { name: 'Bread, pita (pocket)', key: 'pita', gramWeight: 24 },
  { name: 'Bread, rye', key: 'bread rye', gramWeight: 27 },
  { name: 'Bread, whole wheat', key: 'bread ww', gramWeight: 29 },
  { name: 'Bread, whole wheat roll', key: 'ww roll', gramWeight: 27 },
  { name: 'Cereal, Cheerios', key: 'cheerios', gramWeight: 19 },
  { name: 'Cereal, corn grits', key: 'corn grits', gramWeight: 23 },
  { name: 'Cereal, Cream of Wheat (dry)', key: 'cream of wheat', gramWeight: 19 },
  { name: 'Cereal, farina (dry)', key: 'farina', gramWeight: 19 },
  { name: 'Cereal, oatmeal (dry)', key: 'oats', gramWeight: 22 },
  { name: 'Popcorn (air popped)', key: 'popcorn', gramWeight: 36 },
  { name: 'Tortilla, corn (6-inch)', key: 'tortilla corn', gramWeight: 31 },
  { name: 'Tortilla, whole wheat', key: 'tortilla ww', gramWeight: 19 },
  { name: 'Noodles/pasta (cooked)', key: 'pasta', gramWeight: 61 },
  { name: 'Noodles/pasta, whole wheat (cooked)', key: 'pasta ww', gramWeight: 61 },
  { name: 'Rice, brown (cooked)', key: 'rice brown', gramWeight: 55 },
  { name: 'Rice, white (cooked)', key: 'rice white', gramWeight: 58 },
  { name: 'Quinoa (cooked)', key: 'quinoa', gramWeight: 66 },
];

/** USDA — c=carbs g/100g, f=fat g/100g */
const USDA = {
  bagel: { c: 50.9, f: 1.7 },
  'english muffin': { c: 44.2, f: 2.0 },
  'bread french': { c: 51.9, f: 3.1 },
  'hard roll': { c: 52.7, f: 2.0 },
  'bread multigrain': { c: 43.3, f: 4.2 },
  pita: { c: 55.0, f: 1.7 },
  'bread rye': { c: 48.3, f: 3.3 },
  'bread ww': { c: 41.3, f: 3.5 },
  'ww roll': { c: 41.3, f: 3.5 },
  cheerios: { c: 73.2, f: 6.4 },
  'corn grits': { c: 79.6, f: 1.2 },
  'cream of wheat': { c: 76.5, f: 0.5 },
  farina: { c: 76.5, f: 0.5 },
  oats: { c: 66.3, f: 6.9 },
  popcorn: { c: 77.8, f: 4.5 },
  'tortilla corn': { c: 44.6, f: 2.3 },
  'tortilla ww': { c: 44.0, f: 2.5 },
  pasta: { c: 25.0, f: 0.9 },
  'pasta ww': { c: 26.5, f: 0.5 },
  'rice brown': { c: 23.5, f: 0.8 },
  'rice white': { c: 28.2, f: 0.3 },
  quinoa: { c: 21.3, f: 1.9 },
};

const BB_CORE = new Set([
  'oats', 'rice white', 'rice brown', 'bread ww', 'pasta', 'tortilla corn',
  'corn grits', 'cream of wheat', 'english muffin',
]);

const BB_OCCASIONAL = new Set([
  'pita', 'bread french', 'hard roll', 'farina', 'popcorn', 'pasta ww', 'tortilla ww',
]);

const FAT_LIMIT = 1.05;

function audit(item) {
  const u = USDA[item.key];
  const fatAt82 = (item.gramWeight * u.f) / 100;
  const g14now = 1400 / u.c;
  const fatAt14now = (g14now * u.f) / 100;
  const fit82 = fatAt82 <= FAT_LIMIT;
  const fitNow = fatAt14now <= FAT_LIMIT;

  let bb = BB_CORE.has(item.key) ? 'core' : BB_OCCASIONAL.has(item.key) ? 'occasional' : 'rare';

  let verdict;
  if (!fit82 && !fitNow) verdict = 'DROP — fails 14/1';
  else if (fit82) verdict = bb === 'core' ? 'KEEP — 1982 weight + prep' : bb === 'occasional' ? 'MAYBE — 1982 weight' : 'KEEP — 1982 weight';
  else if (fitNow) verdict = 'MAYBE — passes USDA-now only';
  else verdict = 'DROP';

  return {
    name: item.name,
    gramWeight82: item.gramWeight,
    gramsNow: Math.round(g14now * 10) / 10,
    fatAt82: Math.round(fatAt82 * 100) / 100,
    fatAt14now: Math.round(fatAt14now * 100) / 100,
    fit82,
    bb,
    verdict,
  };
}

const rows = PDF_1982_GRAINS.map(audit);
const keep = rows.filter((r) => r.verdict.startsWith('KEEP'));
const maybe = rows.filter((r) => r.verdict.startsWith('MAYBE'));
const drop = rows.filter((r) => r.verdict.startsWith('DROP'));

console.log('=== 1982 GRAIN ROSTER × 14/1 × PREP ===\n');
console.log(`KEEP (${keep.length}):`);
for (const r of keep.sort((a, b) => a.name.localeCompare(b.name))) {
  console.log(`  ${r.name.padEnd(42)} 82:${String(r.gramWeight82).padStart(3)}g  now:${String(r.gramsNow).padStart(5)}g  fat@82:${r.fatAt82}g`);
}
console.log(`\nMAYBE (${maybe.length}):`);
for (const r of maybe.sort((a, b) => a.name.localeCompare(b.name))) {
  console.log(`  ${r.name.padEnd(42)} 82:${String(r.gramWeight82).padStart(3)}g  now:${String(r.gramsNow).padStart(5)}g  fat@82:${r.fatAt82}g fat@now:${r.fatAt14now}g`);
}
console.log(`\nDROP (${drop.length}):`);
for (const r of drop.sort((a, b) => a.name.localeCompare(b.name))) {
  console.log(`  ${r.name.padEnd(42)} fat@82:${r.fatAt82}g fat@now:${r.fatAt14now}g`);
}

console.log('\n--- Preferred grains (1982 KEEP, alphabetized) ---');
console.log(keep.map((r) => r.name).sort().join('\n'));
