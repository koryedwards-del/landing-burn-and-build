/** Lean Body Analysis — leanness stages and weight-goal tables (seminar printout). */

import { PROJECTION_BF_FLOOR } from './burnEngine.js';
import { analyzeLeanBodyMass, desirableLeanBodyMassLbs } from './bodyCompositionAnalysis.js';

const LEANNESS_LABELS = Object.freeze(['Competition', 'Peaking', 'Prepping', 'Training']);
const LEANNESS_STEP = 5;

export const BODY_FAT_PROGRESS_BAR_TITLE = 'PROJECTED PROGRESS';
export const BODY_FAT_PROGRESS_BAR_SUBTITLE = 'WHERE YOU ARE. WHERE YOU\'RE HEADED.';
export const BODY_FAT_PROGRESS_BAR_FOOTER = 'How much fat is right for you is a personal choice. How you look in the mirror is the only true judge of whether you\'re where you want to be.';

export const DESIRABLE_LBM_BAR_TITLE = 'LEAN BODY MASS BAR';
export const DESIRABLE_LBM_BAR_SUBTITLE = 'WHERE YOU ARE. WHERE YOU\'RE HEADED.';
export const DESIRABLE_LBM_BAR_FOOTER = 'Lean body mass is everything in your body that is not fat — muscle, bone, organs, and fluids. It drives metabolism. Burn & Build is built to reduce fat while protecting that lean tissue.';

/** Body composition source — least to most involved (questionnaire fatSource options). */
const FAT_SOURCE_OPTIONS = Object.freeze([
  { value: 'guess', label: "I'm estimating" },
  { value: 'smart_scales', label: 'Smart scales' },
  { value: 'tape', label: 'Tape measurements' },
  { value: 'bia', label: 'InBody/BIA' },
  { value: 'scan3d', label: '3D scanning (Styku and Fit3D)' },
  { value: 'skinfolds', label: 'Skinfolds' },
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
  return `Height: ${heightInches} inches  Sex: ${sex}  Body comp: ${bodyComp}  Age: ${age} years of experience`;
}

/** Structured profile stats for LBA snapshot card (PDF). */
export function lbaProfileStats({ heightInches, sex, age, fatSource, fatSourceOther }) {
  const bodyComp = formatFatSourceLabel(fatSource, fatSourceOther);
  return [
    { label: 'HEIGHT', value: `${heightInches} in.` },
    { label: 'SEX', value: sex },
    { label: 'BODY COMP', value: bodyComp },
    { label: 'AGE', value: `${age} years of experience` },
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

function formatCapHeader(cap) {
  return `<${cap}%`;
}

function formatBarFatHeader(cap) {
  return `<${cap}% FAT`;
}

function formatBarCurrentFatHeader(bf) {
  const value = round2(bf);
  return Number.isFinite(value) ? `${value.toFixed(2)}% FAT` : null;
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

export function desirableLbmBarFooter(lead) {
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

export function leannessFatBarFooter(lead, congrats) {
  return leannessFatBarFooterParts(lead, congrats).full;
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

/** Below / at-or-above desirable LBM zones for the LBA lean-mass bar (client gender + height). */
export function desirableLbmBar(gender, heightInches, leanBodyMass) {
  const desirable = desirableLeanBodyMassLbs(gender, heightInches);
  const lbm = Number(leanBodyMass);
  if (!desirable || !Number.isFinite(lbm) || lbm <= 0) return null;

  const scaleMax = Math.max(
    Math.ceil((desirable * 1.2) / 5) * 5,
    Math.ceil(lbm / 5) * 5 + 5,
    desirable + 15,
  );
  const atOrAbove = lbm >= desirable;
  return {
    currentLbm: round2(lbm),
    desirableLbm: round2(desirable),
    scaleMax,
    zones: [
      {
        label: 'Below desirable',
        from: 0,
        to: desirable,
      },
      {
        label: 'At or above',
        from: desirable,
        to: scaleMax,
      },
    ],
    activeStage: atOrAbove ? 'At or above' : 'Below desirable',
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
      capLabel: formatBarFatHeader(row.cap),
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
      fatLabel: '<0.00% FAT',
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

/** Projected BF% markers from the burn-engine timeline table (future rows only). */
export function fatBarTimelineMarkers(timeline) {
  if (!timeline?.valid || !Array.isArray(timeline.rows)) return [];
  return timeline.rows
    .filter((row) => !row.isCurrent && Number.isFinite(Number(row.bodyFat)))
    .map((row) => ({
      timeline: row.timeline,
      timelineLabel: formatTimelineShort(row.timeline),
      bodyFat: round2(row.bodyFat),
      bfLabel: row.bodyFatDisplay || `${round2(row.bodyFat)}%`,
      badge: row.badge || null,
    }));
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
