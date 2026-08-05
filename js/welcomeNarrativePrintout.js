/** Welcome page — asked / why / see-it narrative from questionnaire → printout. */

import {
  WORK_PHYSICAL,
  WORK_STRESS,
  heightReadable,
} from './onboardingEngine.js';
import { formatSexLabel } from './lbaPrintout.js';

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
  const move = physical?.label?.toLowerCase() || 'typical for your job';
  const pace = stress?.label?.toLowerCase() || 'typical';
  if (physical && stress) {
    return `your work is ${move}, with a ${pace} day-to-day pace`;
  }
  return 'your workday activity and stress level';
}

function formatHoursPhrase(hours, activityLabel) {
  const n = Number(hours);
  if (!Number.isFinite(n) || n <= 0) {
    return `0 hours of ${activityLabel}`;
  }
  const text = Number.isInteger(n) ? String(n) : String(parseFloat(n.toFixed(2)));
  const unit = n === 1 ? 'hour' : 'hours';
  return `${text} ${unit} of ${activityLabel}`;
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

export function buildWelcomeNarrative(pkg) {
  const intake = pkg?.intake || {};
  const weight = formatWeight(intake.totalWeight);
  const fatPct = formatBodyFat(intake.fatPercent);
  const lbm = formatLbm(intake.leanBodyMass);
  const height = heightReadable(intake.heightInches);
  const sex = formatSexLabel(intake.sex);
  const exercise = exerciseSummaryPhrase(intake);
  const servings = servingsSummary(pkg);

  return {
    pageTitle: 'Welcome',
    intro: [
      'Congratulations. You have in your hands a food plan built only for you.',
      'You answered questions about your body, your job, and the exercise you plan to do over the next eight weeks. This page shows what we asked, why we asked it, and where each answer shows up in your report.',
      'Every number in the pages ahead came from information you provided. That is why this plan will not work the same for anyone else.',
    ],
    blocks: [
      {
        title: 'Your weight and body fat',
        asked: `You told us you weigh ${weight} lbs and your body fat is about ${fatPct}%.`,
        why: 'We use those two numbers to find your lean body mass — the part of your body that is not fat (muscle, organs, and bone). That number tells us how much fuel your body needs each day.',
        seeIt: `Lean Body Analysis — your lean weight is ${lbm} lbs. Lean, fat, and total breakdown start there.`,
      },
      {
        title: 'Your height and sex',
        asked: `You are ${height ? `${height}, ` : ''}${sex.toLowerCase()}.`,
        why: 'Healthy lean-weight ranges and body-fat reference charts differ for men and women and for different builds.',
        seeIt: 'Lean Body Analysis — reference ranges and whether your lean weight is in a strong place for your height.',
      },
      {
        title: 'Your job',
        asked: `You said ${workdayPhrase(intake)}.`,
        why: 'A desk job burns less fuel during the day than being on your feet or lifting. How demanding your typical workday is changes how much food you need.',
        seeIt: 'Food Plan — your workday is part of how your daily food targets were calculated.',
      },
      {
        title: 'Your exercise — next 8 weeks',
        asked: `You plan ${exercise} per week.`,
        why: 'We only count exercise you will actually do. More movement raises what you need to eat to lose fat without losing energy. Overstating exercise gives you too little food and makes the plan harder to follow.',
        seeIt: 'Food Plan — your exercise hours are listed there and helped set your daily targets.',
      },
      {
        title: 'What that became',
        asked: 'The Burn Engine combined your lean body mass, your job, and your exercise into daily food targets.',
        why: 'Then we turned those targets into servings — protein, grains, vegetables, fruits, and fats — so you do not have to count calories.',
        seeIt: `Servings — ${servings} (plus fats). Those are your numbers for each day.`,
      },
    ],
    closing: [
      'Your approved food list and menu planner are online in Print Shop. This report explains why your numbers are yours. The food list shows what you can eat to hit them.',
    ],
    startHereLabel: 'START HERE',
    startHere: [
      'Read this report once.',
      'Print your Servings page and post it where you will see it.',
      'Build meals from the food list in Print Shop.',
      'Use the menu planner to track servings through the week.',
      'Stay consistent for 8 weeks.',
    ],
  };
}
