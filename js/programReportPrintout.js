/** Five-page seminar program report — shared payload for web + PDF. */

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
} from './lbaPrintout.js';
import { formatProgramDateLong, programClientName, escapeHtml } from './programBridgeUi.js';
import {
  eightWeekProjectionFromPackage,
  exerciseHoursSummary,
  buildProjectionsPrintoutSection,
  projectionTimelineFromPackage,
  MACRO_SIGNAL_INTRO,
  MACRO_SIGNAL_ROWS,
  workdayActivityLabel,
} from './foodPlanPrintout.js';
import { extraFatLines, servingsGridRows } from './servingsPrintout.js';
import { localDateKey } from './programPackage.js';
import { WORK_PHYSICAL, WORK_STRESS } from './onboardingEngine.js';
import { KRISTI_WARNER_SEMINAR_HISTORY } from '../data/kristiWarnerSeminarHistory.js';
import { buildProgramReportNarratives } from './programReportNarrativePrintout.js';

export const SEMINAR_REPORT_HEADER = Object.freeze({
  phone: '253-988-6946',
  website: 'www.burnandbuilddiet.com',
  email: 'support@burnandbuilddiet.com',
});

export const START_HERE_STEPS = Object.freeze([
  'Read this guide once.',
  'Print pages 5–6.',
  'Put them somewhere you\'ll see every day.',
  'Build meals using the food list.',
  'Stay consistent for 8 weeks.',
]);

export const GETTING_STARTED_COPY = Object.freeze({
  intro: [
    'This program was created specifically for you.',
    'Your daily food targets are based on the information you provided, including body composition, activity level, work demands, and exercise.',
    'Follow the servings—not calories—to simplify your day and stay consistent.',
  ],
  startHereLabel: 'START HERE',
  startHere: START_HERE_STEPS,
});

export const STEPS_TO_SUCCESS_COPY = Object.freeze({
  intro: [
    'Congratulations — you have the most individualized fat-loss program available, built from your lean body mass, workday, lifestyle, and exercise plan. These steps show you how to use it for maximum results.',
  ],
  steps: [
    {
      title: 'Know your numbers',
      body: 'Review your Lean Body Analysis. Your LBM drives your metabolic rate and your daily food prescription. The mirror — not the scale alone — tells you whether you have fat to lose.',
    },
    {
      title: 'Eat your servings',
      body: 'Follow the daily serving totals on your Servings page. No calorie or macro counting — the computer already did that work. Stay within the approved food groups.',
    },
    {
      title: 'Plan your week',
      body: 'Use the menu planner online to assign foods to each meal, track servings, and build your grocery list. Print your week at a glance from Print Shop before you shop.',
    },
    {
      title: 'Eat on schedule',
      body: 'Spread protein through breakfast, lunch, and dinner. Eat vegetables at dinner and fruit at snack times. Regular feedings keep energy steady and protect lean mass.',
    },
    {
      title: 'Stay consistent',
      body: 'Keep your exercise and activity aligned with what you reported when this plan was built. Changing workouts without updating your program can slow fat loss.',
    },
    {
      title: 'Check in regularly',
      body: 'Re-test body composition every 6 to 8 weeks. You want to confirm you are losing fat — not lean. Adjust only after you know what the numbers say.',
    },
  ],
  footer: 'For detailed guidance, open Print Shop from the menu planner — For Best Results, the food list, and Frequently Asked Questions.',
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
export const PREVIEW_PROGRAM_REPORT_PDF = '../docs/samples/kristi-program-report-preview.pdf?v=6';

/** KWarner 1982 locked-frame preview — separate file, not production sample. */
export { KWARNER_LOCKED_PREVIEW_PDF, kwarnerPreviewPdfUrl, KWARNER_PREVIEW_BUILD, KWARNER_PREVIEW_MD5 } from './kwarnerPreviewBuild.js';

export function welcomeCoverHtml(pkg) {
  const copy = STEPS_TO_SUCCESS_COPY;
  const name = String(programClientName(pkg) || 'You').trim();
  const date = formatProgramDateLong(
    pkg?.program?.issuedAt || pkg?.program?.foodPlanCreatedDate,
  );
  const stepsHtml = copy.steps.map((step, index) => {
    const startHere = Array.isArray(step.startHere) && step.startHere.length
      ? `
        <div class="r-steps-start">
          <p class="r-steps-start__label">${escapeHtml(step.startHereLabel || 'Start here')}</p>
          <ol class="r-steps-start__list">
            ${step.startHere.map((line, i) => `
              <li><span class="r-steps-start__num">${i + 1}.</span> ${escapeHtml(line)}</li>
            `).join('')}
          </ol>
        </div>
      `
      : '';
    return `
      <li class="r-steps-success__item">
        <span class="r-steps-success__num">${index + 1}</span>
        <div class="r-steps-success__body">
          <h3 class="r-steps-success__title">${escapeHtml(step.title || step.text || '')}</h3>
          ${step.body ? `<p>${escapeHtml(step.body)}</p>` : ''}
          ${startHere}
        </div>
      </li>
    `;
  }).join('');

  return `
    <article class="r-steps-success">
      <header class="r-steps-success__head">
        <img class="r-steps-success__logo" src="../img/brand/bblogo1.png" alt="" width="48" height="48" />
        <div>
          <p class="r-steps-success__brand">Burn &amp; Build Diet</p>
          <p class="r-steps-success__meta">Prepared exclusively for ${escapeHtml(name)} · ${escapeHtml(date)}</p>
        </div>
      </header>
      <h2 class="r-steps-success__heading">Steps to Success</h2>
      ${copy.intro.map((paragraph) => `<p class="r-steps-success__intro">${escapeHtml(paragraph)}</p>`).join('')}
      <ol class="r-steps-success__list">${stepsHtml}</ol>
      <p class="r-steps-success__motto">${escapeHtml(copy.motto)}</p>
      ${copy.footer ? `<p class="r-steps-success__footer">${escapeHtml(copy.footer)}</p>` : ''}
    </article>
  `;
}

export const LBA_FOOTER_COPY = BODY_FAT_PROGRESS_BAR_FOOTER;

export const LBA_MONITOR_COPY = 'Continue to monitor your body composition using Lean Body Analysis every 6 to 8 weeks to make sure you are losing only fat and not lean! If you want to lose fat, do so by following this diet as closely as you can. This plan allows you to lose all the fat you want to lose while increasing your strength & energy.';

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
  const fatBarFooterParts = leannessFatBarFooterParts(lbmCopy.lead, lbmCopy.congrats);
  const fatBar = leannessFatBar(gender, intake.fatPercent, intake.leanBodyMass);
  const timelineMarkers = fatBarTimelineMarkers(projectionTimelineFromPackage(pkg));
  if (timelineMarkers.length) fatBar.timelineMarkers = timelineMarkers;

  const sampleHistory = options.sampleHistory ?? resolveSampleHistory(pkg);
  const historyRows = buildCompositionHistoryRows(pkg, {
    programRows: options.programRows,
    sampleHistory,
  });

  const narratives = buildProgramReportNarratives(pkg, {
    today,
    gender,
    projection,
    hours,
    historyRows,
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
    gettingStarted: narratives.welcome,
    bodyTodayNarrative: narratives.bodyToday,
    progressNarrative: narratives.progress,
    foodPlanNarrative: narratives.foodPlan,
    servingsNarrative: narratives.servings,
    stepsToSuccess: { ...STEPS_TO_SUCCESS_COPY },
    welcome: { ...LEGACY_WELCOME_COPY },
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
  };
}

export function programReportDocumentTitle(pkg) {
  return `Program Report - ${programClientName(pkg)}`;
}
