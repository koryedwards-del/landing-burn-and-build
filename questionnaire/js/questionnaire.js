import {
  heartRates,
  WORK_PHYSICAL,
  WORK_STRESS,
  QUESTIONNAIRE_JOB_OPTIONS,
} from '../../js/onboardingEngine.js';
import { buildProgramPackage } from '../../js/programPackage.js';
import { persistAppEmail, saveProgramToServer, isValidEmail } from '../../js/programApi.js';
import { persistProgramBridge } from '../../js/programBridgeHandoff.js';

import { CREATOR_CHECKOUT_URL, captureDietCreationTestBypass, isDietCreationGated, withDietCreationTestParam } from '../../js/siteUrls.js';
import { kwarnerPreviewPdfUrl } from '../../js/kwarnerPreviewBuild.js';

captureDietCreationTestBypass();

const STEPS = [
  { id: 'welcome', label: 'Create Your Diet' },
  { id: 'personal', label: 'The Basics' },
  { id: 'work', label: 'Occupation' },
  { id: 'exercise', label: 'Exercise' },
  { id: 'body', label: 'Body composition' },
  { id: 'waiver', label: 'Agreement' },
  { id: 'review', label: 'Review' },
];

const INFO_FIELDS = [
  'fullName',
  'sex',
  'email',
  'emailConfirm',
];

const INFO_FIELD_META = {
  fullName: {
    question: 'What is your full name?',
    guide: 'First and last name as it should appear on your program printout.',
    example: 'Example: Kory Edwards',
  },
  sex: {
    question: 'What is your gender?',
    guide: 'Select the option used in the calorie formulas.',
    example: 'Example: Male or Female',
  },
  email: {
    question: 'What is your email address?',
    guide: 'We deliver your program here and use it to unlock your plan after purchase.',
    example: 'Example: you@email.com',
  },
  emailConfirm: {
    question: 'Confirm your email address',
    guide: 'Type the same address again. We cannot fix a typo after checkout.',
    example: 'Must match the email you just entered.',
  },
};

const EXERCISE_FIELDS = [
  'age',
  'sag',
  'cardio',
  'moderate',
];

const EXERCISE_FIELD_META = {
  age: {
    question: 'How old are you today?',
    guide: 'Enter your age in whole years — not birthdate. Your age sets the heart-rate target zones on the cardio fields below.',
    example: 'Example: 45',
  },
  sag: {
    question: 'How many hours per week of stop & go activity?',
    guide: 'Plan for what you will actually do for the next 8 weeks — not what you wish you would do. Stop & go activity: weight training, CrossFit, racquet sports, intervals — work bursts with rest. Count only time moving or under load — not rest between sets, scrolling on the treadmill, or driving to the gym.',
    example: 'Three 1-hour sessions with ~45 min of actual lifting = about 2.25 hrs, not 3. Enter 0 if none. Use decimals: 0.25 = 15 min, 0.5 = 30 min, 0.75 = 45 min.',
  },
  cardio: {
    question: 'How many hours per week of vigorous activity?',
    guide: 'Sustained cardio where your heart rate stays in the vigorous zone (roughly 70–85% of max). Running, cycling hard, rowing, stair climbing — not a casual walk.',
    example: 'Enter 0 if none. Overstating exercise lowers your fat servings and makes the plan harder to follow.',
  },
  moderate: {
    question: 'How many hours per week of moderate activity?',
    guide: 'Fat-burning pace: heart rate below vigorous cardio. Brisk walking, easy bike, active housework and yard work.',
    example: '3 hrs/week is a common starting point — lower it if that is not realistic for you. Enter 0 if none.',
  },
};

const BODY_FIELDS = [
  'height',
  'weight',
  'fatSource',
  'fatPercent',
];

const BODY_FIELD_META = {
  height: {
    question: 'What is your height?',
    guide: 'Stand straight, no shoes. Enter feet and inches in separate boxes.',
    example: 'Example: 5 ft 10 in (enter 5 and 10)',
  },
  weight: {
    question: 'What is your weight?',
    guide: 'Morning weight in pounds, before eating, after bathroom, same scale each time.',
    example: 'Example: 168 lbs',
  },
  fatSource: {
    question: 'How do you know your body composition?',
    guide: 'Your plan is built from lean body mass (weight minus fat). Wrong body fat % = wrong servings from day one. Pick the most accurate source you actually have — not the one you wish you had.',
    example: 'DEXA scan — gold standard. Calipers, ultrasound, or BodPod — professional test within the last few weeks. I\'m estimating — no recent test; be honest, rounding down makes the plan too aggressive.',
  },
  fatPercent: {
    question: 'What is your body fat percentage?',
    guide: 'Enter body fat as a percentage (not BMI). One decimal is fine — e.g. 24.5. A professional test is worth it if you can get one.',
    example: 'Rough reference if you are estimating: many men fall 18–28%; many women 25–35%. When unsure, estimate slightly higher rather than lower. Options: DEXA at a clinic, BodPod or calipers at a gym, or a coach/trainer measurement.',
  },
};

const OCCUPATION_FIELDS = [
  'workPhysical',
  'workStress',
];

const OCCUPATION_FIELD_META = {
  workPhysical: {
    question: 'How physically active is your job?',
    guide: 'Most people work 40–48 hours a week. That is a lot of time — your job activity affects how many servings you need every day. Pick what describes most workdays, not your hardest day.',
  },
  workStress: {
    question: 'How draining is a typical workday?',
    guide: 'Physical work is only part of it. Mental pressure and pace add another level of drain — even at a desk job. A sitting job can still be stressful; a physical job can still feel comfortable.',
  },
};

const OCCUPATION_CHOICE_COPY = {
  workPhysical: {
    sitting: {
      label: 'Sitting',
      sub: 'Desk, computer, driving, reception — accountant, software developer, office clerk, administrative assistant, data entry clerk, graphic designer, attorney, call center agent, receptionist, long-haul driver.',
    },
    feet: {
      label: 'Moving',
      sub: 'On your feet most of the shift — nurse, teacher, retail associate, server, bartender, chef, pharmacist, hairdresser, security guard, bank teller.',
    },
    carrying: {
      label: 'Lifting',
      sub: 'Regular carrying, loading, or trades work — warehouse worker, construction laborer, delivery driver, material handler, electrician, plumber, carpenter, mover, landscaper, factory production worker.',
    },
  },
  workStress: {
    comfortable: {
      label: 'Comfortable',
      sub: 'Relaxed pace, manageable workload, time to think, you leave work at work.',
    },
    busy: {
      label: 'Busy',
      sub: 'Steady demands, meetings and tasks back-to-back, tired by end of day but manageable.',
    },
    stressful: {
      label: 'Stressful',
      sub: 'High pressure, tight deadlines, conflict or crisis, constant interruptions, you come home drained even when the work is mostly sitting.',
    },
  },
};

const form = document.getElementById('q-form');
const navList = document.getElementById('q-nav-list');
const reviewEl = document.getElementById('q-review');
const stepBackBtn = document.querySelector('[data-q-step-back]');
const stepNextBtn = document.querySelector('[data-q-step-next]');
const stepNav = document.getElementById('q-step-nav');
const panels = [...document.querySelectorAll('.q-panel')];
const infoAccordion = document.getElementById('info-accordion');
const occupationAccordion = document.getElementById('occupation-accordion');
const bodyAccordion = document.getElementById('body-accordion');
const exerciseAccordion = document.getElementById('exercise-accordion');

let step = 0;
let infoFieldIndex = 0;
let occupationFieldIndex = 0;
let bodyFieldIndex = 0;
let exerciseFieldIndex = 0;

function collapsePersonalInfoIfComplete() {
  if (infoFieldIndex < 0 || INFO_FIELDS[infoFieldIndex] !== 'emailConfirm') return false;
  const values = readForm();
  if (!infoSectionComplete(values)) return false;
  infoFieldIndex = -1;
  renderInfoAccordionState();
  updateStepNav();
  return true;
}

function workPhysicalLabel(id) {
  return QUESTIONNAIRE_JOB_OPTIONS.find((item) => item.id === id)?.label
    || WORK_PHYSICAL.find((item) => item.id === id)?.label || id || '—';
}

function workStressLabel(id) {
  return WORK_STRESS.find((item) => item.id === id)?.label || id || '—';
}

function fatSourceLabel(value) {
  if (value === 'dexa') return 'DEXA scan';
  if (value === 'recent') return 'Calipers / ultrasound / BodPod';
  if (value === 'guess') return 'Estimating';
  return '—';
}

function readForm() {
  const data = new FormData(form);
  const ageRaw = data.get('age');
  const age = ageRaw !== '' && ageRaw != null ? Number(ageRaw) : null;
  return {
    preferredName: String(data.get('preferredName') || '').trim(),
    email: String(data.get('email') || '').trim(),
    emailRetype: String(data.get('emailRetype') || '').trim(),
    phone: String(data.get('phone') || '').trim(),
    intakeDate: data.get('intakeDate'),
    heightFeet: data.get('heightFeet'),
    heightInchesPart: data.get('heightInchesPart'),
    sex: data.get('sex'),
    age,
    weight: data.get('weight'),
    fatSource: data.get('fatSource'),
    fatPercent: data.get('fatPercent'),
    workPhysical: data.get('workPhysical'),
    workStress: data.get('workStress'),
    weightTrainingHours: data.get('weightTrainingHours'),
    cardioHours: data.get('cardioHours'),
    fatBurningHours: data.get('fatBurningHours'),
    waiverAccepted: data.get('waiverAccepted') === 'on',
    signature: String(data.get('signature') || '').trim(),
    signatureDate: data.get('signatureDate'),
  };
}

function toOnboardingForm(values) {
  return {
    preferredName: values.preferredName,
    email: values.email,
    sex: values.sex,
    heightFeet: String(values.heightFeet || ''),
    heightInchesPart: String(values.heightInchesPart || ''),
    heightInches: '',
    age: values.age,
    birthDate: '',
    birthDateText: '',
    weightText: String(values.weight || ''),
    fatPercentText: String(values.fatPercent || ''),
    fatSource: values.fatSource,
    workPhysical: values.workPhysical,
    workStress: values.workStress,
    weightTrainingHours: values.weightTrainingHours,
    cardioHours: values.cardioHours,
    fatBurningHours: values.fatBurningHours,
    wakeTime: '06:00',
  };
}

function buildProgramFromValues(values) {
  return buildProgramPackage(toOnboardingForm(values), {
    label: '8-Week Burn & Build Program',
    meta: { source: 'desktop-questionnaire' },
  });
}

function infoFieldSummary(fieldId, values) {
  switch (fieldId) {
    case 'fullName':
      return values.preferredName || '';
    case 'sex':
      if (values.sex === 'female') return 'Female';
      if (values.sex === 'male') return 'Male';
      return '';
    case 'email':
      return values.email || '';
    case 'emailConfirm':
      if (!values.emailRetype) return '';
      if (values.email && values.emailRetype === values.email) return 'Matches';
      return values.emailRetype;
    default:
      return '';
  }
}

function validateInfoField(fieldId, values) {
  switch (fieldId) {
    case 'fullName':
      if (!values.preferredName) return 'Enter your full name.';
      return '';
    case 'sex':
      if (!values.sex) return 'Select female or male.';
      return '';
    case 'email':
      if (!values.email) return 'Enter your email address.';
      if (!isValidEmail(values.email)) return 'Enter a valid email address.';
      return '';
    case 'emailConfirm':
      if (!values.emailRetype) return 'Type your email address again.';
      if (!isValidEmail(values.emailRetype)) return 'Enter a valid email address.';
      if (values.email !== values.emailRetype) return 'Email addresses do not match. Type it again.';
      return '';
    default:
      return '';
  }
}

function infoFieldIsValid(fieldId, values) {
  return !validateInfoField(fieldId, values);
}

function infoSectionComplete(values) {
  return INFO_FIELDS.every((fieldId) => infoFieldIsValid(fieldId, values));
}

function setInfoFieldError(item, message) {
  const errorEl = item?.querySelector('.intake-acc__error');
  if (!errorEl) return;
  if (message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  } else {
    errorEl.textContent = '';
    errorEl.hidden = true;
  }
}

function renderInfoAccordionState() {
  if (!infoAccordion) return;
  const values = readForm();

  INFO_FIELDS.forEach((fieldId, index) => {
    const item = infoAccordion.querySelector(`[data-info-field="${fieldId}"]`);
    if (!item) return;

    const summary = item.querySelector('.intake-acc__summary');
    const trigger = item.querySelector('.intake-acc__trigger');
    const isOpen = infoFieldIndex >= 0 && index === infoFieldIndex;
    const isDone = infoFieldIsValid(fieldId, values);

    item.classList.toggle('is-open', isOpen);
    item.classList.toggle('is-done', isDone && !isOpen);

    if (summary) {
      const text = infoFieldSummary(fieldId, values);
      summary.textContent = text;
      summary.hidden = !text;
    }
    if (trigger) {
      trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      trigger.tabIndex = 0;
    }

    if (!isOpen) setInfoFieldError(item, '');
  });
}

function updateStepNav() {
  if (!stepNav) return;
  if (isDietCreationGated() && step === 0) {
    stepNav.hidden = true;
    return;
  }
  stepNav.hidden = false;
  if (stepBackBtn) stepBackBtn.disabled = step === 0;
  if (stepNextBtn) {
    stepNextBtn.textContent = step === panels.length - 1 ? 'Complete purchase →' : 'Next';
    stepNextBtn.disabled = step < panels.length - 1 && !canProceed(step);
  }
}

function initInfoFieldCopy() {
  if (!infoAccordion) return;
  INFO_FIELDS.forEach((fieldId) => {
    const item = infoAccordion.querySelector(`[data-info-field="${fieldId}"]`);
    const meta = INFO_FIELD_META[fieldId];
    if (!item || !meta) return;
    const question = item.querySelector('[data-info-question]');
    const guide = item.querySelector('[data-info-guide]');
    const example = item.querySelector('[data-info-example]');
    if (question) question.textContent = meta.question;
    if (guide) guide.textContent = meta.guide;
    if (example) example.textContent = meta.example;
  });
}

function advanceInfoField() {
  const fieldId = INFO_FIELDS[infoFieldIndex];
  const values = readForm();
  const item = infoAccordion?.querySelector(`[data-info-field="${fieldId}"]`);
  const error = validateInfoField(fieldId, values);
  if (error) {
    setInfoFieldError(item, error);
    return false;
  }

  setInfoFieldError(item, '');

  if (infoFieldIndex < INFO_FIELDS.length - 1) {
    openInfoField(infoFieldIndex + 1);
  } else {
    collapsePersonalInfoIfComplete() || renderInfoAccordionState();
  }

  updateStepNav();
  return true;
}

function openInfoField(index) {
  infoFieldIndex = Math.max(0, Math.min(index, INFO_FIELDS.length - 1));
  renderInfoAccordionState();
  const fieldId = INFO_FIELDS[infoFieldIndex];
  const item = infoAccordion?.querySelector(`[data-info-field="${fieldId}"]`);
  const focusTarget = item?.querySelector(
    'input:not([type="hidden"]):not([type="radio"]), select, textarea',
  ) || item?.querySelector('input[type="radio"]');
  focusTarget?.focus();
}

function bindInfoAccordion() {
  if (!infoAccordion) return;

  initInfoFieldCopy();

  infoAccordion.addEventListener('click', (event) => {
    const trigger = event.target.closest('.intake-acc__trigger');
    if (!trigger) return;
    const item = trigger.closest('[data-info-field]');
    if (!item) return;
    const fieldId = item.dataset.infoField;
    const index = INFO_FIELDS.indexOf(fieldId);
    if (index === -1) return;
    openInfoField(index);
  });

  infoAccordion.addEventListener('input', () => {
    renderInfoAccordionState();
    collapsePersonalInfoIfComplete();
  });

  infoAccordion.addEventListener('change', () => {
    renderInfoAccordionState();
    collapsePersonalInfoIfComplete();
  });

  infoAccordion.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.type === 'radio') return;
    event.preventDefault();
    advanceInfoField();
  });

  renderInfoAccordionState();
}

function occupationFieldSummary(fieldId, values) {
  switch (fieldId) {
    case 'workPhysical':
      return values.workPhysical ? workPhysicalLabel(values.workPhysical) : '';
    case 'workStress':
      return values.workStress ? workStressLabel(values.workStress) : '';
    default:
      return '';
  }
}

function validateOccupationField(fieldId, values) {
  switch (fieldId) {
    case 'workPhysical':
      if (!values.workPhysical) return 'Select how physically active your job is.';
      return '';
    case 'workStress':
      if (!values.workStress) return 'Select how draining a typical workday is.';
      return '';
    default:
      return '';
  }
}

function occupationFieldIsValid(fieldId, values) {
  return !validateOccupationField(fieldId, values);
}

function occupationSectionComplete(values) {
  return OCCUPATION_FIELDS.every((fieldId) => occupationFieldIsValid(fieldId, values));
}

function setOccupationFieldError(item, message) {
  const errorEl = item?.querySelector('.intake-acc__error');
  if (!errorEl) return;
  if (message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  } else {
    errorEl.textContent = '';
    errorEl.hidden = true;
  }
}

function renderOccupationAccordionState() {
  if (!occupationAccordion) return;
  const values = readForm();

  OCCUPATION_FIELDS.forEach((fieldId, index) => {
    const item = occupationAccordion.querySelector(`[data-occ-field="${fieldId}"]`);
    if (!item) return;

    const summary = item.querySelector('.intake-acc__summary');
    const trigger = item.querySelector('.intake-acc__trigger');
    const isOpen = occupationFieldIndex >= 0 && index === occupationFieldIndex;
    const isDone = occupationFieldIsValid(fieldId, values);

    item.classList.toggle('is-open', isOpen);
    item.classList.toggle('is-done', isDone && !isOpen);

    if (summary) {
      const text = occupationFieldSummary(fieldId, values);
      summary.textContent = text;
      summary.hidden = !text;
    }
    if (trigger) {
      trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      trigger.tabIndex = 0;
    }

    if (!isOpen) setOccupationFieldError(item, '');
  });
}

function initOccupationFieldCopy() {
  if (!occupationAccordion) return;
  OCCUPATION_FIELDS.forEach((fieldId) => {
    const item = occupationAccordion.querySelector(`[data-occ-field="${fieldId}"]`);
    const meta = OCCUPATION_FIELD_META[fieldId];
    if (!item || !meta) return;
    const label = item.querySelector('[data-occ-label]');
    const guide = item.querySelector('[data-occ-guide]');
    if (label) label.textContent = meta.question;
    if (guide) guide.textContent = meta.guide;

    const choices = OCCUPATION_CHOICE_COPY[fieldId];
    if (!choices) return;
    item.querySelectorAll('[data-occ-choice]').forEach((choiceEl) => {
      const choiceId = choiceEl.dataset.occChoice;
      const copy = choices[choiceId];
      if (!copy) return;
      const choiceLabel = choiceEl.querySelector('.intake-radio__label');
      const choiceSub = choiceEl.querySelector('.intake-radio__sub');
      if (choiceLabel) choiceLabel.textContent = copy.label;
      if (choiceSub) choiceSub.textContent = copy.sub;
    });
  });
}

function collapseOccupationIfComplete() {
  if (occupationFieldIndex < 0 || OCCUPATION_FIELDS[occupationFieldIndex] !== 'workStress') return false;
  const values = readForm();
  if (!occupationSectionComplete(values)) return false;
  occupationFieldIndex = -1;
  renderOccupationAccordionState();
  updateStepNav();
  return true;
}

function advanceOccupationField() {
  const fieldId = OCCUPATION_FIELDS[occupationFieldIndex];
  const values = readForm();
  const item = occupationAccordion?.querySelector(`[data-occ-field="${fieldId}"]`);
  const error = validateOccupationField(fieldId, values);
  if (error) {
    setOccupationFieldError(item, error);
    return false;
  }

  setOccupationFieldError(item, '');

  if (occupationFieldIndex < OCCUPATION_FIELDS.length - 1) {
    openOccupationField(occupationFieldIndex + 1);
  } else {
    collapseOccupationIfComplete() || renderOccupationAccordionState();
  }

  updateStepNav();
  return true;
}

function openOccupationField(index) {
  occupationFieldIndex = Math.max(0, Math.min(index, OCCUPATION_FIELDS.length - 1));
  renderOccupationAccordionState();
  const fieldId = OCCUPATION_FIELDS[occupationFieldIndex];
  const item = occupationAccordion?.querySelector(`[data-occ-field="${fieldId}"]`);
  const focusTarget = item?.querySelector('input[type="radio"]');
  focusTarget?.focus();
}

function bindOccupationAccordion() {
  if (!occupationAccordion) return;

  initOccupationFieldCopy();

  occupationAccordion.addEventListener('click', (event) => {
    const trigger = event.target.closest('.intake-acc__trigger');
    if (!trigger) return;
    const item = trigger.closest('[data-occ-field]');
    if (!item) return;
    const fieldId = item.dataset.occField;
    const index = OCCUPATION_FIELDS.indexOf(fieldId);
    if (index === -1) return;
    openOccupationField(index);
  });

  occupationAccordion.addEventListener('change', () => {
    renderOccupationAccordionState();
    if (occupationFieldIndex === 0 && occupationFieldIsValid('workPhysical', readForm())) {
      openOccupationField(1);
    } else {
      collapseOccupationIfComplete();
    }
    updateStepNav();
  });

  occupationAccordion.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.type === 'radio') return;
    event.preventDefault();
    advanceOccupationField();
  });

  renderOccupationAccordionState();
}

function bodyFieldSummary(fieldId, values) {
  switch (fieldId) {
    case 'height':
      return heightLabel(values) !== '—' ? heightLabel(values) : '';
    case 'weight':
      return values.weight ? `${values.weight} lbs` : '';
    case 'fatSource':
      return values.fatSource ? fatSourceLabel(values.fatSource) : '';
    case 'fatPercent':
      return values.fatPercent ? `${values.fatPercent}%` : '';
    default:
      return '';
  }
}

function validateBodyField(fieldId, values) {
  switch (fieldId) {
    case 'height': {
      const feet = values.heightFeet;
      const inches = values.heightInchesPart;
      if (feet === '' || feet == null) return 'Enter height in feet.';
      const feetNum = Number(feet);
      if (!Number.isFinite(feetNum) || feetNum < 4 || feetNum > 8) return 'Enter a realistic height in feet (4–8).';
      if (inches !== '' && inches != null) {
        const inchesNum = Number(inches);
        if (!Number.isFinite(inchesNum) || inchesNum < 0 || inchesNum > 11) return 'Inches must be 0–11.';
      }
      return '';
    }
    case 'weight': {
      const weight = Number(values.weight);
      if (!values.weight || !Number.isFinite(weight) || weight < 80 || weight > 500) {
        return 'Enter your weight in pounds.';
      }
      return '';
    }
    case 'fatSource':
      if (!values.fatSource) return 'Select how you know your body composition.';
      return '';
    case 'fatPercent': {
      const fat = Number(values.fatPercent);
      if (!values.fatPercent || !Number.isFinite(fat) || fat <= 0) {
        return 'Enter your body fat percentage.';
      }
      return '';
    }
    default:
      return '';
  }
}

function bodyFieldIsValid(fieldId, values) {
  return !validateBodyField(fieldId, values);
}

function bodySectionComplete(values) {
  return BODY_FIELDS.every((fieldId) => bodyFieldIsValid(fieldId, values));
}

function setBodyFieldError(item, message) {
  const errorEl = item?.querySelector('.intake-acc__error');
  if (!errorEl) return;
  if (message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  } else {
    errorEl.textContent = '';
    errorEl.hidden = true;
  }
}

function renderBodyAccordionState() {
  if (!bodyAccordion) return;
  const values = readForm();

  BODY_FIELDS.forEach((fieldId, index) => {
    const item = bodyAccordion.querySelector(`[data-body-field="${fieldId}"]`);
    if (!item) return;

    const summary = item.querySelector('.intake-acc__summary');
    const trigger = item.querySelector('.intake-acc__trigger');
    const isOpen = bodyFieldIndex >= 0 && index === bodyFieldIndex;
    const isDone = bodyFieldIsValid(fieldId, values);

    item.classList.toggle('is-open', isOpen);
    item.classList.toggle('is-done', isDone && !isOpen);

    if (summary) {
      const text = bodyFieldSummary(fieldId, values);
      summary.textContent = text;
      summary.hidden = !text;
    }
    if (trigger) {
      trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      trigger.tabIndex = 0;
    }

    if (!isOpen) setBodyFieldError(item, '');
  });
}

function initBodyFieldCopy() {
  if (!bodyAccordion) return;
  BODY_FIELDS.forEach((fieldId) => {
    const item = bodyAccordion.querySelector(`[data-body-field="${fieldId}"]`);
    const meta = BODY_FIELD_META[fieldId];
    if (!item || !meta) return;
    const label = item.querySelector('[data-body-label]');
    const guide = item.querySelector('[data-body-guide]');
    const example = item.querySelector('[data-body-example]');
    if (label) label.textContent = meta.question;
    if (guide) guide.textContent = meta.guide;
    if (example) example.textContent = meta.example;
  });
}

function collapseBodyIfComplete() {
  if (bodyFieldIndex < 0 || BODY_FIELDS[bodyFieldIndex] !== 'fatPercent') return false;
  const values = readForm();
  if (!bodySectionComplete(values)) return false;
  bodyFieldIndex = -1;
  renderBodyAccordionState();
  updateStepNav();
  return true;
}

function advanceBodyField() {
  const fieldId = BODY_FIELDS[bodyFieldIndex];
  const values = readForm();
  const item = bodyAccordion?.querySelector(`[data-body-field="${fieldId}"]`);
  const error = validateBodyField(fieldId, values);
  if (error) {
    setBodyFieldError(item, error);
    return false;
  }

  setBodyFieldError(item, '');

  if (bodyFieldIndex < BODY_FIELDS.length - 1) {
    openBodyField(bodyFieldIndex + 1);
  } else {
    collapseBodyIfComplete() || renderBodyAccordionState();
  }

  updateStepNav();
  return true;
}

function openBodyField(index) {
  bodyFieldIndex = Math.max(0, Math.min(index, BODY_FIELDS.length - 1));
  renderBodyAccordionState();
  const fieldId = BODY_FIELDS[bodyFieldIndex];
  const item = bodyAccordion?.querySelector(`[data-body-field="${fieldId}"]`);
  const focusTarget = item?.querySelector(
    'input:not([type="hidden"]):not([type="radio"]), select, textarea',
  ) || item?.querySelector('input[type="radio"]');
  focusTarget?.focus();
}

function bindBodyAccordion() {
  if (!bodyAccordion) return;

  initBodyFieldCopy();

  bodyAccordion.addEventListener('click', (event) => {
    const trigger = event.target.closest('.intake-acc__trigger');
    if (!trigger) return;
    const item = trigger.closest('[data-body-field]');
    if (!item) return;
    const fieldId = item.dataset.bodyField;
    const index = BODY_FIELDS.indexOf(fieldId);
    if (index === -1) return;
    openBodyField(index);
  });

  bodyAccordion.addEventListener('input', () => {
    renderBodyAccordionState();
    collapseBodyIfComplete();
    updateStepNav();
  });

  bodyAccordion.addEventListener('change', () => {
    renderBodyAccordionState();
    const values = readForm();
    if (bodyFieldIndex === 2 && bodyFieldIsValid('fatSource', values)) {
      openBodyField(3);
    } else {
      collapseBodyIfComplete();
    }
    updateStepNav();
  });

  bodyAccordion.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.type === 'radio') return;
    event.preventDefault();
    advanceBodyField();
  });

  renderBodyAccordionState();
}

function exerciseHoursValue(fieldId, values) {
  switch (fieldId) {
    case 'sag':
      return values.weightTrainingHours;
    case 'cardio':
      return values.cardioHours;
    case 'moderate':
      return values.fatBurningHours;
    default:
      return '';
  }
}

function exerciseFieldSummary(fieldId, values) {
  switch (fieldId) {
    case 'age':
      return values.age != null ? String(values.age) : '';
    case 'sag':
    case 'cardio':
    case 'moderate': {
      const hours = exerciseHoursValue(fieldId, values);
      return hours !== '' && hours != null ? `${hours} hrs` : '';
    }
    default:
      return '';
  }
}

function validateExerciseField(fieldId, values) {
  switch (fieldId) {
    case 'age': {
      const age = values.age;
      if (age == null || !Number.isFinite(age)) return 'Enter your age in years.';
      if (age < 16 || age > 99) return 'Enter an age between 16 and 99.';
      return '';
    }
    case 'sag':
    case 'cardio':
    case 'moderate': {
      const hoursRaw = exerciseHoursValue(fieldId, values);
      if (hoursRaw === '' || hoursRaw == null) return 'Enter hours per week (0 if none).';
      const hours = Number(hoursRaw);
      if (!Number.isFinite(hours) || hours < 0) return 'Enter a valid number of hours (0 or more).';
      return '';
    }
    default:
      return '';
  }
}

function exerciseFieldIsValid(fieldId, values) {
  return !validateExerciseField(fieldId, values);
}

function exerciseSectionComplete(values) {
  return EXERCISE_FIELDS.every((fieldId) => exerciseFieldIsValid(fieldId, values));
}

function setExerciseFieldError(item, message) {
  const errorEl = item?.querySelector('.intake-acc__error');
  if (!errorEl) return;
  if (message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  } else {
    errorEl.textContent = '';
    errorEl.hidden = true;
  }
}

function renderExerciseAccordionState() {
  if (!exerciseAccordion) return;
  const values = readForm();

  EXERCISE_FIELDS.forEach((fieldId, index) => {
    const item = exerciseAccordion.querySelector(`[data-ex-field="${fieldId}"]`);
    if (!item) return;

    const summary = item.querySelector('.intake-acc__summary');
    const trigger = item.querySelector('.intake-acc__trigger');
    const isOpen = exerciseFieldIndex >= 0 && index === exerciseFieldIndex;
    const isDone = exerciseFieldIsValid(fieldId, values);

    item.classList.toggle('is-open', isOpen);
    item.classList.toggle('is-done', isDone && !isOpen);

    if (summary) {
      const text = exerciseFieldSummary(fieldId, values);
      summary.textContent = text;
      summary.hidden = !text;
    }
    if (trigger) {
      trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      trigger.tabIndex = 0;
    }

    if (!isOpen) setExerciseFieldError(item, '');
  });
}

function initExerciseFieldCopy() {
  if (!exerciseAccordion) return;
  EXERCISE_FIELDS.forEach((fieldId) => {
    const item = exerciseAccordion.querySelector(`[data-ex-field="${fieldId}"]`);
    const meta = EXERCISE_FIELD_META[fieldId];
    if (!item || !meta) return;
    const label = item.querySelector('[data-ex-label]');
    const guide = item.querySelector('[data-ex-guide]');
    const example = item.querySelector('[data-ex-example]');
    if (label) label.textContent = meta.question;
    if (guide) guide.textContent = meta.guide;
    if (example) example.textContent = meta.example;
  });
}

function collapseExerciseIfComplete() {
  if (exerciseFieldIndex < 0 || EXERCISE_FIELDS[exerciseFieldIndex] !== 'moderate') return false;
  const values = readForm();
  if (!exerciseSectionComplete(values)) return false;
  exerciseFieldIndex = -1;
  renderExerciseAccordionState();
  updateStepNav();
  return true;
}

function advanceExerciseField() {
  const fieldId = EXERCISE_FIELDS[exerciseFieldIndex];
  const values = readForm();
  const item = exerciseAccordion?.querySelector(`[data-ex-field="${fieldId}"]`);
  const error = validateExerciseField(fieldId, values);
  if (error) {
    setExerciseFieldError(item, error);
    return false;
  }

  setExerciseFieldError(item, '');

  if (fieldId === 'age') {
    syncAgeField();
  }

  if (exerciseFieldIndex < EXERCISE_FIELDS.length - 1) {
    openExerciseField(exerciseFieldIndex + 1);
  } else {
    collapseExerciseIfComplete() || renderExerciseAccordionState();
  }

  updateStepNav();
  return true;
}

function openExerciseField(index) {
  exerciseFieldIndex = Math.max(0, Math.min(index, EXERCISE_FIELDS.length - 1));
  renderExerciseAccordionState();
  const fieldId = EXERCISE_FIELDS[exerciseFieldIndex];
  const item = exerciseAccordion?.querySelector(`[data-ex-field="${fieldId}"]`);
  const focusTarget = item?.querySelector(
    'input:not([type="hidden"]):not([type="radio"]), select, textarea',
  ) || item?.querySelector('input[type="radio"]');
  focusTarget?.focus();
}

function bindExerciseAccordion() {
  if (!exerciseAccordion) return;

  initExerciseFieldCopy();

  exerciseAccordion.addEventListener('click', (event) => {
    const trigger = event.target.closest('.intake-acc__trigger');
    if (!trigger) return;
    const item = trigger.closest('[data-ex-field]');
    if (!item) return;
    const fieldId = item.dataset.exField;
    const index = EXERCISE_FIELDS.indexOf(fieldId);
    if (index === -1) return;
    openExerciseField(index);
  });

  exerciseAccordion.addEventListener('input', () => {
    syncAgeField();
    renderExerciseAccordionState();
    collapseExerciseIfComplete();
    updateStepNav();
  });

  exerciseAccordion.addEventListener('change', () => {
    syncAgeField();
    renderExerciseAccordionState();
    collapseExerciseIfComplete();
    updateStepNav();
  });

  exerciseAccordion.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.type === 'radio') return;
    event.preventDefault();
    advanceExerciseField();
  });

  renderExerciseAccordionState();
}

function syncAgeField() {
  const ageInput = form.elements.age;
  const age = ageInput?.value !== '' && ageInput?.value != null ? Number(ageInput.value) : null;
  syncHeartRateHints(Number.isFinite(age) ? age : null);
}

function syncHeartRateHints(age) {
  if (!age) return;
  const hr = heartRates(age);
  const cardio = document.querySelector('[data-hr-cardio]');
  const fat = document.querySelector('[data-hr-fat]');
  if (cardio) cardio.textContent = `Target zone ${hr.cardioLow}–${hr.cardioHigh} BPM`;
  if (fat) fat.textContent = `Target zone ${hr.fatBurnLow}–${hr.fatBurnHigh} BPM`;
}

function heightLabel(values) {
  const feet = values.heightFeet;
  const inches = values.heightInchesPart;
  if (!feet && !inches) return '—';
  return `${feet || 0}'${inches || 0}"`;
}

function canProceed(stepIndex) {
  const values = readForm();
  switch (stepIndex) {
    case 0:
      return true;
    case 1:
      return infoSectionComplete(values);
    case 2:
      return occupationSectionComplete(values);
    case 3:
      return exerciseSectionComplete(values);
    case 4:
      return bodySectionComplete(values);
    case 5:
      return values.waiverAccepted && values.signature;
    default:
      return true;
  }
}

function renderNav() {
  navList.innerHTML = STEPS.map((item, index) => {
    const reachable = canReachStep(index);
    const classes = [
      'q-nav__item',
      index === step ? 'is-active' : '',
      index < step ? 'is-done' : '',
      reachable && index !== step ? 'is-reachable' : '',
    ].filter(Boolean).join(' ');
    return `
    <li>
      <button type="button" class="${classes}" data-nav-step="${index}"${reachable ? '' : ' disabled'}>
        ${index + 1}. ${item.label}
      </button>
    </li>
  `;
  }).join('');
}

function renderReview() {
  const values = readForm();
  let program = null;
  try {
    program = buildProgramFromValues(values);
  } catch (error) {
    console.error(error);
  }

  const rows = [
    ['Name', values.preferredName || '—'],
    ['Email', values.email || '—'],
    ['Height', heightLabel(values)],
    ['Gender', values.sex || '—'],
    ['Age', values.age != null ? String(values.age) : '—'],
    ['Weight', values.weight ? `${values.weight} lbs` : '—'],
    ['Body composition', values.fatPercent ? `${values.fatPercent}% (${fatSourceLabel(values.fatSource)})` : '—'],
    ['Job activity', workPhysicalLabel(values.workPhysical)],
    ['Day drain', workStressLabel(values.workStress)],
    ['SAG hours / week', values.weightTrainingHours || '—'],
    ['Vigorous hours / week', values.cardioHours || '—'],
    ['Moderate hours / week', values.fatBurningHours || '—'],
    ['Waiver signed', values.signature || '—'],
  ];

  if (program?.intake) {
    rows.push(['Lean body mass', `${program.intake.leanBodyMass.toFixed(1)} lbs`]);
  }

  reviewEl.innerHTML = rows.map(([label, value]) => `
    <div><dt>${label}</dt><dd>${value}</dd></div>
  `).join('');
}

function canReachStep(target) {
  if (target < 0 || target >= panels.length) return false;
  if (target <= step) return true;
  for (let i = 0; i < target; i += 1) {
    if (!canProceed(i)) return false;
  }
  return true;
}

function showStep(index) {
  step = Math.max(0, Math.min(index, panels.length - 1));
  panels.forEach((panel, i) => {
    panel.hidden = i !== step;
  });
  renderNav();
  if (step === 6) renderReview();
  if (step === 1) renderInfoAccordionState();
  if (step === 2) {
    if (occupationFieldIndex < 0 && !occupationSectionComplete(readForm())) {
      occupationFieldIndex = 0;
    }
    renderOccupationAccordionState();
  }
  if (step === 4) {
    if (bodyFieldIndex < 0 && !bodySectionComplete(readForm())) {
      bodyFieldIndex = 0;
    }
    renderBodyAccordionState();
  }
  if (step === 3) {
    if (exerciseFieldIndex < 0 && !exerciseSectionComplete(readForm())) {
      exerciseFieldIndex = 0;
    }
    renderExerciseAccordionState();
    syncAgeField();
  }
  updateStepNav();

  const base = `${location.pathname}${location.search}`;
  if (step === 0) {
    history.replaceState(null, '', `${base}#welcome`);
  } else if (location.hash === '#welcome') {
    history.replaceState(null, '', base);
  }
}

function initDefaults() {
  const today = new Date().toISOString().slice(0, 10);
  if (form.elements.intakeDate) {
    form.elements.intakeDate.value = today;
  }
  if (form.elements.signatureDate && !form.elements.signatureDate.value) {
    form.elements.signatureDate.value = today;
  }
  if (form.elements.fatBurningHours && !form.elements.fatBurningHours.value) {
    form.elements.fatBurningHours.value = '3';
  }
}

function bindEvents() {
  if (!form || !navList) {
    throw new Error('Questionnaire markup is missing required elements.');
  }

  bindInfoAccordion();
  bindOccupationAccordion();
  bindBodyAccordion();
  bindExerciseAccordion();

  navList.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-nav-step]');
    if (!btn) return;
    const target = Number(btn.dataset.navStep);
    if (!canReachStep(target)) return;
    showStep(target);
  });

  form.addEventListener('input', () => {
    syncAgeField();
    updateStepNav();
  });

  form.addEventListener('change', () => {
    syncAgeField();
    updateStepNav();
  });

  stepBackBtn?.addEventListener('click', () => {
    if (step > 0) showStep(step - 1);
  });

  stepNextBtn?.addEventListener('click', () => {
    if (step === panels.length - 1) {
      submitCheckout(stepNextBtn);
      return;
    }
    if (!canProceed(step)) return;
    showStep(step + 1);
  });

  window.addEventListener('hashchange', () => {
    if (location.hash === '#welcome' && step !== 0) showStep(0);
  });
}

async function submitCheckout(triggerBtn) {
  const values = readForm();
  if (!canProceed(5)) return;

  const email = String(values.email || '').trim();
  if (!isValidEmail(email)) {
    window.alert('Enter a valid email address before continuing.');
    showStep(1);
    return;
  }

  if (!triggerBtn) return;
  triggerBtn.disabled = true;
  const prevLabel = triggerBtn.textContent;
  triggerBtn.textContent = 'Opening checkout…';

  try {
    const program = buildProgramFromValues(values);
    persistAppEmail(email);
    persistProgramBridge(program);
    sessionStorage.setItem('bnb_creator_phase', 'plan-ready');

    const saved = await saveProgramToServer(email, program);
    if (!saved.ok) {
      window.alert(saved.message || 'Could not save your plan. Check your connection and try again.');
      triggerBtn.disabled = false;
      triggerBtn.textContent = prevLabel;
      updateStepNav();
      return;
    }
    if (saved.programId && program.program) {
      program.program.id = saved.programId;
      persistProgramBridge(program);
    }

    window.location.href = withDietCreationTestParam(CREATOR_CHECKOUT_URL);
  } catch (error) {
    console.error(error);
    window.alert('Could not build your program. Check your answers and try again.');
    triggerBtn.disabled = false;
    triggerBtn.textContent = prevLabel;
    updateStepNav();
  }
}

function restoreWelcomePanel() {
  const panel = document.querySelector('.q-panel[data-step="0"]');
  if (!panel) return;
  panel.innerHTML = `
    <div class="q-panel__head">
      <p class="q-eyebrow">Welcome</p>
      <h2 class="q-panel__title">You&rsquo;re in the right place</h2>
      <p class="q-panel__lead">
        You tapped <strong>Create Your Diet</strong> — this is where your program starts.
        About 10 minutes of intake, then the Burn Engine builds your servings and full program.
      </p>
    </div>
    <div class="q-callout">
      <span class="q-callout__icon" aria-hidden="true">!</span>
      <div class="q-callout__body">
        <strong>Before you start, have these ready:</strong>
        <ul>
          <li>Your <strong>email</strong> — you will use it to open your program after checkout.</li>
          <li><strong>Scale weight</strong> in pounds (morning weight, before eating, is best).</li>
          <li><strong>Body fat percentage</strong> from a DEXA scan, calipers, BodPod, or ultrasound if you have one. If not, you can estimate — we explain how on that step.</li>
          <li>A honest count of the <strong>exercise you will actually do</strong> for the next 8 weeks — not your best week ever.</li>
        </ul>
      </div>
    </div>
    <p class="q-hint">Every question affects your servings and projections. When in doubt, choose the conservative answer — you can build a new program later with updated numbers.</p>
    <div class="q-intro-actions">
      <a class="q-btn q-btn--ghost" href="${kwarnerPreviewPdfUrl()}" target="_blank" rel="noopener">Preview sample PDF</a>
    </div>
    <p class="q-intro-price">$149 one-time purchase · own your program forever</p>
  `;
}

function restoreQuestionnaireChrome() {
  document.body.classList.add('q-app--workroom');
  document.querySelector('.q-app')?.classList.add('q-app--workroom');
  const title = document.querySelector('.q-title');
  const tag = document.querySelector('.q-tag');
  if (title) title.textContent = 'Intake form';
  if (tag) tag.textContent = 'Burn & Build program questionnaire';
  tag?.classList.remove('q-tag--gold');
  restoreWelcomePanel();
}

function showBootError(message) {
  const main = document.querySelector('.q-main');
  if (!main) return;
  const panel = document.querySelector('.q-panel[data-step="0"]');
  if (panel) panel.hidden = false;
  const note = document.createElement('p');
  note.className = 'q-boot-error';
  note.textContent = message;
  main.prepend(note);
}

function boot() {
  try {
    if (isDietCreationGated()) {
      showStep(0);
      return;
    }
    restoreQuestionnaireChrome();
    bindEvents();
    initDefaults();
    syncAgeField();
    showStep(0);
  } catch (error) {
    console.error(error);
    showBootError('Could not start the questionnaire. Hard refresh and try again.');
  }
}

boot();
