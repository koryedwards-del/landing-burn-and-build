/** Program report — educational narrative for every page (questionnaire → printout). */

import {
  WORK_PHYSICAL,
  WORK_STRESS,
  heightReadable,
} from './onboardingEngine.js';
import {
  aceCategoryForBodyFat,
  formatSexLabel,
  lbmStatusMessage,
} from './lbaPrintout.js';
import { exerciseHoursSummary, eightWeekProjectionFromPackage } from './foodPlanPrintout.js';
import { extraFatLines, servingsGridRows } from './servingsPrintout.js';

function formatBodyFat(pct) {
  const n = Number(pct);
  if (!Number.isFinite(n)) return '—';
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function formatWeight(lbs) {
  const n = Number(lbs);
  if (!Number.isFinite(n)) return '—';
  return String(Math.round(n));
}

function formatLbm(lbs) {
  const n = Number(lbs);
  if (!Number.isFinite(n)) return '—';
  return n.toFixed(1);
}

function workdayPhrase(intake) {
  const physical = WORK_PHYSICAL.find((item) => item.id === intake.workPhysical);
  const stress = WORK_STRESS.find((item) => item.id === intake.workStress);
  if (physical && stress) {
    return `${physical.label.toLowerCase()}, ${stress.label.toLowerCase()} day-to-day pace`;
  }
  return 'your typical workday';
}

function formatHoursPhrase(hours, activityLabel) {
  const n = Number(hours);
  if (!Number.isFinite(n) || n <= 0) return `0 hours of ${activityLabel}`;
  const text = Number.isInteger(n) ? String(n) : String(parseFloat(n.toFixed(2)));
  return `${text} ${n === 1 ? 'hour' : 'hours'} of ${activityLabel}`;
}

function exerciseSummaryPhrase(intake) {
  return [
    formatHoursPhrase(intake.weightTrainingHours, 'weight training'),
    formatHoursPhrase(intake.cardioHours, 'vigorous cardio'),
    formatHoursPhrase(intake.fatBurningHours, 'fat-burning activity'),
  ].join(', ');
}

function servingsSummary(pkg) {
  const s = pkg?.plan?.servings;
  if (!s) return 'your daily serving totals';
  const parts = [];
  if (s.protein) parts.push(`${s.protein} protein`);
  if (s.grainsStarches) parts.push(`${s.grainsStarches} grains/starches`);
  if (s.vegetables) parts.push(`${s.vegetables} vegetables`);
  if (s.fruits) parts.push(`${s.fruits} fruits`);
  return parts.length ? parts.join(', ') : 'your daily serving totals';
}

function formatHistoryDate(iso) {
  if (!iso) return '—';
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return String(iso);
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T12:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function historyStory(rows) {
  if (!rows?.length) {
    return {
      hasHistory: false,
      paragraphs: ['This is your first body composition record with us. Use today as your starting point.'],
    };
  }
  if (rows.length === 1) {
    return {
      hasHistory: false,
      paragraphs: ['This is your first body composition record with us. Use today as your starting point.'],
    };
  }

  const today = rows[0];
  const oldest = rows[rows.length - 1];
  const todayWeight = Math.round(Number(today.weightLbs) || 0);
  const oldWeight = Math.round(Number(oldest.weightLbs) || 0);
  const todayLean = Number(today.leanLbs).toFixed(1);
  const oldLean = Number(oldest.leanLbs).toFixed(1);
  const todayFatPct = Number(today.fatPercent).toFixed(1);
  const oldFatPct = Number(oldest.fatPercent).toFixed(1);

  return {
    hasHistory: true,
    paragraphs: [
      `Your earliest record in this report is from ${formatHistoryDate(oldest.testDate)}. At that test you weighed about ${oldWeight} lbs with ${oldFatPct}% body fat and ${oldLean} lbs of lean weight.`,
      `Today you weigh ${todayWeight} lbs with ${todayFatPct}% body fat and ${todayLean} lbs of lean weight.`,
      Number(todayLean) > Number(oldLean)
        ? `Your lean weight is higher today than in that earliest record. That usually means you have built or kept muscle along the way — not just lost weight on the scale.`
        : `Compare lean weight, not just scale weight. The goal is to lose fat while keeping as much lean as you can.`,
      `Re-test every 6 to 8 weeks. You want to confirm you are losing fat — not lean.`,
    ],
    highlights: rows.slice(0, 4).map((row) => ({
      date: formatHistoryDate(row.testDate),
      weight: `${Math.round(Number(row.weightLbs) || 0)} lbs`,
      lean: `${Number(row.leanLbs).toFixed(1)} lbs lean`,
      fatPct: `${Number(row.fatPercent).toFixed(1)}% fat`,
    })),
  };
}

export function buildWelcomeNarrative(pkg) {
  const intake = pkg?.intake || {};
  const weight = formatWeight(intake.totalWeight);
  const fatPct = formatBodyFat(intake.fatPercent);
  const lbm = formatLbm(intake.leanBodyMass);
  const height = heightReadable(intake.heightInches);
  const sex = formatSexLabel(intake.sex);
  const exercise = exerciseSummaryPhrase(intake);

  return {
    pageTitle: 'Welcome',
    intro: [
      'Congratulations. You have in your hands a food plan built only for you.',
      'You answered questions about your body, your job, and the exercise you plan to do over the next eight weeks. The pages ahead show what we asked, why we asked it, and what we built from your answers.',
      'Every number in this report came from information you provided. That is why this plan will not work the same for anyone else.',
    ],
    blocks: [
      {
        title: 'Your weight and body fat',
        asked: `You told us you weigh ${weight} lbs and your body fat is about ${fatPct}%.`,
        why: 'We use those two numbers to find your lean body mass — the part of your body that is not fat. That number drives your daily food plan.',
        seeIt: 'Your Body Today — lean, fat, and what those numbers mean.',
      },
      {
        title: 'Your height and sex',
        asked: `You are ${height ? `${height}, ` : ''}${sex.toLowerCase()}.`,
        why: 'Healthy ranges differ for men and women and for different builds.',
        seeIt: 'Your Body Today — how your lean weight compares for your height.',
      },
      {
        title: 'Your job',
        asked: `You said your work is ${workdayPhrase(intake)}.`,
        why: 'A desk job burns less fuel than being on your feet or lifting. Your workday changes how much food you need.',
        seeIt: 'How Your Plan Was Built — your job is part of the calculation.',
      },
      {
        title: 'Your exercise — next 8 weeks',
        asked: `You plan ${exercise} per week.`,
        why: 'We only count exercise you will actually do. More movement raises what you need to eat to lose fat without losing energy.',
        seeIt: 'How Your Plan Was Built — your exercise hours are listed there.',
      },
    ],
    closing: [
      'The next pages walk through your body numbers, your progress over time, how your plan was calculated, and your daily servings.',
      'Your food list and menu planner are online in Print Shop.',
    ],
    startHereLabel: 'START HERE',
    startHere: [
      'Read this report once — start to finish.',
      'Print your Servings page and post it where you will see it.',
      'Build meals from the food list in Print Shop.',
      'Stay consistent for 8 weeks, then re-test.',
    ],
  };
}

export function buildBodyTodayNarrative(pkg, { today, gender }) {
  const intake = pkg?.intake || {};
  const lbmCopy = lbmStatusMessage({
    gender,
    heightInches: intake.heightInches,
    leanBodyMass: intake.leanBodyMass,
  });
  const ace = aceCategoryForBodyFat(gender, intake.fatPercent);
  const sex = formatSexLabel(intake.sex);
  const stageLine = ace
    ? `Your body fat percentage falls in the ${ace.label} stage.`
    : 'Your body fat percentage is above the Training stage.';

  return {
    pageTitle: 'Your Body Today',
    intro: [
      'On the questionnaire you entered your weight and body fat percentage. Those two answers tell us what your body is made of right now.',
    ],
    callouts: [
      { label: 'Lean weight', value: `${today.leanLbs} lbs`, detail: `${today.leanPct}% of you` },
      { label: 'Fat weight', value: `${today.fatLbs} lbs`, detail: `${today.fatPct}% of you` },
      { label: 'Total weight', value: `${today.totalLbs} lbs`, detail: 'on the scale today' },
    ],
    blocks: [
      {
        title: 'What is lean body mass?',
        paragraphs: [
          'Lean body mass is everything that is not fat — muscle, organs, bone, and water. It is the part of you that burns fuel. Your food plan is built from this number, not from total scale weight alone.',
        ],
      },
      {
        title: 'What you told us',
        paragraphs: [
          `You are ${sex.toLowerCase()}, ${heightReadable(intake.heightInches) || '—'}, ${intake.age || '—'} years old. You reported ${formatWeight(intake.totalWeight)} lbs on the scale and ${formatBodyFat(intake.fatPercent)}% body fat.`,
          `From that, your lean weight is ${formatLbm(intake.leanBodyMass)} lbs. That is the number the Burn Engine uses first.`,
        ],
      },
      {
        title: 'Where you stand',
        paragraphs: [
          stageLine,
          'How much fat is right for you is a personal choice. How you look in the mirror is the best judge of whether you want to lose fat.',
          lbmCopy.lead,
          lbmCopy.congrats
            ? lbmCopy.congrats.split('.')[0] + '.'
            : 'Feed your body properly — this plan shows how much food you need daily.',
        ].filter(Boolean),
      },
      {
        title: 'Why this page matters',
        paragraphs: [
          'Your lean weight sets your base need for food. Your job and exercise (on the next pages) adjust that up or down. Together they become your daily servings.',
        ],
      },
    ],
  };
}

export function buildProgressNarrative(historyRows) {
  const rawRows = historyRows || [];
  const story = historyStory(rawRows);

  return {
    pageTitle: 'Your Progress',
    intro: [
      'If you have past body composition tests, they show more than a single number on a scale. They show whether you are losing fat, gaining lean, or both.',
    ],
    blocks: [
      {
        title: 'Your story in the records',
        paragraphs: story.paragraphs,
      },
      ...(story.hasHistory && story.highlights?.length ? [{
        title: 'Recent tests at a glance',
        paragraphs: story.highlights.map(
          (row) => `${row.date}: ${row.weight}, ${row.lean}, ${row.fatPct}.`,
        ),
      }] : []),
      {
        title: 'What to do with this',
        paragraphs: [
          'Use history to see direction, not to chase perfection on every test. When lean holds steady or climbs and fat falls, the plan is working.',
          'If you only watch the bathroom scale, you can miss the good changes happening inside.',
        ],
      },
    ],
  };
}

export function buildFoodPlanNarrative(pkg, { today, projection, hours, gender }) {
  const intake = pkg?.intake || {};
  const lbm = formatLbm(intake.leanBodyMass);
  const fatLost = projection ? projection.fatLostLbs.toFixed(1) : '—';
  const weekly = projection ? projection.weeklyFatLossLbs.toFixed(1) : '—';
  const endWeight = projection ? projection.endWeight.toFixed(1) : '—';

  return {
    pageTitle: 'How Your Plan Was Built',
    intro: [
      'Your food plan is not a generic diet. It is a calculation that starts with your lean body mass, then adds what you told us about your job and your exercise.',
    ],
    blocks: [
      {
        title: 'Step 1 — Start with lean weight',
        paragraphs: [
          `Your lean body mass is ${lbm} lbs. The Burn Engine uses this as your starting point for how much fuel your body needs.`,
        ],
      },
      {
        title: 'Step 2 — Add your workday',
        paragraphs: [
          `You said your work is ${workdayPhrase(intake)}. More movement and stress during the workday raises your daily need. Less movement lowers it.`,
        ],
      },
      {
        title: 'Step 3 — Add your exercise',
        paragraphs: [
          `You plan ${exerciseSummaryPhrase(intake)} per week (${hours.total} total hours).`,
          'We count only active time — not rest between sets or scrolling on a treadmill.',
        ],
      },
      {
        title: 'Step 4 — Turn targets into servings',
        paragraphs: [
          'The computer calculated your daily food targets, then converted them into servings — protein, grains, vegetables, fruits, and fats.',
          'You follow servings, not calories. The math is already done. Your job is to pick foods from the approved food list and hit your daily totals.',
        ],
      },
      {
        title: 'Your eight-week outlook',
        paragraphs: projection ? [
          `If you follow this plan closely, in eight weeks you could safely lose about ${fatLost} lbs of fat — roughly ${weekly} lbs per week on average.`,
          `Today you weigh ${today.totalLbs} lbs. Your eight-week target weight is about ${endWeight} lbs, with lean weight held at ${projection.leanLbs.toFixed(1)} lbs.`,
          'You may also gain a little lean weight as you train. That increases strength and energy and can offset some of what the scale shows.',
        ] : [
          'Your eight-week projection is based on the calorie gap between maintaining and reducing body fat.',
        ],
      },
    ],
  };
}

export function buildServingsNarrative(pkg) {
  const summary = servingsSummary(pkg);
  const extraFats = extraFatLines(pkg);

  return {
    pageTitle: 'Your Daily Servings',
    intro: [
      'This is the page to print and use every day. These numbers are your plan — built from everything you told us on the questionnaire.',
    ],
    blocks: [
      {
        title: 'What is a serving?',
        paragraphs: [
          'A serving is a measured portion from an approved food group — not a vague "healthy choice." Each food on your food list tells you what counts as one serving.',
        ],
      },
      {
        title: 'Your daily totals',
        paragraphs: [
          `Your plan: ${summary}. Extra fats are listed separately on the grid below.`,
          'Spread protein through breakfast, lunch, and dinner. Eat vegetables at dinner. Eat fruit at snack times.',
        ],
      },
      {
        title: 'How to use this page',
        paragraphs: [
          'Open Print Shop for your food list and menu planner. Build meals that add up to these daily totals.',
          'Stay consistent for eight weeks. If your exercise or job changes significantly, build a new program with updated answers.',
        ],
      },
    ],
    note: 'Always consult your physician before starting this plan or making any change in your eating habits.',
    gridRows: servingsGridRows(pkg),
    extraFats,
  };
}

export function buildProgramReportNarratives(pkg, context = {}) {
  return {
    welcome: buildWelcomeNarrative(pkg),
    bodyToday: buildBodyTodayNarrative(pkg, context),
    progress: buildProgressNarrative(context.historyRows),
    foodPlan: buildFoodPlanNarrative(pkg, context),
    servings: buildServingsNarrative(pkg),
  };
}
