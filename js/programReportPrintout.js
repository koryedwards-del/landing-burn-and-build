/** Five-page seminar program report — shared payload for web + PDF. */

import { computeTodayBodyComposition } from './bodyCompositionAnalysis.js';
import {
  aceCategories,
  aceHeaderLabels,
  aceRiskMessage,
  formatMm,
  formatSexLabel,
  lbmStatusMessage,
  weightGoalRanges,
} from './lbaPrintout.js';
import { formatProgramDateLong, programClientName } from './programBridgeUi.js';
import {
  eightWeekProjectionFromPackage,
  exerciseHoursSummary,
  formatCalories,
  macroTableRows,
  workdayActivityLabel,
} from './foodPlanPrintout.js';
import { extraFatLines, servingsGridRows } from './servingsPrintout.js';
import { localDateKey } from './programPackage.js';
import { KRISTI_WARNER_SEMINAR_HISTORY } from '../data/kristiWarnerSeminarHistory.js';

export const SEMINAR_REPORT_HEADER = Object.freeze({
  phone: '253-988-6946',
  website: 'www.eattolosefat.com',
  email: 'kory.edwards@coachkory.com',
});

export const STEPS_TO_SUCCESS_COPY = Object.freeze({
  intro: [
    'This program is customized from your body composition, activity level, and goals. Follow your daily servings — not calories — for the next eight weeks.',
  ],
  startHereLabel: 'START HERE',
  steps: [
    { text: 'Read this guide once.' },
    { text: 'Print pages 4–5.' },
    { text: 'Put them somewhere you\'ll see every day.' },
    { text: 'Build meals using the food list.' },
    { text: 'Stay consistent for 8 weeks.' },
  ],
  motto: 'Consistency beats perfection.',
});

/** Kept in payload until production API deploys — old Render build requires welcome. */
export const LEGACY_WELCOME_COPY = Object.freeze({
  intro: [''],
  leanBodyAnalysis: '',
  history: '',
  foodPlan: '',
  servings: '',
});

/** Static Kristi sample — committed under docs/samples for direct download. */
export const PREVIEW_PROGRAM_REPORT_PDF = '../docs/samples/kristi-program-report-preview.pdf';

export const LBA_FOOTER_COPY = 'How much fat is right for each individual is a personal choice. How you look in the mirror is the only true judge of whether you have fat to lose. If you see more fat than you personally want, then exercise and follow your this plan until you reach your desired goals.';

export const LBA_MONITOR_COPY = 'Continue to monitor your body composition using Lean Body Analysis every 6 to 8 weeks to make sure you are losing only fat and not lean! If you want to lose fat, do so by following this diet as closely as you can. This plan allows you to lose all the fat you want to lose while increasing your strength & energy.';

export const FOOD_PLAN_MACRO_INTRO = 'How much food you need each day depends on how much LBM you have. Also, it depends on your activity level and the type and amount of exercise you participate in. Based on the information you provided, the following table gives you the number of calories and the amount of protein, carbohydrates and fat you need per day to maintain your fat or to reduce body fat. Also listed is what your body requires at rest (your resting metabolic rate), for your workday and for one hour of each type of exercise.';

export const SERVINGS_NOTE = 'NOTE: Always consult your physician before starting this plan or making any change in your eating habits.';

export function seminarPreparedDate(pkg) {
  return localDateKey(
    pkg?.program?.foodPlanCreatedDate
    || pkg?.program?.issuedAtLocalDate
    || pkg?.program?.issuedAt
    || pkg?.program?.startDate,
  ) || '';
}

export function seminarClientName(pkg) {
  return String(programClientName(pkg) || 'You').trim().toUpperCase();
}

export function formatHistoryTestDate(isoDate) {
  const key = localDateKey(isoDate);
  if (!key) return '—';
  return key;
}

export function formatHistoryActivity(intake) {
  if (!intake) return '—';
  const wt = Number(intake.weightTrainingHours) || 0;
  const cardio = Number(intake.cardioHours) || 0;
  const fat = Number(intake.fatBurningHours) || 0;
  const intensity = Number(intake.workIntensity);
  const intensityText = Number.isFinite(intensity)
    ? (Number.isInteger(intensity) ? String(intensity) : intensity.toFixed(1))
    : '';
  return `${wt}/${cardio}/${fat}/${intensityText}a`;
}

function historyRowFromProgram(pkg, testDate) {
  const intake = pkg?.intake || {};
  const weight = Number(intake.totalWeight) || 0;
  const lbm = Number(intake.leanBodyMass) || 0;
  const fatPct = Number(intake.fatPercent) || 0;
  const fatLbs = weight > 0 && lbm >= 0 ? weight - lbm : 0;
  return {
    testDate: testDate || seminarPreparedDate(pkg),
    thighMm: intake.thighMm ?? null,
    waistMm: intake.waistMm ?? null,
    weightLbs: weight,
    leanLbs: lbm,
    fatLbs,
    fatPercent: fatPct,
    activity: formatHistoryActivity(intake),
  };
}

export function buildCompositionHistoryRows(pkg, { programRows = [], sampleHistory = null } = {}) {
  if (Array.isArray(sampleHistory) && sampleHistory.length) {
    return sampleHistory.map((row) => ({ ...row }));
  }

  const rows = (programRows || [])
    .filter((row) => row?.package && row.id !== pkg?.program?.id)
    .map((row) => historyRowFromProgram(row.package, localDateKey(row.createdAt)));

  rows.push(historyRowFromProgram(pkg, seminarPreparedDate(pkg)));

  return rows.sort((a, b) => {
    const ta = new Date(`${localDateKey(a.testDate) || '1970-01-01'}T12:00:00`).getTime();
    const tb = new Date(`${localDateKey(b.testDate) || '1970-01-01'}T12:00:00`).getTime();
    return tb - ta;
  });
}

function resolveSampleHistory(pkg) {
  if (pkg?.meta?.source === 'program-report-preview') {
    return KRISTI_WARNER_SEMINAR_HISTORY;
  }
  return null;
}

export function buildProgramReportPayload(pkg, options = {}) {
  const intake = pkg?.intake || {};
  const gender = String(intake.sex || '').toLowerCase().startsWith('f') ? 'female' : 'male';
  const today = computeTodayBodyComposition(intake);
  const projection = eightWeekProjectionFromPackage(pkg);
  const hours = exerciseHoursSummary(intake);
  const lbmCopy = lbmStatusMessage({
    gender,
    heightInches: intake.heightInches,
    leanBodyMass: intake.leanBodyMass,
  });

  const sampleHistory = options.sampleHistory ?? resolveSampleHistory(pkg);
  const historyRows = buildCompositionHistoryRows(pkg, {
    programRows: options.programRows,
    sampleHistory,
  });

  const macroRows = macroTableRows(pkg?.plan?.formula, intake.workIntensity).filter((row) => !row.spacer);

  return {
    view: 'programreport',
    title: programReportDocumentTitle(pkg),
    clientName: seminarClientName(pkg),
    preparedAt: seminarPreparedDate(pkg),
    preparedDate: seminarPreparedDate(pkg),
    preparedDateLong: formatProgramDateLong(
      pkg?.program?.issuedAt || pkg?.program?.foodPlanCreatedDate,
    ),
    header: { ...SEMINAR_REPORT_HEADER },
    stepsToSuccess: { ...STEPS_TO_SUCCESS_COPY },
    welcome: { ...LEGACY_WELCOME_COPY },
    leanBodyAnalysis: {
      heightInches: intake.heightInches,
      sex: formatSexLabel(intake.sex),
      thigh: formatMm(intake.thighMm),
      waist: formatMm(intake.waistMm),
      age: intake.age,
      today,
      aceHeaders: aceHeaderLabels(gender),
      aceCategories: aceCategories(gender),
      riskMessage: aceRiskMessage(gender, intake.fatPercent),
      footerCopy: LBA_FOOTER_COPY,
      monitorCopy: LBA_MONITOR_COPY,
      lbmLead: lbmCopy.lead,
      lbmCongrats: lbmCopy.congrats,
      weightGoalRanges: weightGoalRanges(gender, intake.leanBodyMass),
    },
    history: {
      rows: historyRows.map((row) => ({
        testDate: formatHistoryTestDate(row.testDate),
        thigh: formatMm(row.thighMm),
        waist: formatMm(row.waistMm),
        weight: `${Math.round(Number(row.weightLbs) || 0)} lbs.`,
        lean: `${Number(row.leanLbs).toFixed(1)} lbs.`,
        fat: `${Number(row.fatLbs).toFixed(1)} lbs.`,
        percent: `${Number(row.fatPercent).toFixed(2)}%`,
        activity: row.activity || '—',
      })),
    },
    foodPlan: {
      introHours: hours,
      fatLostLbs: projection ? projection.fatLostLbs.toFixed(1) : '—',
      weeklyFatLossLbs: projection ? projection.weeklyFatLossLbs.toFixed(1) : '—',
      today,
      goal: projection ? {
        leanPct: `${projection.endLeanPct.toFixed(2)}%`,
        leanLbs: `${projection.leanLbs.toFixed(1)} lbs.`,
        fatPct: `${projection.endBf.toFixed(2)}%`,
        fatLbs: `${projection.endFatLbs.toFixed(1)} lbs.`,
        totalPct: '100.00%',
        totalLbs: `${projection.endWeight.toFixed(1)} lbs.`,
      } : null,
      macroIntro: FOOD_PLAN_MACRO_INTRO,
      macroRows: macroRows.map((row) => ({
        label: row.label,
        proteinG: row.proteinG,
        proteinCal: formatCalories(row.proteinCal),
        carbsG: row.carbsG,
        carbsCal: formatCalories(row.carbsCal),
        fatsG: row.fatsG,
        fatsCal: formatCalories(row.fatsCal),
        totalCal: formatCalories(row.totalCal),
      })),
      workdayLabel: workdayActivityLabel(intake.workIntensity),
    },
    servings: {
      note: SERVINGS_NOTE,
      gridRows: servingsGridRows(pkg),
      extraFats: extraFatLines(pkg),
    },
  };
}

export function programReportDocumentTitle(pkg) {
  return `Program Report - ${programClientName(pkg)}`;
}
