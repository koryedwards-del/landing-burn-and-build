/** PDF page 12 — rows that list the customer's submitted answers. */

import {
  JOB_ACTIVITY_OPTIONS,
  WORK_STRESS,
} from './profileEngine.js';
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

function bodyCompositionLabel(intake) {
  const fatPct = Number(intake.fatPercent);
  if (!Number.isFinite(fatPct) || fatPct <= 0) return '—';
  const source = formatFatSourceLabel(intake.fatSource, intake.fatSourceOther);
  return `${fatPct}% (${source})`;
}

/** @param {{ intake?: object } | object} source Program package or intake-shaped object. */
export function buildAnswersConfirmationRows(source) {
  const intake = source?.intake || source || {};

  return [
    { label: 'Name', value: displayValue(intake.preferredName) },
    { label: 'Email', value: displayValue(intake.email) },
    { label: 'Who we thank', value: displayValue(intake.referrerName) },
    { label: 'Height', value: formatConfirmationHeight(intake.heightInches) },
    { label: 'Gender', value: displayValue(intake.sex) },
    { label: 'Age', value: intake.age > 0 ? String(intake.age) : '—' },
    { label: 'Weight', value: intake.totalWeight > 0 ? `${intake.totalWeight} lbs` : '—' },
    { label: 'Body composition', value: bodyCompositionLabel(intake) },
    { label: 'Job activity', value: workPhysicalLabel(intake.workPhysical) },
    { label: 'My Weeks', value: workStressLabel(intake.workStress) },
    { label: 'SAG hours / week', value: displayValue(intake.weightTrainingHours) },
    { label: 'Cardio training hours / week', value: displayValue(intake.cardioHours) },
    { label: 'Fat burning training hours / week', value: displayValue(intake.fatBurningHours) },
    {
      label: 'Waiver signed',
      value: waiverSignedLabel(intake.waiverSignature, intake.waiverSignedDate),
    },
  ];
}
