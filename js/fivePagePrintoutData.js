/** B&B 5-page printout payload — 1982 Warner layout + burn-engine data. */

import { computeTodayBodyComposition } from './bodyCompositionData.js';
import { analyzeLeanBodyMass } from './bodyCompositionData.js';
import { eightWeekProjectionFromPackage, exerciseHoursSummary } from './foodPlanPrintout.js';
import { extraFatLines, servingsGridRows } from './servingsPrintout.js';
import { formatMm, formatSexLabel, lbaTodayTableRows } from './leanBodyAnalysisPrintout.js';
import { formatProgramDateLong, programClientName } from './programClientDataHelpers.js';
import { localDateKey } from './programPackageData.js';
import { KRISTI_PREVIEW_SEMINAR_HISTORY } from '../data/kristiPreviewSeminarHistory.js';
import {
  aceBodyFatCategories,
  aceBodyFatWeightRanges,
  aceRiskMessage,
} from './fivePageAceData.js';
import {
  FIVE_PAGE_FOOD_PLAN,
  FIVE_PAGE_HEADER,
  FIVE_PAGE_LBA,
  FIVE_PAGE_SERVINGS_NOTE,
  FIVE_PAGE_WELCOME,
} from './fivePagePrintoutCopyData.js';
import { buildKristiPreviewPackage } from './programReportPreviewFixtures.js';

const rnd = (x) => Math.round(Number(x));

function formatCalories(n) {
  return rnd(n).toLocaleString('en-US');
}

function seminarPreparedDate(pkg) {
  return localDateKey(
    pkg?.program?.foodPlanCreatedDate
    || pkg?.program?.issuedAtLocalDate
    || pkg?.program?.issuedAt
    || pkg?.program?.startDate,
  ) || '';
}

function seminarClientName(pkg) {
  return String(programClientName(pkg) || 'You').trim().toUpperCase();
}

function formatHistoryTestDate(isoDate) {
  const key = localDateKey(isoDate);
  if (!key) return '—';
  const [year, month, day] = key.split('-');
  if (year >= '2020') return key;
  return `${month}/${day}/${year.slice(2)}`;
}

function formatHistoryActivity(intake) {
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

function buildCompositionHistoryRows(pkg, { sampleHistory = null } = {}) {
  if (Array.isArray(sampleHistory) && sampleHistory.length) {
    return sampleHistory.map((row) => ({ ...row }));
  }
  return [historyRowFromProgram(pkg, seminarPreparedDate(pkg))];
}

function resolveSampleHistory(pkg) {
  if (pkg?.meta?.source === 'program-report-preview' || pkg?.meta?.source === 'five-page-preview') {
    return KRISTI_PREVIEW_SEMINAR_HISTORY;
  }
  return null;
}

function lbaProfileLine1982(intake) {
  const height = intake.heightInches;
  const sex = formatSexLabel(intake.sex);
  const thigh = formatMm(intake.thighMm);
  const waist = formatMm(intake.waistMm);
  const age = intake.age;
  return `Height: ${height} inches  Sex: ${sex}  Thigh: ${thigh}  Waist: ${waist}  Age: ${age} years of experience`;
}

function lbmStatusCopy1982({ gender, heightInches, leanBodyMass }) {
  const analysis = analyzeLeanBodyMass({ gender, heightInches, leanBodyMass });
  const genderWord = gender === 'female' ? 'female' : 'male';
  if (!analysis.desirableLbm) {
    return { lead: '', congrats: '', alert: '' };
  }
  const lead = `A ${genderWord} your height in good condition has ${Math.round(analysis.desirableLbm)} pounds or more of lean body weight.`;
  if (analysis.atOrAbove) {
    return {
      lead,
      congrats: `CONGRATULATIONS! Your LBM is at or above the desirable amount. ${FIVE_PAGE_LBA.congratsSuffix}`,
      alert: '',
    };
  }
  return {
    lead,
    congrats: '',
    alert: `ALERT! Your LBM is below the desirable amount for your height. ${FIVE_PAGE_LBA.alertSuffix}`,
  };
}

function buildMacroTableRows(formula, workIntensity) {
  const f = formula || {};
  const intensityLabel = Number.isFinite(Number(workIntensity))
    ? (Number.isInteger(Number(workIntensity)) ? String(workIntensity) : Number(workIntensity).toFixed(1))
    : '1.5';
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
    row(`Workday (${intensityLabel}a)`, f.QC, f.C3, f.FJ, f.T3),
    row('Weight Training', f.QD, f.C4, f.FK, f.T4),
    row('Cardiovascular Activities', f.QE, f.C5, f.FL, f.T5),
    row('Fat Burning Activities', f.QF, f.C6, f.FM, f.T6),
  ];
}

function buildGoalTable(today, projection) {
  if (!today || !projection) return null;
  return {
    headers: ['TODAY', 'EIGHT WEEK GOAL'],
    rows: [
      {
        label: 'LEAN',
        todayPct: `${today.leanPct}%`,
        todayLbs: `${today.leanLbs} lbs.`,
        goalA: `${projection.endLeanPct.toFixed(2)}%`,
        goalB: '',
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
        goalA: '100.00%',
        goalB: '',
        goalC: `${projection.endWeight.toFixed(1)} lbs.`,
      },
    ],
  };
}

export function buildFivePagePrintoutPayload(pkg, options = {}) {
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
  const sampleHistory = options.sampleHistory ?? resolveSampleHistory(pkg);
  const historyRows = buildCompositionHistoryRows(pkg, { sampleHistory });
  const formula = pkg?.plan?.formula || {};

  const fatLost = projection ? projection.fatLostLbs.toFixed(1) : '—';
  const exerciseParagraph = projection
    ? `In eight weeks, you could safely lose ${fatLost} pounds of fat. On your information sheet, you indicated you plan to exercise a total of ${hours.total} hour(s) per week. ${hours.wt} hour(s) of weight training, ${hours.cardio} hour(s) of cardiovascular activities, ${hours.fatBurn} hour(s) of fat-burning activities`
    : '';

  const weeklyLine = projection
    ? `You project to lose an average of ${projection.weeklyFatLossLbs.toFixed(1)} pounds of fat per week. ${FIVE_PAGE_FOOD_PLAN.projectionSuffix}`
    : '';

  return {
    view: 'fivepage',
    title: `B&B 5-Page Printout - ${programClientName(pkg)}`,
    clientName: seminarClientName(pkg),
    preparedAt: seminarPreparedDate(pkg),
    preparedDate: seminarPreparedDate(pkg),
    preparedDateLong: formatProgramDateLong(
      pkg?.program?.issuedAt || pkg?.program?.foodPlanCreatedDate,
    ),
    header: { ...FIVE_PAGE_HEADER },
    welcome: { ...FIVE_PAGE_WELCOME },
    leanBodyAnalysis: {
      profileLine: lbaProfileLine1982(intake),
      todayRows: lbaTodayTableRows(today),
      bfRangeCategories: aceBodyFatCategories(gender),
      bfRangeWeightRanges: aceBodyFatWeightRanges(gender, intake.leanBodyMass),
      aceRiskMessage: aceRiskMessage(gender, intake.fatPercent),
      aceLead: FIVE_PAGE_LBA.aceLead,
      lbmLead: lbmCopy.lead,
      lbmStatus: lbmCopy.congrats || lbmCopy.alert,
      monitorCopy: FIVE_PAGE_LBA.monitor,
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
      lead: FIVE_PAGE_FOOD_PLAN.lead,
      exerciseParagraph,
      weeklyLine,
      macroIntro: FIVE_PAGE_FOOD_PLAN.macroIntro,
      goalTable: buildGoalTable(today, projection),
      macroRows: buildMacroTableRows(formula, intake.workIntensity),
    },
    servings: {
      note: FIVE_PAGE_SERVINGS_NOTE,
      gridRows: servingsGridRows(pkg),
      extraFats: extraFatLines(pkg),
    },
  };
}

export function buildKristiFivePagePreviewPayload() {
  const pkg = buildKristiPreviewPackage();
  pkg.meta = { ...pkg.meta, source: 'five-page-preview' };
  return buildFivePagePrintoutPayload(pkg);
}
