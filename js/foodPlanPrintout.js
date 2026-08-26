/** Food Plan printout helpers — projections and macro signal table. */

import {
  computeDietEightWeekProjection,
  computeDietProjectionTimeline,
} from './bodyCompositionData.js';


function formatHours(n) {
  return Number(n).toFixed(2);
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

/** Projections page — between input grid and timeline table. */
export const PROJECTIONS_RMR_BRIDGE =
  'The burn engine uses the  information above to calculate your RMR (resting metabolic rate). In other words how much protein, carbohydrates and fat do use every day. '
  + 'Now the burn engine can calculates how much body fat you can safely lose per day. The table below shows you projected body weight and fat% every eight weeks. Use this table to determine when to start your Burn & Build diet to reach your goal on time. Showtime is the extreme bodybuilder competition look. Dont panic the good news here is the look you want is somewhere between where you are now and Showtime. When you look like you want to look ease up on the diet. If you drift back up. Tighten up the diet. Fine tuning day to ay week to week keeps looking great year round. '
  + 'and heres to best part of all. You can do this without counting calories or tracking macros because the Burn & Build engine shows you exactly what you need to eat to reach your goal.';

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
    'The following program contains a sophisticated calculation that is based on your individual lean',
    'body mass (LBM), and on your activities. This is the most individualized program available for',
    'losing fat and building muscle.',
    `In your questionnaire, you indicated you plan to exercise a total of ${hours.total} hour(s) per week.`,
    `${hours.wt} hour(s) of weight training, ${hours.cardio} hour(s) of cardiovascular activities,`,
    `${hours.fatBurn} hour(s) of fat-burning activities`,
  ].join(' ');

  const fatLost = projection.fatLostLbs.toFixed(1);
  const startBf = projection.startBf.toFixed(2);
  const endBf = projection.endBf.toFixed(2);

  return {
    intro,
    rmrBridge: PROJECTIONS_RMR_BRIDGE,
    fatLostLbs: fatLost,
    weeklyFatLossLbs: projection.weeklyFatLossLbs.toFixed(1),
    startBf,
    endBf,
    timelineRows: timeline?.valid
      ? timeline.rows.map((row) => ({
        timeline: row.timeline,
        bodyFat: row.badge && row.badge !== 'Average'
          ? `${row.bodyFatDisplay} (${row.badge})`
          : row.bodyFatDisplay,
        weight: row.weightDisplay,
        isCurrent: Boolean(row.isCurrent),
        badge: row.badge === 'Average' ? null : (row.badge ?? null),
      }))
      : [],
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
    emphasizeTooLittle: true,
  },
];

