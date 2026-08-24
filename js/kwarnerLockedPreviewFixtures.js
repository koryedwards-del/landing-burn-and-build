/** Kristi Warner fixtures for KWarner locked preview PDF (script + API). */

import { buildProgramPackage } from './programPackage.js';
import { computePlan } from './burnEngine.js';
import { buildKwarnerLockedPayloadFromPackage } from './kwarnerLockedPayload.js';

export const KWARNER_WELCOME_COPY = {
  intro: [
    'Congratulations! You have in your hands the most advanced diet available anywhere, at any price. It is the most individualized program available for losing fat. This diet will not work effectively for anyone else because it has been created just for you, using your lean body mass (LBM), your job, your day to day, and your weekly plan for weight training (WT), high heart rate aerobic activity (HHT), and low heart rate aerobic activity (LHR).',
    'How we did it. We determined your lean weight using sophisticated body composition testing. Then you told us about your job, day to day, and exercise hours. With this information, the computer generated this report. Page two is your Lean Body Analysis, including your projected progress; the pages that follow are your custom-designed diet and food list.',
  ],
  leanBodyAnalysis:
    'Page two is the results of your body composition test. Although very few people want to know how fat they are, all of them want to how to lose fat. Our Lean Body Analysis page includes your profile, a snapshot of where you are today, and a Projected Progress bar — where you are and where you are headed. LBM (lean body mass) is used by the computer to calculate your metabolic rate (RMR). The bar shows appropriate weight goals for each leanness stage and projected body fat over time, based on your current lean body mass.',
  foodPlan:
    'Page three is your custom-designed food plan. We use your body composition information to determine your LBM (lean body mass), then factor in your job, your day to day, and how many hours per week you spend on weight training (WT), high heart rate aerobic work (HHT) such as running or hard cardio, and low heart rate aerobic work (LHR) such as walking or easy cycling. The page shows how much fat you can lose in eight weeks, compares your body today with your eight-week goal, and explains what happens when protein, carbohydrates, or fat are too high or too low — so the servings on the next page make sense without counting grams.',
  servings:
    'Page four is the servings page. No need to count calories or macronutrients (protein, carbohydrates, and fat) yourself. The computer turns everything from page three into daily servings divided across breakfast, lunch, dinner, and snacks — so you have maximum strength and energy while losing fat as fast as this plan allows.',
  foodList:
    'Pages five through seven are your food list. Page five lists protein, grains, and starches. Page six lists vegetables and fruit. Page seven covers seasonings and splashes. These foods were chosen from the bodybuilder cutting-diet staples used in Warner 1982 — foods that work in real prep, not theory. Each item is matched to Burn Engine serving rules and sized with USDA nutrition data so one serving delivers the protein, carbohydrate, or produce your plan calls for. The gram weights on your list are scaled to your daily servings from page four. Weigh your portions, stay inside your servings, and build meals only from these approved foods.',
};

export const KWARNER_FOOD_PLAN_LEAD = [
  'Warner 1982 asked how much food you need for what you do. Burn & Build 2026 answers the same question — as servings built for your lean body mass, your job, and your exercise.',
  'We do not put macro totals in your hands. Today it is easy to compare numbers against apps and advice that were never built for you. That is slippage — and it breaks the plan.',
];

export const KWARNER_FOOD_PLAN_STEP4 = [
  'The computer calculated what you need for your body and your activity, then converted it into servings — protein, grains, vegetables, fruits, and fats.',
  'You follow servings, not calories and not macro totals from the internet. The math is already done. Your job is to pick foods from the approved food list and hit your daily totals.',
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
