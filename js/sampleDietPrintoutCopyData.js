import { CONTACT_EMAIL } from './contactEmailData.js';

/** B&B sample diet printout — locked 1982 Warner copy (user-authored; do not reauthor). */

/** Footer contact — pinned footer on every sample diet page. */
export const SAMPLE_DIET_HEADER = Object.freeze({
  website: 'www.burnandbuilddiet.com',
  email: CONTACT_EMAIL,
});

export const SAMPLE_DIET_WELCOME = Object.freeze({
  intro: [
    'Congratulations! You have in your hands the most advanced diet available anywhere, at any price. It is the most individualized program available for losing fat. This diet will not work effectively for anyone else because it has been created just for you, using your LBM, your job, your lifestyle and your daily plan for exercise & activities.',
    'How we did it. We determined your lean weight using sophisticated body composition testing. Then you told us about your job, lifestyle, exercise and activities. With this information, the computer generated this report. Included is your ultrasound body composition report that I call your Lean Body Analysis, your food plan, daily servings, food list, and a sample menu plan.',
  ],
  leanBodyAnalysis: 'Page two is the results of your body composition test. Although very few people want to know how fat they are, all of them want to know how to lose fat. Our Lean Body Analysis page includes a breakdown of your current body composition with an emphasis on the good stuff. LBM (lean body mass) is used by the computer to calculate your metabolic rate (RMR). In addition, the Lean Body Analysis projects appropriate weight goals based on your current lean body mass.',
  /** Not rendered in the 8-page sample diet; kept for copy continuity. */
  history: 'Page three is a record of your body composition history with me. Having a history of body compositions can give you valuable information about how your eating habits are affecting your weight loss. That\'s why I recommend having your body composition checked every 6-8 weeks. I call it a check-in.',
  foodPlan: 'Page three is your custom-designed diet. How much food you need each day depends on how much LBM you have, your job, lifestyle and the type and amount of exercise you participate in. Based on the information you provide, this diet gives you the amount of protein, carbohydrates and fat you need per day to lose fat. It also tells you how much fat you can lose in eight weeks. And it shows you what your body requires at rest (your resting metabolic rate), for your workday and for one hour of each type of exercise.',
  servings: 'Page four is the servings page. No need to count calories or macros in this diet. The computer breaks down all the information from the table on page three and shows you the number of servings you need daily to have maximum strength & energy and to lose fat as fast as possible.',
  foodList: 'Pages five and six are your food list. Page five lists protein & dairy along with grains & starches. Page six lists the veggies and fruits. The gram weights on your list are scaled to your daily servings from page four.',
  menuPlan: 'Page seven is a sample menu plan for one day, showing how to build meals from your servings and food list. You can download blank menu plans at burnandbuilddiet.com/menuplanworksheet and fill in each day or week yourself.',
});

export const SAMPLE_DIET_LBA = Object.freeze({
  aceLead: 'How much body fat is right for you is a personal choice. If you have more body fat than you personally want, your Burn & Build plan gives you a path toward changing it.',
  lbaRecheckHeading: 'RECHECK YOUR PROGRESS',
  lbaRecheckBody: 'Recheck your body composition every 6–8 weeks. The goal is to see fat coming down while protecting your lean body mass, strength and energy.',
  congratsSuffix: 'Even so, it\'s a good idea to exercise at least twice a week. If you want to gain lean or maybe just tone and shape your body, do so by participating in a weight-training program two to three times a week under the guidance of an experienced trainer. The table below tells us what you would weigh for the different health categories based on your current Lean Body Mass. Increasing or decreasing your LBM would increase or decrease the suggested body weight accordingly. For maximum success, feed your body properly. This diet will show you how much food you need daily for maximum results.',
  alertSuffix: 'Exercise at least twice a week and follow this diet to support lean gain while losing fat. The table below tells us what you would weigh for the different health categories based on your current Lean Body Mass.',
  /** LBA page — connects lean mass to the weight-range table. */
  lbmWhyHeading: 'Why Lean Body Mass Matters',
  lbmWhyLead: 'Lean body mass (predominantly muscle) is your strength, your energy, and your true body shape under your fat. It\'s your muscle, bones, organs, skin, hair, and hormones.',
  lbmWhyPunchline: 'Actually, it\'s you.',
  lbmWhyClosing: 'Eating to keep your muscle (LBM) is a solid move toward being as healthy and vibrant as possible. When your lean mass is gone, you are gone.',
});

/** Lean Body Analysis page — section headings (user-authored). */
export const SAMPLE_DIET_LBA_SECTIONS = Object.freeze({
  todayHeading: 'TODAY',
  bodyFatRangeHeading: 'YOUR BODY FAT RANGE',
  weightRangesIntro: 'Here are the body weights corresponding to the different body-fat ranges.',
});

export function sampleDietLbaWeightRangesHeading(leanLbs) {
  const raw = String(leanLbs ?? '').replace(/\s*lbs\.?$/i, '').trim();
  const n = Number(raw);
  const display = Number.isFinite(n) ? n.toFixed(1) : (raw || '—');
  return `AT YOUR CURRENT ${display} LBS OF LEAN MASS`;
}

export const SAMPLE_DIET_FOOD_PLAN = Object.freeze({
  lead: 'The following food program is calculated from your individual lean body mass (LBM) and your activities. Your food plan is calculated specifically for you.',
  projectionSuffix: 'In addition, you could gain lean weight. Gaining lean weight will increase your strength and energy and offset your fat loss.',
  macroIntro: 'How much food you need each day depends on how much LBM you have. Also, it depends on your activity level and the type and amount of exercise you participate in. Based on the information you provided, the following table gives you the number of calories and the amount of protein, carbohydrates and fat you need per day to maintain your fat or to reduce body fat. Also listed is what your body requires at rest (your resting metabolic rate), for your workday and for one hour of each type of exercise.',
});

export const SAMPLE_DIET_SERVINGS_NOTE =
  'NOTE: Always consult your physician before starting this plan or making any change in your eating habits.';

/** Servings page — user-authored; do not reauthor. */
export const SAMPLE_DIET_SERVINGS_TAGLINE = 'Your daily servings and how to use them.';

export const SAMPLE_DIET_GETTING_STARTED_HEADING = 'GETTING STARTED';

export const SAMPLE_DIET_GETTING_STARTED_RULES = Object.freeze([
  'Eat all the servings recommended.',
  'Alternate meals with fruit snacks.',
  'Eat every two to three hours.',
  'Eliminate extra fats, sugar and alcohol. They slow down your fat loss.',
]);

export const SAMPLE_DIET_HELPFUL_TIPS_HEADING = 'Helpful Tips';

export const SAMPLE_DIET_HELPFUL_TIPS_SALT = Object.freeze({
  title: 'Salt',
  body:
    'Using salt is a personal choice. Most people find when they eat less fat, they also eat less salt (chips, cheese, margarine, bacon, sausage, fast food)—you get the point.',
});

export const SAMPLE_DIET_HELPFUL_TIPS_BEVERAGES = Object.freeze({
  title: 'Beverages',
  body:
    'Coffee, tea, diet drinks and seltzer water are fine. Although they do not affect fat loss, you may want to avoid them for other health reasons. Water is the best drink in the house. A simple rule is to drink a glass with every meal and snack that you eat.',
});

export const SAMPLE_DIET_FOOD_LIST_INTRO =
  'The amount shown is calculated to match your servings. No math needed.';

export const SAMPLE_DAY_MENU_PAGE_TITLE = 'Menu Plan for day or week of:';

/** Modern Menu Plan page (sample diet page 2) — user-authored; do not reauthor. */
export const SAMPLE_DAY_MENU_INTRO = 'See how easy it is to build your day.';

export const SAMPLE_DAY_MENU_CALLOUT_TITLE = 'BUILD YOUR OWN DAY';

export const SAMPLE_DAY_MENU_CALLOUT_LEAD = 'Download a blank Menu Plan at';

export const SAMPLE_DAY_MENU_WORKSHEET_NOTE_LEAD = 'You can download blank Menu Plans at ';
