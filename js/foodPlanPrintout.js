/** Food Plan printout helpers — projections, macro signal table, legacy macro grid. */

import {
  computeDietEightWeekProjection,
  computeDietProjectionTimeline,
} from './bodyCompositionAnalysis.js';

function phpRound(x) {
  return Math.floor(Number(x) + 0.5);
}

function formatCalories(n) {
  return phpRound(n).toLocaleString('en-US');
}

function formatHours(n) {
  return Number(n).toFixed(2);
}

export function workdayActivityLabel(intensity) {
  const value = Number(intensity);
  if (!Number.isFinite(value)) return 'Workday';
  const text = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return `Workday (${text}a)`;
}

export function exerciseHoursSummary(intake) {
  const wt = formatHours(intake?.weightTrainingHours ?? 0);
  const cardio = formatHours(intake?.cardioHours ?? 0);
  const fatBurn = formatHours(intake?.fatBurningHours ?? 0);
  const total = formatHours(
    Number(intake?.weightTrainingHours ?? 0)
    + Number(intake?.cardioHours ?? 0)
    + Number(intake?.fatBurningHours ?? 0),
  );
  return { total, wt, cardio, fatBurn };
}

export function eightWeekProjectionFromPackage(pkg) {
  const intake = pkg?.intake;
  const summary = pkg?.plan?.summary;
  const formula = pkg?.plan?.formula;
  if (!intake?.leanBodyMass || !intake?.totalWeight || !intake?.fatPercent) return null;
  if (!summary?.maintainTotalCals || !summary?.reduceTotalCals) return null;

  return computeDietEightWeekProjection({
    weightLbs: intake.totalWeight,
    leanBodyMass: intake.leanBodyMass,
    bodyFatPercent: intake.fatPercent,
    maintainTotalCalories: summary.maintainTotalCals,
    reduceTotalCalories: summary.reduceTotalCals,
    gender: String(intake.sex || '').toLowerCase().startsWith('f') ? 'female' : 'male',
  });
}

export function projectionTimelineFromPackage(pkg) {
  const intake = pkg?.intake;
  const summary = pkg?.plan?.summary;
  if (!intake?.leanBodyMass || !intake?.totalWeight || !intake?.fatPercent) return null;
  if (!summary?.maintainTotalCals || !summary?.reduceTotalCals) return null;

  return computeDietProjectionTimeline({
    gender: String(intake.sex || '').toLowerCase().startsWith('f') ? 'female' : 'male',
    weightLbs: intake.totalWeight,
    leanBodyMass: intake.leanBodyMass,
    bodyFatPercent: intake.fatPercent,
    maintainTotalCalories: summary.maintainTotalCals,
    reduceTotalCalories: summary.reduceTotalCals,
  });
}

/** Projections page — burn-engine 8-week cycles (program-report page 2 / landing-style table). */
export function buildProjectionsPrintoutSection(pkg) {
  const intake = pkg?.intake;
  const summary = pkg?.plan?.summary;
  const projection = eightWeekProjectionFromPackage(pkg);
  const timeline = projectionTimelineFromPackage(pkg);
  const hours = exerciseHoursSummary(intake);

  if (!projection || !intake?.leanBodyMass || !intake?.totalWeight || !intake?.fatPercent) return null;
  if (!summary?.maintainTotalCals || !summary?.reduceTotalCals) return null;

  const intro = [
    'The following food program contains a sophisticated calculation that is based on your individual lean',
    'body mass (LBM), and on your activities. This is the most individualized food program available for',
    'losing fat and building muscle.',
    `In your questionnaire, you indicated you plan to exercise a total of ${hours.total} hour(s) per week.`,
    `${hours.wt} hour(s) of weight training, ${hours.cardio} hour(s) of cardiovascular activities,`,
    `${hours.fatBurn} hour(s) of fat-burning activities`,
  ].join(' ');

  return {
    intro,
    fatLostLbs: projection.fatLostLbs.toFixed(1),
    weeklyFatLossLbs: projection.weeklyFatLossLbs.toFixed(1),
    timelineRows: timeline?.valid
      ? timeline.rows.map((row) => ({
        timeline: row.timeline,
        bodyFat: row.badge ? `${row.bodyFatDisplay} (${row.badge})` : row.bodyFatDisplay,
        weight: row.weightDisplay,
        isCurrent: Boolean(row.isCurrent),
        badge: row.badge ?? null,
      }))
      : [],
  };
}

function macroRow(label, proteinQ, carbsQuarter, fatCalories, totalCalories) {
  const proteinG = Math.round(proteinQ);
  const carbsG = Math.round(carbsQuarter);
  const fatsG = Math.round(fatCalories / 9);
  return {
    label,
    proteinG,
    proteinCal: Math.round(proteinG * 4),
    carbsG,
    carbsCal: Math.round(carbsG * 4),
    fatsG,
    fatsCal: Math.round(fatCalories),
    totalCal: Math.round(totalCalories),
  };
}

export const MACRO_SIGNAL_INTRO = 'Each macronutrient affects your body differently. Getting too much or too little of protein, carbohydrates, or fat can work against your goals. The table below shows what to watch for on each one.';

export const MACRO_SIGNAL_ROWS = [
  {
    id: 'protein',
    label: 'PROTEIN',
    tooMuch: 'GAIN FAT',
    tooLittle: 'LOSE LBM (MUSCLE)',
  },
  {
    id: 'carbohydrates',
    label: 'CARBOHYDRATES',
    tooMuch: 'GAIN FAT',
    tooLittle: 'LOSE ENERGY',
  },
  {
    id: 'fat',
    label: 'FAT',
    tooMuch: 'GAIN FAT',
    tooLittle: 'LOSE FAT',
  },
];

const MACRO_SIGNAL_ICON_PATHS = {
  protein: '<path d="M6 28c0-8 4-14 10-16 2-6 8-8 14-6 4 8 2 18-4 24-6 6-14 8-20 4-2-2-4-4-6z" fill="currentColor"/><path d="M30 10c2 6 0 12-4 16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  carbohydrates: '<rect x="4" y="14" width="16" height="20" rx="3" fill="currentColor"/><rect x="22" y="10" width="16" height="20" rx="3" fill="currentColor" opacity="0.72"/>',
  fat: '<path d="M20 6c10 0 16 8 16 18 0 10-6 18-16 18S4 34 4 24C4 14 10 6 20 6z" fill="currentColor"/><circle cx="20" cy="24" r="6" fill="#e8e8e8"/>',
};

export function macroSignalIconMarkup(id) {
  const paths = MACRO_SIGNAL_ICON_PATHS[id];
  if (!paths) return '';
  return `<svg class="r-macro-signal__icon-svg" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true" focusable="false">${paths}</svg>`;
}

export function macroTableRows(formula, workIntensity) {
  if (!formula) return [];
  const f = formula;

  return [
    macroRow('Maintain current fat %', f.QA, f.C1 / 4, f.FD, f.T7),
    macroRow('Reduce current fat %', f.QA, f.C1 / 4, f.FG, f.T1),
    { spacer: true },
    macroRow('Resting(RMR)', f.QB, f.C2 / 4, f.FH, f.T2),
    macroRow(workdayActivityLabel(workIntensity), f.QC, f.C3 / 4, f.FJ, f.T3),
    macroRow('Weight Training', f.QD, f.C4 / 4, f.FK, f.T4),
    macroRow('Cardiovascular Activities', f.QE, f.C5 / 4, f.FL, f.T5),
    macroRow('Fat Burning Activities', f.QF, f.C6 / 4, f.FM, f.T6),
  ];
}

export { formatCalories, formatHours };
