/**
 * Audit cutting diet food-list single servings vs Burn Engine + 2026 USDA.
 * Run: node scripts/cutting-food-list-audit.mjs
 */

import foods from '../data/foods.json' with { type: 'json' };
import {
  CUTTING_STAPLES_PROTEIN_DAIRY,
  CUTTING_STAPLES_GRAINS_STARCHES,
  CUTTING_STAPLES_VEGETABLES,
  CUTTING_STAPLES_FRUIT,
} from '../data/cuttingStaplesPrintout.js';
import {
  DAIRY_PROTEIN_PRIMARY,
  FRUIT_PDF_TO_CATALOG,
  GRAINS_STARCHES_MAP,
  PROTEIN_DAIRY_MAP,
  USDA,
  VEG_FRUIT_USDA_KEYS,
  VEG_PDF_TO_CATALOG,
} from '../data/cuttingStaplesAuditMap.js';
import {
  BURN_ENGINE_SLOT_TARGETS,
  gramsForCarbServing,
  gramsForProteinServing,
} from '../js/burnEngineServingTargetsData.js';

const PROTEIN_TOL = 0.6;
const CARB_TOL = 1.5;
const FAT_TOL = 0.05;

function parseGrams(serving) {
  const m = String(serving).match(/^(\d+)g$/);
  return m ? Number(m[1]) : null;
}

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

function auditP1(pdfGrams, usda) {
  const slot = BURN_ENGINE_SLOT_TARGETS.P1;
  const expectedG = gramsForProteinServing(usda.p);
  const atPdf = macrosAt(pdfGrams, usda);
  const pass = Math.abs(atPdf.protein - slot.proteinG) <= PROTEIN_TOL
    && atPdf.fat <= slot.fatLimitG + FAT_TOL;
  return { expectedG, atPdf, pass };
}

function auditD1(pdfGrams, usda) {
  const slot = BURN_ENGINE_SLOT_TARGETS.D1;
  const atPdf = macrosAt(pdfGrams, usda);
  const pass = atPdf.protein != null
    && Math.abs(atPdf.protein - slot.proteinG) <= PROTEIN_TOL
    && atPdf.carbs != null
    && Math.abs(atPdf.carbs - slot.carbsG) <= CARB_TOL
    && atPdf.fat <= slot.fatLimitG + FAT_TOL;
  return { atPdf, pass };
}

function auditCarbSlot(pdfGrams, usda, slotKey) {
  const slot = BURN_ENGINE_SLOT_TARGETS[slotKey];
  const expectedG = gramsForCarbServing(usda.c, slotKey);
  const atPdf = macrosAt(pdfGrams, usda);
  const carbsPass = Math.abs(atPdf.carbs - slot.carbsG) <= CARB_TOL;
  const fatPass = atPdf.fat <= slot.fatLimitG + FAT_TOL;
  return {
    expectedG,
    atPdf,
    pass: carbsPass && fatPass,
    fatOverage: carbsPass && pdfGrams === expectedG && !fatPass,
  };
}

const issues = [];
const warnings = [];
let passCount = 0;

function check(row) {
  if (row.fatOverage) warnings.push(row);
  if (row.pass) passCount += 1;
  else issues.push(row);
}

console.log('=== CUTTING FOOD LIST — 2026 USDA single-serving audit ===\n');

for (const map of PROTEIN_DAIRY_MAP) {
  const pdfRow = CUTTING_STAPLES_PROTEIN_DAIRY.find((r) => r.name === map.pdf);
  if (map.countServing) {
    console.log(`  [count] ${map.pdf}: ${pdfRow?.serving}`);
    continue;
  }
  const pdfGrams = pdfRow ? parseGrams(pdfRow.serving) : null;
  const catalogFood = map.catalog ? foods.find((f) => f.name === map.catalog) : null;
  if (pdfGrams == null) {
    issues.push({ section: map.slot, name: map.pdf, reason: 'non-gram serving' });
    continue;
  }
  if (map.slot === 'P1') {
    const audit = auditP1(pdfGrams, map.usda);
    check({
      section: 'protein',
      name: map.pdf,
      pdfGrams,
      catalogGrams: catalogFood?.gramWeight,
      expectedG: audit.expectedG,
      macros: audit.atPdf,
      pass: audit.pass && pdfGrams === catalogFood?.gramWeight,
      reason: !audit.pass ? `macro fail @ ${pdfGrams}g` : pdfGrams !== catalogFood?.gramWeight ? 'PDF ≠ catalog' : undefined,
    });
  } else {
    const audit = map.catalog && DAIRY_PROTEIN_PRIMARY.has(map.catalog)
      ? auditP1(pdfGrams, map.usda)
      : auditD1(pdfGrams, map.usda);
    const slotLabel = map.catalog && DAIRY_PROTEIN_PRIMARY.has(map.catalog) ? 'dairy/P1' : 'dairy';
    check({
      section: slotLabel,
      name: map.pdf,
      pdfGrams,
      catalogGrams: catalogFood?.gramWeight,
      macros: audit.atPdf,
      pass: audit.pass && pdfGrams === catalogFood?.gramWeight,
      reason: !audit.pass
        ? `macro miss (${audit.atPdf.protein}g pro, ${audit.atPdf.carbs ?? '—'}g carb, ${audit.atPdf.fat}g fat)`
        : pdfGrams !== catalogFood?.gramWeight ? 'PDF ≠ catalog' : undefined,
    });
  }
}

for (const map of GRAINS_STARCHES_MAP) {
  const pdfRow = CUTTING_STAPLES_GRAINS_STARCHES.find((r) => r.name === map.pdf);
  const pdfGrams = pdfRow ? parseGrams(pdfRow.serving) : null;
  const usda = USDA[map.usdaKey];
  const catalogFood = map.catalog ? foods.find((f) => f.name === map.catalog) : null;
  if (!usda || pdfGrams == null || !catalogFood) {
    issues.push({ section: map.slot, name: map.pdf, reason: 'missing data' });
    continue;
  }
  const audit = auditCarbSlot(pdfGrams, usda, map.slot);
  const gramsOk = pdfGrams === audit.expectedG && pdfGrams === catalogFood.gramWeight;
  check({
    section: map.slot,
    name: map.pdf,
    pdfGrams,
    catalogGrams: catalogFood.gramWeight,
    expectedG: audit.expectedG,
    macros: audit.atPdf,
    pass: gramsOk && (audit.pass || audit.fatOverage),
    fatOverage: audit.fatOverage,
    reason: pdfGrams !== audit.expectedG ? `want ${audit.expectedG}g` : !audit.pass && !audit.fatOverage ? `fat ${audit.atPdf.fat}g over limit` : undefined,
  });
}

for (const row of CUTTING_STAPLES_VEGETABLES) {
  const catalogName = VEG_PDF_TO_CATALOG[row.name];
  const catalogFood = catalogName ? foods.find((f) => f.name === catalogName) : null;
  const usdaKey = catalogName ? VEG_FRUIT_USDA_KEYS[catalogName] : null;
  const usda = usdaKey ? USDA[usdaKey] : null;
  const pdfGrams = parseGrams(row.serving);
  if (!catalogFood || !usda || pdfGrams == null) {
    issues.push({ section: 'VE', name: row.name, reason: 'unresolved catalog' });
    continue;
  }
  const audit = auditCarbSlot(pdfGrams, usda, 'VE');
  check({
    section: 'VE',
    name: row.name,
    pdfGrams,
    catalogGrams: catalogFood.gramWeight,
    expectedG: audit.expectedG,
    pass: pdfGrams === audit.expectedG && (audit.pass || audit.fatOverage),
    fatOverage: audit.fatOverage,
    reason: pdfGrams !== audit.expectedG ? `want ${audit.expectedG}g` : !audit.pass && !audit.fatOverage ? 'macro fail' : undefined,
  });
}

for (const row of CUTTING_STAPLES_FRUIT) {
  const catalogName = FRUIT_PDF_TO_CATALOG[row.name];
  const catalogFood = catalogName ? foods.find((f) => f.name === catalogName) : null;
  const usdaKey = catalogName ? VEG_FRUIT_USDA_KEYS[catalogName] : null;
  const usda = usdaKey ? USDA[usdaKey] : null;
  const pdfGrams = parseGrams(row.serving);
  if (!catalogFood || !usda || pdfGrams == null) {
    issues.push({ section: 'FQ', name: row.name, reason: 'unresolved catalog' });
    continue;
  }
  const audit = auditCarbSlot(pdfGrams, usda, 'FQ');
  check({
    section: 'FQ',
    name: row.name,
    pdfGrams,
    catalogGrams: catalogFood.gramWeight,
    expectedG: audit.expectedG,
    macros: audit.atPdf,
    pass: pdfGrams === audit.expectedG && (audit.pass || audit.fatOverage),
    fatOverage: audit.fatOverage,
    reason: pdfGrams !== audit.expectedG ? `want ${audit.expectedG}g` : !audit.pass && !audit.fatOverage ? `fat ${audit.atPdf.fat}g` : undefined,
  });
}

console.log(`PASS: ${passCount}`);
console.log(`WARNINGS (accepted fat overage at full USDA serving): ${warnings.length}`);
console.log(`ISSUES: ${issues.length}\n`);

if (warnings.length) {
  console.log('--- ACCEPTED FAT OVERAGE ---');
  for (const row of warnings) {
    console.log(`  [${row.section}] ${row.name}: ${row.reason || `fat ${row.macros?.fat}g at ${row.pdfGrams}g`}`);
  }
  console.log('');
}

if (issues.length) {
  console.log('--- ISSUES (sync drift or macro fail) ---');
  for (const row of issues) {
    console.log(`  [${row.section}] ${row.name}: ${row.reason || `PDF ${row.pdfGrams}g catalog ${row.catalogGrams}g expected ${row.expectedG}g`}`);
  }
}

process.exit(issues.length ? 1 : 0);
