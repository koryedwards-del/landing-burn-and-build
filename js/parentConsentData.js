/** Parent/guardian approval for athletes under 18 — questionnaire, intake, PDF confirmation. */

export const MINOR_AGE_THRESHOLD = 18;
export const MIN_ATHLETE_AGE = 8;
export const MAX_ATHLETE_AGE = 99;

export const INTAKE_AGE_PARENT_NOTE =
  'Parent/guardian permission required for athletes under 18.';

export const INTAKE_PARENT_CONSENT_VERSION = 'parent-consent-v1';

export const INTAKE_PARENT_CONSENT_TEXT =
  'I am the parent or legal guardian of the athlete named in this questionnaire. I have reviewed the athlete waiver and give permission for my child to participate in the Burn & Build program.';

export const INTAKE_PARENT_NAME_LABEL = 'Parent/guardian name';
export const INTAKE_PARENT_EMAIL_LABEL = 'Parent/guardian email';
export const INTAKE_PARENT_RELATIONSHIP_LABEL = 'Relationship to athlete';
export const INTAKE_PARENT_CONSENT_CHECKBOX_LABEL =
  'I confirm I am the parent or legal guardian and I approve on behalf of the athlete.';
export const INTAKE_PARENT_APPROVED_LABEL = 'Parent/guardian approval';

export const INTAKE_PARENT_RELATIONSHIP_OPTIONS = Object.freeze([
  { value: 'parent', label: 'Parent' },
  { value: 'legal_guardian', label: 'Legal Guardian' },
]);

export function isMinorAthlete(age) {
  const n = Number(age);
  return Number.isFinite(n) && n >= MIN_ATHLETE_AGE && n < MINOR_AGE_THRESHOLD;
}

export function parentRelationshipLabel(value) {
  return INTAKE_PARENT_RELATIONSHIP_OPTIONS.find((item) => item.value === value)?.label || value || '—';
}

export function validateAthleteAge(age) {
  if (age == null || !Number.isFinite(age)) return 'Enter your age in years.';
  if (!Number.isInteger(age)) return 'Enter your age in whole years.';
  if (age < MIN_ATHLETE_AGE || age > MAX_ATHLETE_AGE) {
    return `Enter an age between ${MIN_ATHLETE_AGE} and ${MAX_ATHLETE_AGE}.`;
  }
  return '';
}
