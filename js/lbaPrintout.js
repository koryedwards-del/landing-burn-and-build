/** Lean Body Analysis — leanness stages and weight-goal tables (seminar printout). */

import { PROJECTION_BF_FLOOR } from './burnEngine.js';
import { analyzeLeanBodyMass } from './bodyCompositionAnalysis.js';

const LEANNESS_LABELS = Object.freeze(['Competition', 'Peaking', 'Prepping', 'Training']);
const LEANNESS_STEP = 5;

export const BODY_FAT_PROGRESS_BAR_TITLE = 'BODY FAT PROGRESS BAR';
export const BODY_FAT_PROGRESS_BAR_SUBTITLE = 'WHERE YOU ARE. WHERE YOU\'RE HEADED.';
export const BODY_FAT_PROGRESS_BAR_FOOTER = 'How much fat is right for you is a personal choice. How you look in the mirror is the only true judge of whether you\'re where you want to be.';

function round2(x) {
  return Math.round(Number(x) * 100) / 100;
}

function leannessTable(gender) {
  const floor = gender === 'female' ? PROJECTION_BF_FLOOR.female : PROJECTION_BF_FLOOR.male;
  return LEANNESS_LABELS.map((label, index) => ({
    label,
    cap: round2(floor + index * LEANNESS_STEP),
  }));
}

function weightAtBfPercent(lbm, bfPercent) {
  return lbm / (1 - bfPercent / 100);
}

function formatCapHeader(cap) {
  return `<${cap}%`;
}

export function aceCategories(gender) {
  return leannessTable(gender).map((row) => ({
    ...row,
    rangeLabel: formatCapHeader(row.cap),
  }));
}

/** Leanest stage where body fat is under the cap; null when above Training. */
export function aceCategoryForBodyFat(gender, bodyFatPercent) {
  const bf = Number(bodyFatPercent);
  const table = leannessTable(gender);
  if (!Number.isFinite(bf)) return null;
  for (const row of table) {
    if (bf < row.cap) return row;
  }
  return null;
}

export function aceHeaderLabels(gender) {
  return leannessTable(gender).map((row) => formatCapHeader(row.cap));
}

/** Stage columns with target weights for the client's gender and LBM. */
export function leannessWeightGoalsTable(gender, lbm) {
  const rows = leannessTable(gender);
  return {
    stageLabels: LEANNESS_LABELS,
    values: rows.map((row) => weightGoalRangeLabel(lbm, row)),
  };
}

/** Contiguous BF% zones and marker position for the LBA fat bar (client gender). */
export function leannessFatBar(gender, bodyFatPercent) {
  const table = leannessTable(gender);
  const bf = Number(bodyFatPercent);
  const zones = [];
  let prev = 0;
  for (const row of table) {
    zones.push({
      label: row.label,
      from: prev,
      to: row.cap,
      capLabel: formatCapHeader(row.cap),
    });
    prev = row.cap;
  }
  const trainingCap = table[table.length - 1].cap;
  const scaleMax = Math.max(
    40,
    trainingCap + 10,
    Number.isFinite(bf) ? Math.ceil(bf / 5) * 5 : 40,
  );
  zones.push({ label: 'Off-season', from: trainingCap, to: scaleMax });
  const active = aceCategoryForBodyFat(gender, bf);
  return {
    currentBf: Number.isFinite(bf) ? round2(bf) : null,
    scaleMax,
    zones,
    activeStage: active?.label ?? 'Off-season',
  };
}

/** @deprecated ACE attribution removed — returns empty until new category copy is wired. */
export function aceRiskMessage() {
  return '';
}

export function weightGoalRangeLabel(lbm, category) {
  const lean = Number(lbm);
  if (!lean || lean <= 0 || !category) return '—';
  return `${Math.round(weightAtBfPercent(lean, category.cap))} lbs.`;
}

export function weightGoalRanges(gender, lbm) {
  return leannessTable(gender).map((category) => ({
    label: category.label,
    range: weightGoalRangeLabel(lbm, category),
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
