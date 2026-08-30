/** Parent/guardian approval for athletes age 17 and under — questionnaire, intake, purchase. */

export const PARENT_APPROVAL_MAX_AGE = 17;
export const MIN_ATHLETE_AGE = 16;
export const MAX_ATHLETE_AGE = 99;

export const INTAKE_AGE_PARENT_NOTE =
  'Parent/guardian permission required for athletes age 17 and under.';

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

/** Age 17 and under requires parent/guardian approval before purchase. */
export function requiresParentApproval(age) {
  const n = Number(age);
  return Number.isFinite(n) && n >= 0 && n <= PARENT_APPROVAL_MAX_AGE;
}

/** @deprecated Use requiresParentApproval */
export const isMinorAthlete = requiresParentApproval;

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

export function validateParentConsentFields(values) {
  if (!requiresParentApproval(values.age)) return '';
  if (!values.parentGuardianName) return 'Enter parent/guardian name.';
  if (!values.parentGuardianEmail) return 'Enter parent/guardian email.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.parentGuardianEmail)) {
    return 'Enter a valid parent/guardian email.';
  }
  if (!values.parentGuardianRelationship) return 'Select relationship to athlete.';
  if (!values.parentConsentAccepted) return 'Confirm parent/guardian approval.';
  if (!values.parentGuardianSignature) return 'Type parent/guardian full legal name.';
  if (!values.parentGuardianSignedDate) return 'Enter parent/guardian approval date.';
  return '';
}

export function parentConsentRecordComplete(parent) {
  if (!parent) return false;
  return Boolean(
    parent.guardianName
    && parent.guardianEmail
    && parent.relationship
    && parent.accepted
    && parent.signature
    && parent.signedDate,
  );
}

export function parentConsentReadyForPurchase(intake) {
  if (!requiresParentApproval(intake?.age)) return true;
  return parentConsentRecordComplete(intake?.parentConsent);
}
