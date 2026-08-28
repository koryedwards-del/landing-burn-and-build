/** Food Plan printout helpers — projections and exercise-hour summaries for the 7-page PDF. */

import { computeDietEightWeekProjection } from './bodyCompositionData.js';

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
