/** Kristi Warner sample fixtures for Burn & Build Diet preview PDF (script + verify). */

import { buildProgramPackage } from './programPackage.js';
import { computePlan } from './burnEngine.js';
import { buildProgramReportLockedPayload } from './programReportLockedPayload.js';

export const KRISTI_PREVIEW_FORM = {
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
  waiverSignature: 'Kristi Warner',
  waiverSignedDate: '2024-01-15',
};

export function buildKristiPreviewPackage() {
  const pkg = buildProgramPackage(KRISTI_PREVIEW_FORM, {
    label: '8-Week Burn & Build Program',
    meta: { source: 'program-report-preview' },
  });
  pkg.intake.leanBodyMass = 113.7;
  pkg.intake.workIntensity = 1.5;
  pkg.intake.thighMm = 25;
  pkg.intake.waistMm = 25;
  pkg.intake.waiverSignature = KRISTI_PREVIEW_FORM.waiverSignature;
  pkg.intake.waiverSignedDate = KRISTI_PREVIEW_FORM.waiverSignedDate;
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

export function buildKristiPreviewPayload() {
  return buildProgramReportLockedPayload(buildKristiPreviewPackage());
}
