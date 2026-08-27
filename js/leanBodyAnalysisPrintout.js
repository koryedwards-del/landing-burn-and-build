/** Lean Body Analysis — leanness stages and weight-goal tables (seminar printout). */

import { PROJECTION_BF_FLOOR } from './burnEngine.js';
import { analyzeLeanBodyMass, desirableLeanBodyMassLbs } from './bodyCompositionData.js';

const LEANNESS_LABELS = Object.freeze(['Competition', 'Peaking', 'Prepping', 'Training']);
const LEANNESS_STEP = 5;

export const BODY_FAT_PROGRESS_BAR_TITLE = 'PROJECTED PROGRESS';
export const BODY_FAT_PROGRESS_BAR_SUBTITLE = 'WHERE YOU ARE. WHERE YOU\'RE HEADED.';
export const BODY_FAT_PROGRESS_BAR_FOOTER = 'How much fat is right for you is a personal choice. How you look in the mirror is the only true judge of whether you\'re where you want to be.';

export const DESIRABLE_LBM_BAR_TITLE = 'LEAN BODY MASS BAR';
export const DESIRABLE_LBM_BAR_SUBTITLE = 'WHERE YOU ARE. WHERE YOU\'RE HEADED.';
export const DESIRABLE_LBM_BAR_FOOTER = 'Lean body mass is everything in your body that is not fat — muscle, bone, organs, and fluids. It drives metabolism. Burn & Build is built to reduce fat while protecting that lean tissue.';

/** Body composition source options (profile / PDF answers page). */
const FAT_SOURCE_OPTIONS = Object.freeze([
  { value: 'guess', label: "I'm estimating" },
  { value: 'smart_scales', label: 'Smart scales' },
  { value: 'tape', label: 'Tape measurements' },
  { value: 'bia', label: 'InBody/BIA' },
  { value: 'scan3d', label: '3D scanning (Styku and Fit3D)' },
  { value: 'skinfolds', label: 'Calipers' },
  { value: 'bodpod', label: 'Bod Pod' },
  { value: 'dexa', label: 'DEXA' },
  { value: 'hydrostatic', label: 'Hydrostatic weighing' },
  { value: 'other', label: 'Other' },
]);

export function formatFatSourceLabel(value, otherText = '') {
  if (value === 'other') return otherText || 'Other';
  const match = FAT_SOURCE_OPTIONS.find((option) => option.value === value);
  if (match) return match.label;
  if (value === 'recent') return 'Calipers / ultrasound / BodPod';
  return '—';
}

export function lbaProfileLine({ heightInches, sex, age, fatSource, fatSourceOther }) {
  const bodyComp = formatFatSourceLabel(fatSource, fatSourceOther);
  return `Height: ${heightInches} inches  Sex: ${sex}  Body comp: ${bodyComp}  Age: ${age} years`;
}

/** Structured profile stats for LBA snapshot card (PDF). */
export function lbaProfileStats({ heightInches, sex, age, fatSource, fatSourceOther }) {
  const bodyComp = formatFatSourceLabel(fatSource, fatSourceOther);
  return [
    { label: 'HEIGHT', value: `${heightInches} in.` },
    { label: 'SEX', value: sex },
    { label: 'BODY COMP', value: bodyComp },
    { label: 'AGE', value: `${age} years` },
  ];
}

function formatTodayPct(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '—';
  return raw.endsWith('%') ? raw : `${raw}%`;
}

/** Today composition rows for LBA snapshot card (PDF). */
export function lbaTodayTableRows(today) {
  if (!today) return [];
  return [
    { label: 'LEAN', pct: formatTodayPct(today.leanPct), lbs: `${today.leanLbs} lbs.` },
    { label: 'FAT', pct: formatTodayPct(today.fatPct), lbs: `${today.fatLbs} lbs.` },
    { label: 'TOTAL', pct: formatTodayPct(today.totalPct), lbs: `${today.totalLbs} lbs.` },
  ];
}

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

function formatBarFatHeader(cap, gender) {
  const floor = gender === 'female' ? PROJECTION_BF_FLOOR.female : PROJECTION_BF_FLOOR.male;
  if (Math.abs(Number(cap) - floor) < 0.5) {
    return `< ${floor.toFixed(2)}% FAT`;
  }
  return `< ${Math.round(Number(cap))}% FAT`;
}

function lbaBfFloor(gender) {
  return gender === 'female' ? PROJECTION_BF_FLOOR.female : PROJECTION_BF_FLOOR.male;
}

function lbaStageReadyCategory(gender) {
  const floor = lbaBfFloor(gender);
  return {
    label: 'Stage-ready',
    bfMin: floor,
    bfMax: floor,
    bfRangeLabel: `${floor.toFixed(2)}%`,
    isUltrasoundFloor: true,
  };
}

function formatBarCurrentFatHeader(bf) {
  const value = round2(bf);
  return Number.isFinite(value) ? `${value.toFixed(2)}% FAT` : null;
}

/** Body-fat appearance ranges — Stage-ready uses PROJECTION_BF_FLOOR (ultrasound). */
const LBA_BF_RANGE_REST = Object.freeze({
  female: [
    { label: 'Athletic', bfMin: 14, bfMax: 20.99, bfRangeLabel: '14–20%' },
    { label: 'Visible abs', bfMin: 15, bfMax: 17.99, bfRangeLabel: '15–17%' },
    { label: 'Average', bfMin: 21, bfMax: 30.99, bfRangeLabel: '21–30%' },
  ],
  male: [
    { label: 'Athletic', bfMin: 6, bfMax: 13.99, bfRangeLabel: '6–13%' },
    { label: 'Visible six-pack', bfMin: 8, bfMax: 11.99, bfRangeLabel: '8–11%' },
    { label: 'Average', bfMin: 14, bfMax: 20.99, bfRangeLabel: '14–20%' },
  ],
});

function lbaBodyFatRangeRows(gender) {
  const key = gender === 'female' ? 'female' : 'male';
  return [lbaStageReadyCategory(key), ...LBA_BF_RANGE_REST[key].map((row) => ({ ...row }))];
}

export function lbaBodyFatRangeCategories(gender) {
  return lbaBodyFatRangeRows(gender).map((row) => ({ ...row }));
}

function formatAceWeightRange(lbm, category) {
  const lean = Number(lbm);
  if (!lean || lean <= 0 || !category) return '—';
  if (category.isUltrasoundFloor || category.bfMin === category.bfMax) {
    return `${Math.round(weightAtBfPercent(lean, category.bfMin))} lbs.`;
  }
  if (category.bfMax == null) {
    const atMin = Math.round(weightAtBfPercent(lean, category.bfMin));
    return `${atMin} lbs. or more`;
  }
  const lighter = Math.round(weightAtBfPercent(lean, category.bfMin));
  const heavier = Math.round(weightAtBfPercent(lean, category.bfMax));
  return `${Math.min(lighter, heavier)} – ${Math.max(lighter, heavier)} lbs.`;
}

export function lbaBodyFatRangeWeightRanges(gender, lbm) {
  return lbaBodyFatRangeCategories(gender).map((category) => ({
    label: category.label,
    bfRangeLabel: category.bfRangeLabel,
    weightRangeLabel: formatAceWeightRange(lbm, category),
  }));
}

/** Neutral lead between BF% and weight tables — no third-party attribution. */
export function lbaBodyFatRangeLeadMessage() {
  return BODY_FAT_PROGRESS_BAR_FOOTER;
}

/** Leanest stage where body fat is under the cap; null when above Training. */
function aceCategoryForBodyFat(gender, bodyFatPercent) {
  const bf = Number(bodyFatPercent);
  const table = leannessTable(gender);
  if (!Number.isFinite(bf)) return null;
  for (const row of table) {
    if (bf < row.cap) return row;
  }
  return null;
}

function desirableLbmBarFooter(lead) {
  const parts = [lead, DESIRABLE_LBM_BAR_FOOTER].filter(Boolean);
  return parts.join(' ');
}

function lbmCopyFirstSentence(text) {
  if (!text) return '';
  const end = text.indexOf('. ');
  return end >= 0 ? text.slice(0, end + 1) : text;
}

export function lbmCopyAfterFirstSentence(text) {
  if (!text) return '';
  const end = text.indexOf('. ');
  return end >= 0 ? text.slice(end + 2) : '';
}

export function leannessFatBarFooterParts(lead, congrats) {
  const congratsLead = lbmCopyFirstSentence(congrats);
  const lbmPart = desirableLbmBarFooter(lead);
  const body = [lbmPart, BODY_FAT_PROGRESS_BAR_FOOTER].filter(Boolean).join(' ');
  return {
    congratsLead,
    body,
    full: [congratsLead, body].filter(Boolean).join('\n\n'),
  };
}

/** Contiguous BF% zones, caps, and target weights for the LBA fat bar (client gender). */
export function leannessFatBar(gender, bodyFatPercent, lbm) {
  const table = leannessTable(gender);
  const bf = Number(bodyFatPercent);
  const zones = [];
  let prev = 0;
  for (const row of table) {
    zones.push({
      label: row.label,
      from: prev,
      to: row.cap,
      capLabel: formatBarFatHeader(row.cap, gender),
      weightLabel: weightGoalRangeLabel(lbm, row),
    });
    prev = row.cap;
  }
  const trainingCap = table[table.length - 1].cap;
  const scaleMax = Math.max(
    40,
    trainingCap + 10,
    Number.isFinite(bf) ? Math.ceil(bf / 5) * 5 : 40,
  );
  zones.push({
    label: 'Off-season',
    from: trainingCap,
    to: scaleMax,
    capLabel: formatBarCurrentFatHeader(bf),
  });
  const active = aceCategoryForBodyFat(gender, bf);
  const activeStage = active?.label ?? 'Off-season';
  const lean = Number(lbm);
  const lbmCell = lean > 0
    ? {
      label: 'LBM',
      poundsLabel: `${round2(lean)} lbs.`,
    }
    : null;
  return {
    currentBf: Number.isFinite(bf) ? round2(bf) : null,
    currentLbm: lbmCell ? round2(lean) : null,
    lbmCell,
    scaleMax,
    zones,
    activeStage,
  };
}

function formatTimelineShort(timeline) {
  const value = String(timeline || '').trim();
  if (!value || value === 'Current') return 'Now';
  const match = value.match(/^(\d+(?:\.\d+)?)\s*weeks?$/i);
  if (match) return `${Math.round(Number(match[1]))}w`;
  return value.replace(/\*+$/, '').trim();
}

/** Projected weight markers from the burn-engine timeline (future rows only). */
export function fatBarTimelineMarkers(timeline) {
  if (!timeline?.valid || !Array.isArray(timeline.rows)) return [];
  return timeline.rows
    .filter((row) => !row.isCurrent && Number.isFinite(Number(row.bodyFat)))
    .map((row) => ({
      timeline: row.timeline,
      timelineLabel: formatTimelineShort(row.timeline),
      bodyFat: round2(row.bodyFat),
      weightLabel: row.weightDisplay || `${Math.round(Number(row.weight))} lbs`,
      badge: row.badge || null,
    }));
}

function weightGoalRangeLabel(lbm, category) {
  const lean = Number(lbm);
  if (!lean || lean <= 0 || !category) return '—';
  return `${Math.round(weightAtBfPercent(lean, category.cap))} lbs.`;
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
    ? 'CONGRATULATIONS! Your LBM is at or above the desirable amount. Even so, it\'s a good idea to exercise at least twice a week. If you want to gain lean or maybe just tone and shape your body, do so by participating in a weight-training program two to three times a week under the guidance of an experienced trainer. The table below tells us what you would weigh at each body fat range from Stage-ready to Average based on your current Lean Body Mass. Increasing or decreasing your LBM would increase or decrease the suggested body weight accordingly. For maximum success, feed your body properly. This diet will show you how much food you need daily for maximum results.'
    : 'ALERT! Your LBM is below the desirable amount for your height. Exercise at least twice a week and follow this diet to support lean gain while losing fat. The table below shows target weights at each body fat range from Stage-ready to Average based on your current Lean Body Mass.';
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
