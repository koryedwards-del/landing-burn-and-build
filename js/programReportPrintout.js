/** Burn & Build Diet program report — shared payload for PDF generation. */

import { computeTodayBodyComposition } from './bodyCompositionAnalysis.js';
import {
  lbaBodyFatRangeCategories,
  lbaBodyFatRangeLeadMessage,
  lbaBodyFatRangeWeightRanges,
  BODY_FAT_PROGRESS_BAR_FOOTER,
  BODY_FAT_PROGRESS_BAR_SUBTITLE,
  BODY_FAT_PROGRESS_BAR_TITLE,
  formatMm,
  formatSexLabel,
  fatBarTimelineMarkers,
  leannessFatBar,
  leannessFatBarFooterParts,
  lbaProfileLine,
  lbaProfileStats,
  lbaTodayTableRows,
  lbmCopyAfterFirstSentence,
  lbmStatusMessage,
} from './leanBodyAnalysisPrintout.js';
import { formatProgramDateLong, programClientName } from './programClientHelpers.js';
import {
  eightWeekProjectionFromPackage,
  exerciseHoursSummary,
  buildProjectionsPrintoutSection,
  projectionTimelineFromPackage,
  MACRO_SIGNAL_INTRO,
  MACRO_SIGNAL_ROWS,
} from './foodPlanPrintout.js';
import { extraFatLines, servingsGridRows } from './servingsPrintout.js';
import { localDateKey } from './programPackage.js';
import { WORK_PHYSICAL, WORK_STRESS } from './profileEngine.js';
import { KRISTI_PREVIEW_SEMINAR_HISTORY } from '../data/kristiPreviewSeminarHistory.js';
import { BURN_AND_BUILD_DIET_PDF_NAME } from './dietPdfNaming.js';
import {
  ANSWERS_CONFIRMATION_INTRO,
  buildAnswersConfirmationRows,
} from './answersConfirmationPrintout.js';

export { BURN_AND_BUILD_DIET_PDF_NAME };

const SEMINAR_REPORT_HEADER = Object.freeze({
  phone: '253-988-6946',
  website: 'www.burnandbuilddiet.com',
  email: 'support@burnandbuilddiet.com',
});

const LBA_FOOTER_COPY = BODY_FAT_PROGRESS_BAR_FOOTER;

const LBA_MONITOR_COPY = 'Continue to monitor your body composition using Lean Body Analysis every 6 to 8 weeks to make sure you are losing only fat and not lean! If you want to lose fat, do so by following this diet as closely as you can. This plan allows you to lose all the fat you want to lose while increasing your strength & energy.';

const SERVINGS_NOTE = 'NOTE: Always consult your physician before starting this plan or making any change in your eating habits.';

export function seminarPreparedDate(pkg) {
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
  return key;
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

function buildCompositionHistoryRows(pkg, { programRows = [], sampleHistory = null } = {}) {
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
    return KRISTI_PREVIEW_SEMINAR_HISTORY;
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
  const fatBarFooterParts = leannessFatBarFooterParts(lbmCopy.lead, lbmCopy.congrats);
  const fatBar = leannessFatBar(gender, intake.fatPercent, intake.leanBodyMass);
  const timelineMarkers = fatBarTimelineMarkers(projectionTimelineFromPackage(pkg));
  if (timelineMarkers.length) fatBar.timelineMarkers = timelineMarkers;

  const sampleHistory = options.sampleHistory ?? resolveSampleHistory(pkg);
  const historyRows = buildCompositionHistoryRows(pkg, {
    programRows: options.programRows,
    sampleHistory,
  });

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
    leanBodyAnalysis: {
      heightInches: intake.heightInches,
      sex: formatSexLabel(intake.sex),
      age: intake.age,
      profileLine: lbaProfileLine({
        heightInches: intake.heightInches,
        sex: formatSexLabel(intake.sex),
        age: intake.age,
        fatSource: intake.fatSource,
        fatSourceOther: intake.fatSourceOther,
      }),
      profileStats: lbaProfileStats({
        heightInches: intake.heightInches,
        sex: formatSexLabel(intake.sex),
        age: intake.age,
        fatSource: intake.fatSource,
        fatSourceOther: intake.fatSourceOther,
      }),
      today,
      todayRows: lbaTodayTableRows(today),
      bfRangeCategories: lbaBodyFatRangeCategories(gender),
      bfRangeWeightRanges: lbaBodyFatRangeWeightRanges(gender, intake.leanBodyMass),
      bfRangeLead: lbaBodyFatRangeLeadMessage(),
      lbmParagraphs: [lbmCopy.lead, lbmCopy.congrats].filter(Boolean),
      leannessFatBar: fatBar,
      leannessFatBarFooter: fatBarFooterParts.full,
      riskMessage: '',
      footerCopy: LBA_FOOTER_COPY,
      monitorCopy: LBA_MONITOR_COPY,
      lbmLead: lbmCopy.lead,
      lbmCongrats: lbmCopyAfterFirstSentence(lbmCopy.congrats),
    },
    projections: buildProjectionsPrintoutSection(pkg),
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
      lbmLbs: Number(intake.leanBodyMass).toFixed(1),
      inputGrid: {
        lbm: Number(intake.leanBodyMass).toFixed(1),
        wt: hours.wt,
        hht: hours.cardio,
        lhr: hours.fatBurn,
      },
      workPhysical: intake.workPhysical || null,
      workStress: intake.workStress || null,
      jobLabel: WORK_PHYSICAL.find((item) => item.id === intake.workPhysical)?.label || '—',
      lifestyleLabel: WORK_STRESS.find((item) => item.id === intake.workStress)?.label || '—',
      today,
      goal: projection ? {
        leanPct: `${projection.endLeanPct.toFixed(2)}%`,
        leanLbs: `${projection.leanLbs.toFixed(1)} lbs.`,
        fatPct: `${projection.endBf.toFixed(2)}%`,
        fatLbs: `${projection.endFatLbs.toFixed(1)} lbs.`,
        totalPct: '100.00%',
        totalLbs: `${projection.endWeight.toFixed(1)} lbs.`,
      } : null,
      macroSignalIntro: MACRO_SIGNAL_INTRO,
      macroSignalRows: MACRO_SIGNAL_ROWS.map((row) => ({ ...row })),
    },
    servings: {
      note: SERVINGS_NOTE,
      gridRows: servingsGridRows(pkg),
      extraFats: extraFatLines(pkg),
      planServings: pkg?.plan?.servings ? { ...pkg.plan.servings } : null,
    },
    answersConfirmation: {
      intro: ANSWERS_CONFIRMATION_INTRO,
      rows: buildAnswersConfirmationRows(pkg),
    },
  };
}

function programReportDocumentTitle(pkg) {
  return `${BURN_AND_BUILD_DIET_PDF_NAME} - ${programClientName(pkg)}`;
}
