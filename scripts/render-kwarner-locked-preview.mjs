#!/usr/bin/env node
/** Preview: KWarner 5-page content + locked personalized frame — not production. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildProgramPackage } from '../js/programPackage.js';
import { computePlan } from '../js/burnEngine.js';
import { buildProgramReportPayload } from '../js/programReportPrintout.js';
import { renderProgramReportKwarnerLockedPreview } from '../server/pdf/renderProgramReportKwarnerLockedPreview.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const KWARNER_WELCOME_COPY = {
  intro: [
    'Congratulations! You have in your hands the most advanced diet available anywhere, at any price. It is the most individualized program available for losing fat. This diet will not work effectively for anyone else because it has been created just for you, using your LBM, your job, your lifestyle and your daily plan for exercise & activities.',
    'How we did it. We determined your lean weight using sophisticated body composition testing. Then you told us about your job, lifestyle, exercise and activities. With this information, the computer generated this five-page report. Included is your ultrasound body composition report that I call your Lean Body Analysis, your body composition history and the last two pages are your custom designed diet.',
  ],
  leanBodyAnalysis: 'Page two is the results of your body composition test. Although very few people want to know how fat they are, all of them want to how to lose fat. Our Lean Body Analysis page includes a breakdown of your current body composition with an emphasis on the good stuff. LBM (lean body mass) is used by the computer to calculate your metabolic rate (RMR). In addition, the Lean Body Analysis projects appropriate weight goals based on your current lean body mass.',
  history: 'Page three is a record of your body composition history with me. Having a history of body compositions can give you valuable information about how your eating habits are affecting your weight loss. That\'s why I recommend having your body composition checked every 6-8 weeks. I call it a check-in.',
  foodPlan: 'Page four is your custom-designed diet. How much food you need each day depends on how much LBM you have, your job, lifestyle and the type and amount of exercise you participate in. Based on the information you provide, this diet gives you the amount of protein, carbohydrates and fat you need per day to lose fat. It also tells you how much fat you can lose in eight weeks. And it shows you what your body requires at rest (your resting metabolic rate), for your workday and for one hour of each type of exercise.',
  servings: 'Page five is the servings page. No need to count calories or macros in this diet. The computer breaks down all the information from the table on page four and shows you the number of servings you need daily to have maximum strength & energy and to lose fat as fast as possible.',
};

const KRISTI_FORM = {
  preferredName: 'Kristi Warner',
  email: 'preview@example.com',
  sex: 'female',
  heightFeet: '5',
  heightInchesPart: '6',
  age: 28,
  weightText: '184',
  fatPercentText: '38.22',
  fatSource: 'recent',
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
payload.welcome = KWARNER_WELCOME_COPY;
delete payload.gettingStarted;
delete payload.stepsToSuccess;

const pdf = await renderProgramReportKwarnerLockedPreview(payload);

const outPath = path.join(root, 'docs/samples/kwarner-locked-preview-kristi.pdf');
fs.writeFileSync(outPath, pdf);

const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
console.log(`Wrote ${outPath} — ${pages} page(s), ${pdf.length} bytes`);
