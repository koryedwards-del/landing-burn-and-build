/**
 * Recalculate single-serving gram weights — Burn Engine targets × current USDA (2026).
 * Updates data/foods.json and syncs hardcoded rows in data/cuttingStaplesPrintout.js.
 * Run: node scripts/sync-cutting-servings.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  DAIRY_PROTEIN_PRIMARY,
  GRAINS_STARCHES_MAP,
  PROTEIN_DAIRY_MAP,
  USDA,
  VEG_FRUIT_USDA_KEYS,
} from '../data/cuttingStaplesAuditMap.js';
import {
  BURN_ENGINE_SLOT_TARGETS,
  gramsForCarbServing,
  gramsForProteinServing,
} from '../js/burnEngineServingTargets.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const foodsPath = join(root, 'data/foods.json');
const staplesPath = join(root, 'data/cuttingStaplesPrintout.js');

const foods = JSON.parse(readFileSync(foodsPath, 'utf8'));
let staplesSrc = readFileSync(staplesPath, 'utf8');

const PROTEIN_TOL = 0.6;
const CARB_TOL = 1.5;
const FAT_TOL = 0.05;

function round1(x) {
  return Math.round(x * 10) / 10;
}

function macrosAt(grams, usda) {
  return {
    protein: usda.p != null ? round1(grams * usda.p / 100) : null,
    carbs: usda.c != null ? round1(grams * usda.c / 100) : null,
    fat: round1(grams * usda.f / 100),
  };
}

function passesP1(grams, usda) {
  const slot = BURN_ENGINE_SLOT_TARGETS.P1;
  const m = macrosAt(grams, usda);
  return m.protein != null
    && Math.abs(m.protein - slot.proteinG) <= PROTEIN_TOL
    && m.fat <= slot.fatLimitG + FAT_TOL;
}

function passesD1(grams, usda) {
  const slot = BURN_ENGINE_SLOT_TARGETS.D1;
  const m = macrosAt(grams, usda);
  return m.protein != null
    && Math.abs(m.protein - slot.proteinG) <= PROTEIN_TOL
    && m.carbs != null
    && Math.abs(m.carbs - slot.carbsG) <= CARB_TOL
    && m.fat <= slot.fatLimitG + FAT_TOL;
}

/** P1: 800 ÷ protein/100g; step down if fat exceeds slot limit. */
function gramsForProteinServingUsda(usda) {
  const formula = gramsForProteinServing(usda.p);
  for (let g = formula; g >= Math.max(15, formula - 20); g -= 1) {
    if (passesP1(g, usda)) return g;
  }
  return formula;
}

/** D1: best fit for 8g pro + 12g carb + fat ceiling (2026 USDA). */
function gramsForDairyServing(usda) {
  const slot = BURN_ENGINE_SLOT_TARGETS.D1;
  const byProtein = gramsForProteinServing(usda.p);
  const byCarbs = Math.round((slot.carbsG * 100) / usda.c);
  for (const g of [byProtein, byCarbs, Math.round((byProtein + byCarbs) / 2)]) {
    if (passesD1(g, usda)) return g;
  }
  let best = byProtein;
  let bestScore = Infinity;
  for (let g = Math.max(50, byProtein - 30); g <= byProtein + 120; g += 1) {
    const m = macrosAt(g, usda);
    if (m.fat > slot.fatLimitG + FAT_TOL) continue;
    const score = Math.abs(m.protein - slot.proteinG) * 3 + Math.abs(m.carbs - slot.carbsG);
    if (score < bestScore) {
      bestScore = score;
      best = g;
    }
  }
  return best;
}

function setFoodGrams(catalogName, grams) {
  const food = foods.find((f) => f.name === catalogName);
  if (!food) return { catalogName, ok: false, reason: 'missing from foods.json' };
  const prev = food.gramWeight;
  food.gramWeight = grams;
  return { catalogName, ok: true, prev, next: grams };
}

function patchPdfServing(pdfName, grams, countBased = false) {
  const serving = countBased ? null : `${grams}g`;
  if (!serving) return;
  const re = new RegExp(
    `(\\{ name: '${pdfName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}', serving: ')([^']+)(' \\})`,
  );
  staplesSrc = staplesSrc.replace(re, `$1${serving}$3`);
}

const updates = [];
const skipped = [];

for (const map of PROTEIN_DAIRY_MAP) {
  if (map.countServing) continue;
  if (!map.catalog) {
    skipped.push({ pdf: map.pdf, reason: 'no catalog entry' });
    continue;
  }
  const grams = map.slot === 'P1' || DAIRY_PROTEIN_PRIMARY.has(map.catalog)
    ? gramsForProteinServingUsda(map.usda)
    : gramsForDairyServing(map.usda);
  const result = setFoodGrams(map.catalog, grams);
  updates.push({ section: map.slot, pdf: map.pdf, ...result });
  if (result.ok) patchPdfServing(map.pdf, grams);
}

for (const map of GRAINS_STARCHES_MAP) {
  const usda = USDA[map.usdaKey];
  if (!usda || !map.catalog) {
    skipped.push({ pdf: map.pdf, reason: !usda ? 'missing USDA' : 'no catalog entry' });
    continue;
  }
  const grams = gramsForCarbServing(usda.c, map.slot);
  const result = setFoodGrams(map.catalog, grams);
  updates.push({ section: map.slot, pdf: map.pdf, ...result });
  if (result.ok) patchPdfServing(map.pdf, grams);
}

for (const [catalogName, usdaKey] of Object.entries(VEG_FRUIT_USDA_KEYS)) {
  const usda = USDA[usdaKey];
  const food = foods.find((f) => f.name === catalogName);
  if (!usda || !food) continue;
  const slot = food.category === 'fruit' ? 'FQ' : 'VE';
  const grams = gramsForCarbServing(usda.c, slot);
  const result = setFoodGrams(catalogName, grams);
  updates.push({ section: slot, pdf: catalogName, ...result });
}

writeFileSync(foodsPath, `${JSON.stringify(foods, null, 2)}\n`);
writeFileSync(staplesPath, staplesSrc);

const changed = updates.filter((u) => u.ok && u.prev !== u.next);
console.log('=== sync-cutting-servings (2026 USDA) ===\n');
console.log(`Updated ${changed.length} catalog gram weights.\n`);
for (const u of changed) {
  console.log(`  [${u.section}] ${u.pdf}: ${u.prev}g → ${u.next}g`);
}
if (skipped.length) {
  console.log(`\nSkipped ${skipped.length}:`);
  for (const s of skipped) console.log(`  ${s.pdf}: ${s.reason}`);
}
console.log('\nWrote data/foods.json and data/cuttingStaplesPrintout.js');
