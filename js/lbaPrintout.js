/** Lean Body Analysis — ACE categories and weight-goal tables (seminar printout). */

import { analyzeLeanBodyMass } from './bodyCompositionAnalysis.js';

const ACE_FEMALE = Object.freeze([
  { label: 'Extreme', min: 9, max: 13.99, weightMaxBf: 12.54 },
  { label: 'Healthy', min: 14, max: 20.99, weightMinBf: 13.21 },
  { label: 'Average', min: 21, max: 25.99, weightMaxBf: 25.2 },
  { label: 'Borderline', min: 26, max: 31.99 },
  { label: 'At Risk', min: 32, max: null },
]);

const ACE_MALE = Object.freeze([
  { label: 'Extreme', min: 6, max: 13.99 },
  { label: 'Healthy', min: 14, max: 17.99 },
  { label: 'Average', min: 18, max: 24.99 },
  { label: 'Borderline', min: 25, max: 29.99 },
  { label: 'At Risk', min: 30, max: null },
]);

function aceTable(gender) {
  return gender === 'female' ? ACE_FEMALE : ACE_MALE;
}

function weightAtBfPercent(lbm, bfPercent) {
  return lbm / (1 - bfPercent / 100);
}

export function aceCategories(gender) {
  return aceTable(gender).map((row) => ({
    ...row,
    rangeLabel: row.max == null
      ? `${row.min}%+`
      : `${row.min}%-${row.max}%`,
  }));
}

export function aceCategoryForBodyFat(gender, bodyFatPercent) {
  const bf = Number(bodyFatPercent);
  const table = aceTable(gender);
  if (!Number.isFinite(bf)) return table[table.length - 1];
  for (const row of table) {
    if (row.max == null && bf >= row.min) return row;
    if (row.max != null && bf >= row.min && bf <= row.max) return row;
  }
  return table[0];
}

export function aceHeaderLabels(gender) {
  const table = aceTable(gender);
  return table.map((row) => {
    if (row.max == null) return `Over ${row.min} +%`;
    return `${row.min}%-${row.max}%`;
  });
}

/** @deprecated ACE attribution removed — returns empty until new category copy is wired. */
export function aceRiskMessage() {
  return '';
}

export function weightGoalRangeLabel(lbm, category, categoryIndex = 0) {
  const lean = Number(lbm);
  if (!lean || lean <= 0 || !category) return '—';
  if (category.max == null) {
    return `${Math.round(weightAtBfPercent(lean, category.min))} lbs. or more`;
  }
  const minBf = category.weightMinBf ?? category.min;
  let lightWeight;
  if (categoryIndex === 0) {
    lightWeight = Math.round(weightAtBfPercent(lean, minBf));
  } else if (categoryIndex === 2) {
    lightWeight = Math.round(weightAtBfPercent(lean, minBf));
  } else {
    lightWeight = Math.floor(weightAtBfPercent(lean, minBf));
  }
  const heavyBf = category.weightMaxBf ?? category.max;
  const heavyWeight = categoryIndex === 3
    ? Math.round(weightAtBfPercent(lean, heavyBf))
    : Math.floor(weightAtBfPercent(lean, heavyBf));
  const lo = Math.min(lightWeight, heavyWeight);
  const hi = Math.max(lightWeight, heavyWeight);
  return `${lo}-${hi} lbs.`;
}

export function weightGoalRanges(gender, lbm) {
  return aceTable(gender).map((category, index) => ({
    label: category.label,
    range: weightGoalRangeLabel(lbm, category, index),
  }));
}

export function lbmStatusMessage({ gender, heightInches, leanBodyMass }) {
  const analysis = analyzeLeanBodyMass({ gender, heightInches, leanBodyMass });
  const genderWord = gender === 'female' ? 'female' : 'male';
  if (!analysis.desirableLbm) {
    return {
      lead: '',
      congrats: '',
    };
  }
  const lead = `A ${genderWord} your height in good condition has ${Math.round(analysis.desirableLbm)} pounds or more of lean body weight.`;
  const congrats = analysis.atOrAbove
    ? 'CONGRATULATIONS! Your LBM is at or above the desirable amount. Even so, it\'s a good idea to exercise at least twice a week. If you want to gain lean or maybe just tone and shape your body, do so by participating in a weight-training program two to three times a week under the guidance of an experienced trainer. The table below tells us what you would weigh for the different health categories based on your current Lean Body Mass. Increasing or decreasing your LBM would increase or decrease the suggested body weight accordingly. For maximum success, feed your body properly. This diet will show you how much food you need daily for maximum results.'
    : 'Your LBM is below the desirable amount for your height. Exercise at least twice a week and follow this diet to support lean gain while losing fat. The table below shows target weights for different health categories based on your current Lean Body Mass.';
  return { lead, congrats, analysis };
}

export function formatSexLabel(sex) {
  const value = String(sex || '').trim().toLowerCase();
  if (value.startsWith('f')) return 'FEMALE';
  if (value.startsWith('m')) return 'MALE';
  return String(sex || '').toUpperCase();
}

export function formatMm(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${n} mm`;
}
