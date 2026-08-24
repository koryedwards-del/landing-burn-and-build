/** Kristi Warner fixtures for KWarner locked preview PDF (script + API). */

import { buildProgramPackage } from './programPackage.js';
import { computePlan } from './burnEngine.js';
import { buildKwarnerLockedPayloadFromPackage } from './kwarnerLockedPayload.js';

export const KWARNER_WELCOME_COPY = {
  intro: [
    'Congratulations! You have in your hands the most advanced diet available anywhere, at any price. It is the most individualized program available for losing fat. This diet will not work effectively for anyone else because it has been created just for you, using your lean body mass (LBM), your job, your day to day, and your weekly plan for weight training (WT), high heart rate aerobic activity (HHT), and low heart rate aerobic activity (LHR).',
    'How we did it. We determined your lean weight using sophisticated body composition testing. Then you told us about your job, day to day, and exercise hours. With this information, the computer generated this report. Page two is your Lean Body Analysis; the pages that follow are your projections and custom-designed diet.',
  ],
  leanBodyAnalysis:
    'Page two is the results of your body composition test. Although very few people want to know how fat they are, all of them want to how to lose fat. Our Lean Body Analysis page includes a breakdown of your current body composition with an emphasis on the good stuff. LBM (lean body mass) is used by the computer to calculate your metabolic rate (RMR). In addition, the Lean Body Analysis projects appropriate weight goals based on your current lean body mass.',
  projections:
    'Pages three and four are your Projections. They bring together your lean body mass (LBM), your job, your day to day, and the hours you plan to spend on weight training (WT), high heart rate aerobic activity (HHT), and low heart rate aerobic activity (LHR) — the same inputs the computer uses to build your food plan. The timeline table shows your projected fat and body fat % over the next eight weeks.',
  foodPlan:
    'Page five is your custom-designed food plan. We use your body composition information to determine your LBM (lean body mass), then factor in your job, your day to day, and how many hours per week you spend on weight training (WT), high heart rate aerobic work (HHT) such as running or hard cardio, and low heart rate aerobic work (LHR) such as walking or easy cycling. The page shows how much fat you can lose in eight weeks, compares your body today with your eight-week goal, and explains what happens when protein, carbohydrates, or fat are too high or too low — so the servings on the next page make sense without counting grams.',
  servings:
    'Page six is the servings page. No need to count calories or macronutrients (protein, carbohydrates, and fat) yourself. The computer turns everything from page five into daily servings divided across breakfast, lunch, dinner, and snacks — so you have maximum strength and energy while losing fat as fast as this plan allows.',
};

export const KWARNER_FOOD_PLAN_LEAD = [
  'We have been converting macros since 1982.',
  'The challenge with macros is slippage.',
];

export const KRISTI_KWARNER_FORM = {
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

export function buildKristiKwarnerPreviewPackage() {
  const pkg = buildProgramPackage(KRISTI_KWARNER_FORM, {
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

export function buildKristiKwarnerPreviewPayload() {
  return buildKwarnerLockedPayloadFromPackage(buildKristiKwarnerPreviewPackage());
}
