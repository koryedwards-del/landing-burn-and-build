/** PDF page 8 — rows that list the customer's submitted answers. */

import {
  JOB_ACTIVITY_OPTIONS,
  WORK_STRESS,
} from './profileDataEngine.js';
import { formatFatSourceLabel } from './leanBodyAnalysisPrintout.js';

export const ANSWERS_CONFIRMATION_INTRO =
  'Answers submitted for this Burn & Build Diet program.';

function displayValue(value) {
  if (value === '' || value == null) return '—';
  return String(value);
}

function formatConfirmationHeight(heightInches) {
  const n = Number(heightInches);
  if (!Number.isFinite(n) || n <= 0) return '—';
  const feet = Math.floor(n / 12);
  const inches = Math.round(n - feet * 12);
  return `${feet}'${inches}"`;
}

function workPhysicalLabel(id) {
  return JOB_ACTIVITY_OPTIONS.find((item) => item.id === id)?.label || id || '—';
}

function workStressLabel(id) {
  return WORK_STRESS.find((item) => item.id === id)?.label || id || '—';
}

function formatConfirmationDate(isoDate) {
  const parts = String(isoDate || '').split('-');
  if (parts.length !== 3) return isoDate ? String(isoDate) : '—';
  const [year, month, day] = parts;
  return `${month} / ${day} / ${year}`;
}

function waiverSignedLabel(signature, signatureDate) {
  const name = String(signature || '').trim();
  if (!name) return '—';
  const date = formatConfirmationDate(signatureDate);
  return date && date !== '—' ? `${name} — ${date}` : name;
}

function bodyFatPercentValue(intake) {
  const fatPct = Number(intake.fatPercent);
  if (!Number.isFinite(fatPct) || fatPct <= 0) return '—';
  return `${fatPct}%`;
}

/** @param {{ questionNumber?: number, label: string }} row */
export function formatAnswersConfirmationLabel({ questionNumber, label }) {
  const n = Number(questionNumber);
  if (!Number.isFinite(n) || n <= 0) return label;
  return `${n}. ${label}`;
}

/** @param {{ intake?: object } | object} source Program package or intake-shaped object. */
export function buildAnswersConfirmationRows(source) {
  const intake = source?.intake || source || {};

  return [
    { questionNumber: 1, label: 'Name', value: displayValue(intake.preferredName) },
    { questionNumber: 2, label: 'Gender', value: displayValue(intake.sex) },
    { questionNumber: 3, label: 'Email', value: displayValue(intake.email) },
    { questionNumber: 5, label: 'Who we thank', value: displayValue(intake.referrerName) },
    { questionNumber: 6, label: 'Job activity', value: workPhysicalLabel(intake.workPhysical) },
    { questionNumber: 7, label: 'My Life', value: workStressLabel(intake.workStress) },
    { questionNumber: 8, label: 'Age', value: intake.age > 0 ? String(intake.age) : '—' },
    { questionNumber: 9, label: 'SAG hours / week', value: displayValue(intake.weightTrainingHours) },
    { questionNumber: 10, label: 'Cardio training hours / week', value: displayValue(intake.cardioHours) },
    {
      questionNumber: 11,
      label: 'Fat burning training hours / week',
      value: displayValue(intake.fatBurningHours),
    },
    { questionNumber: 12, label: 'Height', value: formatConfirmationHeight(intake.heightInches) },
    {
      questionNumber: 13,
      label: 'Weight',
      value: intake.totalWeight > 0 ? `${intake.totalWeight} lbs` : '—',
    },
    { questionNumber: 14, label: 'Body fat %', value: bodyFatPercentValue(intake) },
    {
      questionNumber: 15,
      label: 'How do you know',
      value: formatFatSourceLabel(intake.fatSource, intake.fatSourceOther),
    },
    {
      questionNumber: 16,
      label: 'Waiver signed',
      value: waiverSignedLabel(intake.waiverSignature, intake.waiverSignedDate),
    },
  ];
}
