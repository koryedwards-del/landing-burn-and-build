/** User-facing question text for numbered intake fields (questionnaire + confirmation). */

export const INTAKE_FIELD_QUESTIONS = Object.freeze({
  fullName: 'What is your full name?',
  sex: 'What is your gender?',
  email: 'What is your email address?',
  emailConfirm: 'Confirm your email address',
  referrerName: 'Who do we thank?',
  workPhysical: 'How physically active is your job?',
  workStress: 'Your life outside work & training hours',
  age: 'How young are you?',
  sag: 'How many hours per week of stop & go activity?',
  cardio: 'How many hours per week in your cardio training range?',
  moderate: 'How many hours per week in your fat burning training range?',
  height: 'What is your height?',
  weight: 'What is your weight?',
  fatPercent: 'What is your body fat percentage?',
  fatSource: 'How do you know?',
});

/** Continuous question numbers across intake steps (email confirm = 4, omitted from PDF confirmation). */
export const INTAKE_FIELD_QUESTION_NUMBERS = Object.freeze({
  fullName: 1,
  sex: 2,
  email: 3,
  emailConfirm: 4,
  referrerName: 5,
  workPhysical: 6,
  workStress: 7,
  age: 8,
  sag: 9,
  cardio: 10,
  moderate: 11,
  height: 12,
  weight: 13,
  fatPercent: 14,
  fatSource: 15,
});

export const INTAKE_WAIVER_SIGNED_QUESTION_NUMBER = 16;
export const INTAKE_WAIVER_SIGNED_LABEL = 'Signed';
