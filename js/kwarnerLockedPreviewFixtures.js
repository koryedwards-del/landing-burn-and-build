/** Kristi Warner fixtures for KWarner locked preview PDF (script + API). */

import { buildProgramPackage } from './programPackage.js';
import { computePlan } from './burnEngine.js';
import { buildKwarnerLockedPayloadFromPackage } from './kwarnerLockedPayload.js';

export const KWARNER_WELCOME_COPY = {
  intro: [
    'Congratulations! You have in your hands the most advanced diet available anywhere, at any price. It is the most individualized program available for losing fat. This diet will not work effectively for anyone else because it has been created just for you, using your lean body mass (LBM), your job, your day to day, and your weekly plan for weight training (WT), high heart rate aerobic activity (HHT), and low heart rate aerobic activity (LHR).',
    'How we did it. We determined your lean weight using sophisticated body composition testing. Then you told us about your job, day to day, and exercise hours. With this information, Burn & Build generated this report. Page two is your Lean Body Analysis, including your projected progress; the pages that follow are your custom-designed diet and food list.',
  ],
  leanBodyAnalysis:
    'Page two is the results of your body composition test. Although very few people want to know how fat they are, all of them want to how to lose fat. Our Lean Body Analysis page includes your profile, a snapshot of where you are today, and a Projected Progress bar — where you are and where you are headed. Burn & Build uses your LBM (lean body mass) to calculate your metabolic rate (RMR). The bar shows appropriate weight goals for each leanness stage and projected body fat over time, based on your current lean body mass.',
  foodPlan:
    'Page three is your custom-designed food plan. It explains why servings go a step farther than macros, what each food group does for your body, and how Burn & Build built your prescription from your lean body mass, job, and exercise. The servings on page four follow directly from this page.',
  servings:
    'Page four is the servings page. Burn & Build turns everything from page three into daily servings divided across breakfast, lunch, dinner, and snacks so you have maximum strength and energy while losing fat as fast as this plan allows.',
  foodList:
    'Pages five through seven are your food list. Page five lists protein, grains, and starches. Page six lists vegetables and fruit. Page seven covers seasonings and splashes. These foods were chosen from the bodybuilder cutting-diet staples used in Warner 1982 — foods that work in real prep. Each item is matched to Burn Engine serving rules and sized with USDA nutrition data so one serving delivers the protein, carbohydrate, or produce your plan calls for. The gram weights on your list are scaled to your daily servings from page four. Weigh your portions, stay inside your servings, and build meals from these approved foods.',
};

export const KWARNER_FOOD_PLAN_LEAD = [
  'Macros are considered the be all end all to nutrition knowledge. But knowing your macros still means you need to figure out what to eat. Since 1982 Burn & Build has been converting macros to servings using proven fat burning muscle building foods. For the best results you need a plan that goes a step farther than macros.',
];

export const KWARNER_FOOD_PLAN_HOWTO = [
  'Burn & Build converted the proteins and carbohydrates into servings from protein, dairy, grains, starches, veggies and fruits. All whole clean food choices. Each food on the list is sized to fit your needs. This program is customized to you and won\'t work for anyone else. And although it\'s not easy it is simple.',
  'Step 1 Pull out your kitchen scale. Get one now for about $50 on Amazon.',
  'Step 2 Choose the protein food you want to eat. Put that amount on your plate. The plan uses grams because they are accurate down to the weight of a paper clip.',
  'Step 3 Choose the grain or starch you want. Add the serving amount to your plate.',
  'Step 4 Season as desired. No added fat, sugar or alcohol.',
  'Step 5 Eat all the food you put on the plate.',
];

export const KWARNER_FOOD_GROUPS_INTRO =
  'Protein, carbohydrates, and fat each support lean mass, energy, and fat loss. The table below shows how each food group works in your plan as you follow your servings. Burn & Build cuts the fine line between too much and too little and that\'s the secret to losing fat and building muscle on the same diet.';

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
