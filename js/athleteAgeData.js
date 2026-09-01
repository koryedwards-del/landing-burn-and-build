/** Athlete age bounds for the program questionnaire. */

export const MIN_ATHLETE_AGE = 16;
export const MAX_ATHLETE_AGE = 99;

export function validateAthleteAge(age) {
  if (age == null || !Number.isFinite(age)) return 'Enter your age in years.';
  if (!Number.isInteger(age)) return 'Enter your age in whole years.';
  if (age < MIN_ATHLETE_AGE || age > MAX_ATHLETE_AGE) {
    return `Enter an age between ${MIN_ATHLETE_AGE} and ${MAX_ATHLETE_AGE}.`;
  }
  return '';
}
