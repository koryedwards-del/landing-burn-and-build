#!/usr/bin/env node
/** Render Kristi guided-learning program report — run: node scripts/render-welcome-draft.mjs */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildProgramPackage } from '../js/programPackage.js';
import { computePlan } from '../js/burnEngine.js';
import { buildProgramReportPayload } from '../js/programReportPrintout.js';
import { renderPrintPdf } from '../server/pdf/index.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const KRISTI_FORM = {
  preferredName: 'Kristi Warner',
  email: 'preview@example.com',
  sex: 'female',
  heightFeet: '5',
  heightInchesPart: '6',
  age: 28,
  weightText: '184',
  fatPercentText: '38.22',
  fatSource: 'skinfolds',
  workPhysical: 'sitting',
  workStress: 'comfortable',
  weightTrainingHours: 3,
  cardioHours: 0,
  fatBurningHours: 3,
  wakeTime: '06:00',
};

function buildKristiPreviewPackage() {
  const pkg = buildProgramPackage(KRISTI_FORM, {
    label: '8-Week Burn & Build Program',
    meta: { source: 'program-report-preview' },
  });
  pkg.intake.leanBodyMass = 113.7;
  pkg.intake.workIntensity = 1.5;
  pkg.intake.thighMm = 25;
  pkg.intake.waistMm = 25;
  pkg.program.foodPlanCreatedDate = '2024-01-15';
  pkg.program.issuedAt = '2024-01-15T12:00:00.000Z';

  const plan = computePlan({
    lbm: pkg.intake.leanBodyMass,
    intensity: pkg.intake.workIntensity,
    weightTrainingHours: pkg.intake.weightTrainingHours,
    cardioHours: pkg.intake.cardioHours,
    fatBurningHours: pkg.intake.fatBurningHours,
  });
  pkg.plan = {
    ...pkg.plan,
    servings: plan.servings,
    summary: {
      maintainTotalCals: plan.maintainTotalCals,
      reduceTotalCals: plan.reduceTotalCals,
      maintainProteinGrams: plan.maintainProteinGrams,
      reduceFatGrams: plan.reduceFatGrams,
      maintainFatCalories: plan.maintainFatCalories,
      reduceFatCalories: plan.reduceFatCalories,
      weeklyFatLossPounds: plan.weeklyFatLossPounds,
    },
    formula: plan.formula,
  };
  return pkg;
}

const payload = buildProgramReportPayload(buildKristiPreviewPackage());
const pdf = await renderPrintPdf('programreport', { payload });

const outPath = path.join(root, 'docs/samples/guided-learning-kristi.pdf');
fs.writeFileSync(outPath, pdf);

const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
console.log(`Wrote ${outPath} — ${pages} page(s), ${pdf.length} bytes`);
