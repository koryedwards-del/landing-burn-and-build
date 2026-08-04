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

export const WELCOME_COPY = Object.freeze({
  intro: [
    'Congratulations! You have in your hands the most advanced diet available anywhere, at any price. It is the most individualized program available for losing fat. This diet will not work effectively for anyone else because it has been created just for you, using your LBM, your job, your lifestyle and your daily plan for exercise & activities.',
    'How we did it. We determined your lean weight using sophisticated body composition testing. Then you told us about your job, lifestyle, exercise and activities. With this information, the computer generated this five-page report. Included is your ultrasound body composition report that I call your Lean Body Analysis, your body composition history and the last two pages are your custom designed diet.',
  ],
  leanBodyAnalysis: 'Page two is the results of your body composition test. Although very few people want to know how fat they are, all of them want to how to lose fat. Our Lean Body Analysis page includes a breakdown of your current body composition with an emphasis on the good stuff. LBM (lean body mass) is used by the computer to calculate your metabolic rate (RMR). In addition, the Lean Body Analysis projects appropriate weight goals based on your current lean body mass.',
  history: 'Page three is a record of your body composition history with me. Having a history of body compositions can give you valuable information about how your eating habits are affecting your weight loss. That\'s why I recommend having your body composition checked every 6-8 weeks. I call it a check-in.',
  foodPlan: 'Page four is your custom-designed diet. How much food you need each day depends on how much LBM you have, your job, lifestyle and the type and amount of exercise you participate in. Based on the information you provide, this diet gives you the amount of protein, carbohydrates and fat you need per day to lose fat. It also tells you how much fat you can lose in eight weeks. And it shows you what your body requires at rest (your resting metabolic rate), for your workday and for one hour of each type of exercise.',
  servings: 'Page five is the servings page. No need to count calories or macros in this diet. The computer breaks down all the information from the table on page four and shows you the number of servings you need daily to have maximum strength & energy and to lose fat as fast as possible.',
});

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
    welcome: { ...WELCOME_COPY },
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
