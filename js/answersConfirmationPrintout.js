/** PDF page 8 — rows that list the customer's submitted answers. */

import {
  INTAKE_FIELD_QUESTIONS,
  INTAKE_FIELD_QUESTION_NUMBERS,
  INTAKE_WAIVER_SIGNED_LABEL,
  INTAKE_WAIVER_SIGNED_QUESTION_NUMBER,
} from './intakeQuestionCopyData.js';
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

function confirmationRow(fieldId, value) {
  return {
    fieldId,
    questionNumber: INTAKE_FIELD_QUESTION_NUMBERS[fieldId],
    label: INTAKE_FIELD_QUESTIONS[fieldId],
    value,
  };
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
    confirmationRow('fullName', displayValue(intake.preferredName)),
    confirmationRow('sex', displayValue(intake.sex)),
    confirmationRow('email', displayValue(intake.email)),
    confirmationRow('referrerName', displayValue(intake.referrerName)),
    confirmationRow('workPhysical', workPhysicalLabel(intake.workPhysical)),
    confirmationRow('workStress', workStressLabel(intake.workStress)),
    confirmationRow('age', intake.age > 0 ? String(intake.age) : '—'),
    confirmationRow('sag', displayValue(intake.weightTrainingHours)),
    confirmationRow('cardio', displayValue(intake.cardioHours)),
    confirmationRow('moderate', displayValue(intake.fatBurningHours)),
    confirmationRow('height', formatConfirmationHeight(intake.heightInches)),
    confirmationRow('weight', intake.totalWeight > 0 ? `${intake.totalWeight} lbs` : '—'),
    confirmationRow('fatPercent', bodyFatPercentValue(intake)),
    confirmationRow('fatSource', formatFatSourceLabel(intake.fatSource, intake.fatSourceOther)),
    {
      fieldId: 'waiver',
      questionNumber: INTAKE_WAIVER_SIGNED_QUESTION_NUMBER,
      label: INTAKE_WAIVER_SIGNED_LABEL,
      value: waiverSignedLabel(intake.waiverSignature, intake.waiverSignedDate),
    },
  ];
}
