/** Burn & Build Diet PDF payload — questionnaire data + burn-engine calcs (sample + purchased). */

import { computeTodayBodyComposition } from './bodyCompositionData.js';
import { analyzeLeanBodyMass } from './bodyCompositionData.js';
import { eightWeekProjectionFromPackage, exerciseHoursSummary } from './foodPlanPrintout.js';
import { INTAKE_WEIGHTS_RACQUET_SPORTS, INTAKE_WEIGHTS_RACQUET_SPORTS_TITLE } from './intakeQuestionCopyData.js';
import { servingsGridRows } from './servingsPrintout.js';
import { lbaTodayTableRows } from './leanBodyAnalysisPrintout.js';
import {
  ANSWERS_CONFIRMATION_INTRO,
  buildAnswersConfirmationRows,
} from './answersConfirmationPrintout.js';
import {
  formatProgramDateLong,
  programClientName,
  programClientNameUpper,
  programPreparedDate,
} from './programClientDataHelpers.js';
import {
  aceBodyFatCategories,
  aceBodyFatWeightRanges,
  aceActiveBodyFatCategory,
} from './sampleDietAceData.js';
import { macroWorkdayRowLabel } from './profileDataEngine.js';
import {
  SAMPLE_DIET_FOOD_PLAN,
  SAMPLE_DIET_FOOD_LIST_INTRO,
  SAMPLE_DIET_HEADER,
  SAMPLE_DIET_LBA,
  SAMPLE_DIET_LBA_SECTIONS,
  sampleDietLbaWeightRangesHeading,
  SAMPLE_DIET_GETTING_STARTED_HEADING,
  SAMPLE_DIET_GETTING_STARTED_RULES,
  SAMPLE_DIET_HELPFUL_TIPS_BEVERAGES,
  SAMPLE_DIET_HELPFUL_TIPS_HEADING,
  SAMPLE_DIET_HELPFUL_TIPS_SALT,
  SAMPLE_DIET_SERVINGS_NOTE,
  SAMPLE_DIET_SERVINGS_TAGLINE,
  SAMPLE_DIET_WELCOME,
} from './sampleDietPrintoutCopyData.js';
import { buildSampleDayMenu } from './sampleDayMenuPrintoutData.js';
import { buildSampleDietPreviewPackage } from './sampleDietPreviewFixtures.js';
import { HANDBOOK_FAQ_ITEMS } from '../data/handbookFaqPrintout.js';

const rnd = (x) => Math.round(Number(x));

function formatCalories(n) {
  return rnd(n).toLocaleString('en-US');
}

function buildLbmCallout({ gender, heightInches, leanBodyMass, today }) {
  const analysis = analyzeLeanBodyMass({ gender, heightInches, leanBodyMass });
  const leanLbs = today?.leanLbs ?? String(leanBodyMass ?? '—');
  const leanDisplay = String(leanLbs).replace(/\s*lbs\.?$/i, '').trim();
  if (!analysis.desirableLbm) {
    return null;
  }
  const statusLine = analysis.atOrAbove
    ? 'Your LBM is at or above the desirable amount for your height.'
    : 'Your LBM is below the desirable amount for your height.';
  return { leanLbs: leanDisplay, statusLine };
}

function formatLbaBodyFatPercent(value) {
  const raw = String(value ?? '').trim().replace(/%$/, '');
  if (!raw) return '—';
  const n = Number(raw);
  return Number.isFinite(n) ? `${n.toFixed(2)}%` : `${raw}%`;
}

function lbmStatusCopy1982({ heightInches, leanBodyMass, gender }) {
  const analysis = analyzeLeanBodyMass({ gender, heightInches, leanBodyMass });
  if (!analysis.desirableLbm) {
    return { lead: '', congrats: '', alert: '' };
  }
  const lead = `Desirable lean body mass for your height is ${Math.round(analysis.desirableLbm)} pounds or more.`;
  if (analysis.atOrAbove) {
    return {
      lead,
      congrats: `CONGRATULATIONS! Your LBM is at or above the desirable amount. ${SAMPLE_DIET_LBA.congratsSuffix}`,
      alert: '',
    };
  }
  return {
    lead,
    congrats: '',
    alert: `ALERT! Your LBM is below the desirable amount for your height. ${SAMPLE_DIET_LBA.alertSuffix}`,
  };
}

function macroExerciseHoursLabel(hours) {
  const n = Number(hours);
  const value = Number.isFinite(n) ? n : 0;
  const text = Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
  return `${text} ${value === 1 ? 'hour' : 'hours'}`;
}

function buildMacroTableRows(formula, workPhysical, intake = {}) {
  const f = formula || {};
  const workdayLabel = macroWorkdayRowLabel(workPhysical);
  const row = (label, q, c, f, total) => ({
    label,
    proteinG: rnd(q),
    proteinCal: formatCalories(rnd(Number(q) * 4)),
    carbsG: rnd(c / 4),
    carbsCal: formatCalories(rnd(c)),
    fatG: rnd(f / 9),
    fatCal: formatCalories(rnd(f)),
    totalCal: formatCalories(rnd(total)),
  });
  return [
    row('Maintain current fat %', f.QA, f.C1, f.FD, f.T7),
    row('Reduce current fat %', f.QA, f.C1, f.FG, f.T1),
    row('Resting(RMR)', f.QB, f.C2, f.FH, f.T2),
    row(`Workday (${workdayLabel})`, f.QC, f.C3, f.FJ, f.T3),
    row(`${INTAKE_WEIGHTS_RACQUET_SPORTS_TITLE} (${macroExerciseHoursLabel(intake.weightTrainingHours)})`, f.QD, f.C4, f.FK, f.T4),
    row(`Cardiovascular Activities (${macroExerciseHoursLabel(intake.cardioHours)})`, f.QE, f.C5, f.FL, f.T5),
    row(`Fat Burning Activities (${macroExerciseHoursLabel(intake.fatBurningHours)})`, f.QF, f.C6, f.FM, f.T6),
  ];
}

function buildGoalTable(today, projection) {
  if (!today || !projection) return null;
  return {
    rows: [
      {
        label: 'LEAN',
        todayPct: `${today.leanPct}%`,
        todayLbs: `${today.leanLbs} lbs.`,
        goalA: '',
        goalB: `${projection.endLeanPct.toFixed(2)}%`,
        goalC: `${projection.leanLbs.toFixed(1)} lbs.`,
      },
      {
        label: 'FAT',
        todayPct: `${today.fatPct}%`,
        todayLbs: `${today.fatLbs} lbs.`,
        goalA: `-${projection.fatLostLbs.toFixed(1)} lbs. of fat`,
        goalB: `${projection.endBf.toFixed(2)}%`,
        goalC: `${projection.endFatLbs.toFixed(1)} lbs.`,
      },
      {
        label: 'TOTAL',
        todayPct: `${today.totalPct}%`,
        todayLbs: `${today.totalLbs} lbs.`,
        goalA: '',
        goalB: '100.00%',
        goalC: `${projection.endWeight.toFixed(1)} lbs.`,
      },
    ],
  };
}

export function buildSampleDietPrintoutPayload(pkg, options = {}) {
  const intake = pkg?.intake || {};
  const gender = String(intake.sex || '').toLowerCase().startsWith('f') ? 'female' : 'male';
  const today = computeTodayBodyComposition(intake);
  const projection = eightWeekProjectionFromPackage(pkg);
  const hours = exerciseHoursSummary(intake);
  const lbmCopy = lbmStatusCopy1982({
    gender,
    heightInches: intake.heightInches,
    leanBodyMass: intake.leanBodyMass,
  });
  const formula = pkg?.plan?.formula || {};

  const fatLost = projection ? projection.fatLostLbs.toFixed(1) : '—';
  const exerciseParagraph = projection
    ? `In eight weeks, you could lose ${fatLost} pounds of fat. On your information sheet, you indicated you plan to exercise a total of ${hours.total} hour(s) per week. ${hours.wt} hour(s) of ${INTAKE_WEIGHTS_RACQUET_SPORTS}, ${hours.cardio} hour(s) of cardiovascular activities, ${hours.fatBurn} hour(s) of fat-burning activities`
    : '';

  const weeklyLine = projection
    ? `Your plan projects an average fat loss of ${projection.weeklyFatLossLbs.toFixed(1)} pounds per week. ${SAMPLE_DIET_FOOD_PLAN.projectionSuffix}`
    : '';

  const activeBfCategory = aceActiveBodyFatCategory(gender, intake.fatPercent);

  return {
    view: 'samplediet',
    title: `B&B Sample Diet - ${programClientName(pkg)}`,
    clientName: programClientNameUpper(pkg),
    preparedAt: programPreparedDate(pkg),
    preparedDate: programPreparedDate(pkg),
    preparedDateLong: formatProgramDateLong(programPreparedDate(pkg)),
    header: { ...SAMPLE_DIET_HEADER },
    welcome: { ...SAMPLE_DIET_WELCOME },
    leanBodyAnalysis: {
      sections: { ...SAMPLE_DIET_LBA_SECTIONS },
      todayRows: lbaTodayTableRows(today),
      bodyFatPercent: formatLbaBodyFatPercent(today?.fatPct ?? intake.fatPercent),
      activeBfCategoryKey: activeBfCategory.key,
      activeBfCategoryLabel: activeBfCategory.label,
      bfRangeCategories: aceBodyFatCategories(gender),
      bfRangeWeightRanges: aceBodyFatWeightRanges(gender, intake.leanBodyMass),
      weightRangesHeading: sampleDietLbaWeightRangesHeading(today?.leanLbs ?? intake.leanBodyMass),
      aceLead: SAMPLE_DIET_LBA.aceLead,
      lbmLead: lbmCopy.lead,
      lbmCallout: buildLbmCallout({
        gender,
        heightInches: intake.heightInches,
        leanBodyMass: intake.leanBodyMass,
        today,
      }),
      lbmWhy: {
        heading: SAMPLE_DIET_LBA.lbmWhyHeading,
        lead: SAMPLE_DIET_LBA.lbmWhyLead,
        punchline: SAMPLE_DIET_LBA.lbmWhyPunchline,
        closing: SAMPLE_DIET_LBA.lbmWhyClosing,
      },
      recheckProgress: {
        heading: SAMPLE_DIET_LBA.lbaRecheckHeading,
        body: SAMPLE_DIET_LBA.lbaRecheckBody,
      },
    },
    foodPlan: {
      lead: SAMPLE_DIET_FOOD_PLAN.lead,
      exerciseParagraph,
      weeklyLine,
      macroIntro: SAMPLE_DIET_FOOD_PLAN.macroIntro,
      goalTable: buildGoalTable(today, projection),
      macroRows: buildMacroTableRows(formula, intake.workPhysical, intake),
    },
    servings: {
      tagline: SAMPLE_DIET_SERVINGS_TAGLINE,
      note: SAMPLE_DIET_SERVINGS_NOTE,
      gridRows: servingsGridRows(pkg),
      planServings: pkg?.plan?.servings ? { ...pkg.plan.servings } : null,
      gettingStarted: {
        heading: SAMPLE_DIET_GETTING_STARTED_HEADING,
        rules: [...SAMPLE_DIET_GETTING_STARTED_RULES],
      },
      helpfulTips: {
        heading: SAMPLE_DIET_HELPFUL_TIPS_HEADING,
        items: [SAMPLE_DIET_HELPFUL_TIPS_SALT, SAMPLE_DIET_HELPFUL_TIPS_BEVERAGES],
      },
    },
    foodList: {
      intro: SAMPLE_DIET_FOOD_LIST_INTRO,
    },
    sampleDayMenu: buildSampleDayMenu(pkg, { filled: true }),
    faq: {
      items: HANDBOOK_FAQ_ITEMS,
    },
    answersConfirmation: {
      intro: ANSWERS_CONFIRMATION_INTRO,
      rows: buildAnswersConfirmationRows(pkg),
    },
  };
}

export function buildSampleDietPreviewPayload() {
  const pkg = buildSampleDietPreviewPackage();
  return buildSampleDietPrintoutPayload(pkg);
}
