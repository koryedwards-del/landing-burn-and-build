/** Golden verify fixtures for burn-engine + program report PDF checks. */

import { buildProgramPackage } from './programPackageData.js';
import { computePlan } from './burnEngine.js';
import { buildProgramReportLockedPayload } from './programReportLockedPayloadData.js';

export const GOLDEN_SAMPLE_FORM = {
  preferredName: 'Sample Female',
  email: 'verify@example.com',
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
  waiverSignature: 'Sample Female',
  waiverSignedDate: '2024-01-15',
};

/** Burn-engine intake + golden PDF values — shared by verify scripts. */
export const GOLDEN_SAMPLE_INTAKE = {
  lbm: 113.7,
  weight: 184,
  bf: 38.22,
  gender: 'female',
  heightIn: 66,
  intensity: 1.5,
  weightTrainingHours: 3,
  cardioHours: 0,
  fatBurningHours: 3,
};

export const GOLDEN_SAMPLE_GOLDEN = {
  servings: [9, 9, 3, 18],
  maintain: [71, 219, 115, 2192],
  reduce: [71, 219, 44, 1552],
  rmr: [44, 78, 80, 1211],
  workday: [25, 90, 27, 702],
  weight: [9, 96, 3, 448],
  cardio: [3, 88, 16, 509],
  fatburn: [5, 54, 22, 436],
  today: ['61.78', '38.22', '113.7', '70.3', '184.0'],
  proj: [11, 1.3, 59.3, 173, 34.29, 65.71],
  desirable: 106,
  capped: false,
  timeline: [
    ['Current', '38.22%', '184 lbs', null],
    ['8 weeks', '34.28%', '173.0 lbs', null],
    ['16 weeks', '29.81%', '162.0 lbs', 'Average'],
    ['24 weeks', '24.70%', '151.0 lbs', null],
    ['32 weeks', '18.79%', '140.0 lbs', null],
    ['40 weeks', '11.86%', '129.0 lbs', null],
    ['43.7 weeks', '8.95%', '123.9 lbs', 'Showtime'],
  ],
};

export function buildGoldenSamplePackage() {
  const pkg = buildProgramPackage(GOLDEN_SAMPLE_FORM, {
    label: '8-Week Burn & Build Program',
    meta: { source: 'verify' },
  });
  pkg.intake.leanBodyMass = 113.7;
  pkg.intake.workIntensity = 1.5;
  pkg.intake.thighMm = 25;
  pkg.intake.waistMm = 25;
  pkg.intake.waiverSignature = GOLDEN_SAMPLE_FORM.waiverSignature;
  pkg.intake.waiverSignedDate = GOLDEN_SAMPLE_FORM.waiverSignedDate;
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

export function buildVerifyProgramReportPayload() {
  return buildProgramReportLockedPayload(buildGoldenSamplePackage());
}
