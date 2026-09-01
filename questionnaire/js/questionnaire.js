import {
  heartRates,
  WORK_PHYSICAL,
  WORK_STRESS,
  JOB_ACTIVITY_OPTIONS,
} from '../../js/profileDataEngine.js';
import { buildProgramPackage, localDateKey } from '../../js/programPackageData.js';
import {
  buildAnswersConfirmationRows,
  formatAnswersConfirmationLabel,
} from '../../js/answersConfirmationPrintout.js';
import { FAT_SOURCE_OPTIONS, formatFatSourceLabel } from '../../js/leanBodyAnalysisPrintout.js';
import { INTAKE_FIELD_QUESTIONS } from '../../js/intakeQuestionCopyData.js';
import { validateAthleteAge } from '../../js/athleteAgeData.js';
import { persistProgramBridge } from '../../js/programBridgeHandoff.js';
import { persistAppEmail } from '../../js/programApi.js';
import {
  clearQuestionnaireDraft,
  loadQuestionnaireDraft,
  saveQuestionnaireDraft,
} from '../../js/questionnaireDraftHelpers.js';
import {
  initQuestionnaireMobileNav,
  isMobileNav,
  refreshQuestionnaireMobileNavLayout,
} from '../../js/questionnaireMobileNavHelpers.js';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

const STEPS = [
  { id: 'start', label: 'Contact Information' },
  { id: 'work', label: 'Occupation' },
  { id: 'exercise', label: 'Exercise' },
  { id: 'body', label: 'Body composition' },
  { id: 'waiver', label: 'Agreement' },
  { id: 'review', label: 'Review' },
];

const MOBILE_STEP_LABELS = [
  'About You',
  'Occupation',
  'Exercise',
  'Body Composition',
  'Agreement',
  'Review',
];

const STEP_HEADINGS = [
  'Contact Information',
  'Occupation',
  'Exercise',
  'Body composition',
  'Waiver (please read and sign)',
  'Review & continue',
];

const STEP_HEADING_NOTES = {
  5: 'Confirm your answers, then continue to secure checkout ($279). Use Back below to fix anything.',
};

const INFO_FIELDS = [
  'preferredName',
  'sex',
  'email',
  'emailConfirm',
  'referrerName',
];

const INFO_FIELD_META = {
  preferredName: {
    question: INTAKE_FIELD_QUESTIONS.preferredName,
    guide: 'First and last name as it should appear on your program printout.',
    example: 'Example: Kory Edwards',
  },
  sex: {
    question: INTAKE_FIELD_QUESTIONS.sex,
    guide: 'Select the option used in the calorie formulas.',
    example: 'Example: Male or Female',
  },
  email: {
    question: INTAKE_FIELD_QUESTIONS.email,
    guide: 'We deliver your program here and use it to unlock your program after purchase.',
    example: 'Example: you@email.com',
  },
  emailConfirm: {
    question: INTAKE_FIELD_QUESTIONS.emailConfirm,
    guide: 'Type the same address again. We cannot fix a typo after checkout.',
    example: 'Must match the email you just entered.',
  },
  referrerName: {
    question: INTAKE_FIELD_QUESTIONS.referrerName,
    guide: 'If someone sent you here, enter their full name so we can thank them. Leave blank if you found us on your own.',
    example: 'Example: Jane Smith',
  },
};

const EXERCISE_FIELDS = [
  'age',
  'weightTrainingHours',
  'cardioHours',
  'fatBurningHours',
];

const EXERCISE_HOURS_BREAKDOWN = 'Enter hours in decimals: 0.25 = 15 min, 0.5 = 30 min, 0.75 = 45 min, 1.25 = 1 hr 15 min.';

const EXERCISE_FIELD_META = {
  age: {
    question: INTAKE_FIELD_QUESTIONS.age,
    guide: 'Your age is used to calculate your cardio training range and your fat burning training range. Enter your age in whole years.',
    hint: 'Example: 45',
    sub: 'Example: 45',
  },
  weightTrainingHours: {
    question: INTAKE_FIELD_QUESTIONS.weightTrainingHours,
    guide: 'Plan for what you will actually do for the next 8 weeks — not what you wish you would do. Count only time moving or under load — not rest between sets, scrolling on the treadmill, or driving to the gym.',
    hint: 'Count actual time exercising, not total time at the gym.',
    sub: 'Weight training, CrossFit, racquet sports, intervals — work bursts with rest. Three 1-hour sessions with ~45 min of actual lifting = about 2.25 hrs, not 3. Enter 0 if none.',
  },
  cardioHours: {
    question: INTAKE_FIELD_QUESTIONS.cardioHours,
    guide: 'Sustained cardio where your heart rate stays in your cardio training range. Use the cardio training range (BPM) shown below as a guideline.',
    hint: 'Running, cycling hard, rowing, stair climbing — not a casual walk. Enter 0 if none.',
    sub: 'Running, cycling hard, rowing, stair climbing — not a casual walk. Enter 0 if none. Overstating exercise lowers your fat servings and makes the plan harder to follow.',
  },
  fatBurningHours: {
    question: INTAKE_FIELD_QUESTIONS.fatBurningHours,
    guide: 'A lower heart rate for a longer period of time actually burns more fat calories per minute. Not to be confused with total calories, which are carbs and fat combined. Use the fat burning training range (BPM) shown below as a guideline.',
    hint: '3 hrs/week is typical — about 30 minutes a day. Enter 0 if none.',
    sub: 'Brisk walking, easy bike, groceries, lawn work, dog walking, etc. 3 hrs/week is typical — about 30 minutes a day. Lower it if that is not realistic for you. Enter 0 if none.',
  },
};

const BODY_FIELDS = [
  'height',
  'totalWeight',
  'fatPercent',
  'fatSource',
];

const BODY_FIELD_META = {
  height: {
    question: INTAKE_FIELD_QUESTIONS.height,
    guide: 'Enter feet and inches in separate boxes.',
    example: 'Example: 5 ft 10 in (enter 5 and 10)',
  },
  totalWeight: {
    question: INTAKE_FIELD_QUESTIONS.totalWeight,
    guide: 'Morning weight in pounds, before eating, after bathroom, same scale each time.',
    example: 'Example: 168 lbs',
    alert: 'Your weight and your body composition are used to determine your LBM. LBM, predominantly muscle, is your metabolism. A five pound error in LBM mass will be a one serving difference in daily protein servings. Just a reminder here. You\'re paying $279 for this program. The program will only be as beneficial as your answers are accurate.',
  },
  fatSource: {
    question: INTAKE_FIELD_QUESTIONS.fatSource,
    guide: 'Your food plan is built from lean body mass (weight minus fat). Wrong body fat % = wrong servings from day one. Pick the most accurate source you actually have — not the one you wish you had.',
    example: 'Listed least to most involved: I\'m estimating · smart scales · tape measurements · InBody/BIA · 3D scanning (Styku and Fit3D) · calipers · Bod Pod · DEXA · hydrostatic weighing.',
  },
  fatPercent: {
    question: INTAKE_FIELD_QUESTIONS.fatPercent,
    guide: 'Enter body fat as a percentage (not BMI). One decimal is fine — e.g. 24.5. A professional test is worth it if you can get one.',
    example: 'Rough reference if you are estimating: many men fall 18–28%; many women 25–35%. When unsure, estimate slightly higher rather than lower. Options: DEXA at a clinic, BodPod or calipers at a gym, or a coach/trainer measurement.',
  },
};

const OCCUPATION_FIELDS = [
  'workPhysical',
  'workStress',
];

/** Accordion field order — single continuous question numbering across intake steps. */
const INTAKE_QUESTION_SECTIONS = [
  { accordionId: 'info-accordion', attr: 'data-info-field', fields: INFO_FIELDS },
  { accordionId: 'occupation-accordion', attr: 'data-occ-field', fields: OCCUPATION_FIELDS },
  { accordionId: 'exercise-accordion', attr: 'data-ex-field', fields: EXERCISE_FIELDS },
  { accordionId: 'body-accordion', attr: 'data-body-field', fields: BODY_FIELDS },
];

const WAIVER_QUESTION_NUM_SELECTORS = [
  '#athlete-waiver-block .intake-waiver__cell--signed .intake-acc__num',
  '#athlete-waiver-block .intake-waiver__cell--date .intake-acc__num',
];

function syncIntakeQuestionNumbers() {
  let n = 1;
  INTAKE_QUESTION_SECTIONS.forEach(({ accordionId, attr, fields }) => {
    const root = document.getElementById(accordionId);
    if (!root) return;
    fields.forEach((fieldId) => {
      const item = root.querySelector(`[${attr}="${fieldId}"]`);
      if (!item) return;
      item.dataset.questionNumber = String(n);
      item.querySelectorAll('.intake-acc__num').forEach((numEl) => {
        numEl.textContent = String(n);
      });
      n += 1;
    });
  });
  WAIVER_QUESTION_NUM_SELECTORS.forEach((selector) => {
    const numEl = document.querySelector(selector);
    if (!numEl) return;
    numEl.textContent = String(n);
    numEl.closest('.intake-waiver__cell')?.setAttribute('data-question-number', String(n));
    n += 1;
  });
}

function populateAccFieldCopy(item, meta, { hintFrom = 'guide', detailFrom = 'sub' } = {}) {
  if (!item || !meta) return;
  const label = item.querySelector('[data-acc-label]');
  const question = item.querySelector('[data-acc-question]');
  const hint = item.querySelector('[data-acc-hint]');
  const guide = item.querySelector('[data-acc-guide]');
  const detail = item.querySelector('[data-acc-detail]');
  const example = item.querySelector('[data-acc-example]');
  const alert = item.querySelector('[data-acc-alert]');
  const hoursNote = item.querySelector('[data-acc-hours-note]');

  if (label) label.textContent = meta.question;
  if (question) question.textContent = meta.question;
  if (hint) hint.textContent = meta.hint || meta[hintFrom] || '';
  if (guide) guide.textContent = meta.guide || '';
  if (detail) detail.textContent = meta[detailFrom] || '';
  if (example) example.textContent = meta.example || '';
  if (alert) {
    if (meta.alert) {
      alert.textContent = meta.alert;
      alert.hidden = false;
    } else {
      alert.textContent = '';
      alert.hidden = true;
    }
  }
  if (hoursNote && meta.hoursNote) hoursNote.textContent = meta.hoursNote;

  syncAccMoreInfoVisibility(item);
}

function syncAccMoreInfoVisibility(item) {
  const more = item?.querySelector('.intake-acc__more');
  const panel = item?.querySelector('[data-acc-more-panel]');
  if (!more) return;
  if (!panel) {
    more.hidden = true;
    return;
  }
  const hasContent = [...panel.children].some((el) => {
    if (el.hidden) return false;
    return String(el.textContent || '').trim().length > 0;
  });
  more.hidden = !hasContent;
}

function bindAccordionMoreInfo(root) {
  if (!root) return;

  root.addEventListener('click', (event) => {
    const toggle = event.target.closest('[data-acc-more-toggle]');
    if (!toggle) return;
    const item = toggle.closest('.intake-acc__item');
    const panel = item?.querySelector('[data-acc-more-panel]');
    if (!panel) return;
    const opening = panel.hidden;
    toggle.setAttribute('aria-expanded', opening ? 'true' : 'false');
    panel.hidden = !opening;
  });
}

const OCCUPATION_FIELD_META = {
  workPhysical: {
    question: INTAKE_FIELD_QUESTIONS.workPhysical,
    guide: 'Most people work 40–48 hours a week. That is a lot of time — your job activity affects how many servings you need every day. Pick what describes most workdays, not your hardest day.',
  },
  workStress: {
    question: INTAKE_FIELD_QUESTIONS.workStress,
    guide: 'Kids, soccer, errands, caregiving — the normal rhythm of your life when you\'re not at work and not exercising.',
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
      sub: 'Manageable pace — time for recovery and the normal rhythm of life outside work and training.',
    },
    busy: {
      label: 'Busy',
      sub: 'Kids, sports, errands, and obligations most days — a full schedule you generally keep up with.',
    },
    stressful: {
      label: 'Stressful',
      sub: 'High demand most weeks — caregiving, tight schedules, little margin when things pile up.',
    },
  },
};

const form = document.getElementById('q-form');
const introGateEl = document.getElementById('q-intro-gate');
const questionnaireShellEl = document.getElementById('q-questionnaire');
const mobileProgressLabelEl = document.getElementById('q-mobile-progress-label');
const mobileProgressTrackEl = document.getElementById('q-mobile-progress-track');
const mobileProgressFillEl = document.getElementById('q-mobile-progress-fill');
const stepHeadingEl = document.getElementById('q-step-heading');
const stepHeadingNoteEl = document.getElementById('q-step-heading-note');
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
let questionnaireStarted = false;
let programBuilt = false;
let infoFieldIndex = 0;
let occupationFieldIndex = 0;
let bodyFieldIndex = 0;
let exerciseFieldIndex = 0;
let draftSaveTimer = null;
let draftRestoreActive = false;

const DRAFT_SAVE_DEBOUNCE_MS = 400;

function focusFieldIfAllowed(el) {
  if (!el || isMobileNav()) return;
  el.focus();
}

function accordionItemFocusables(item) {
  if (!item?.classList.contains('is-open')) return [];
  const panel = item.querySelector('.intake-acc__panel');
  if (!panel) return [];
  return [...panel.querySelectorAll(
    'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button.intake-info-btn:not([disabled])',
  )].filter((el) => el.getClientRects().length > 0);
}

function setAccordionTriggerTabOrder(trigger) {
  if (!trigger) return;
  trigger.tabIndex = -1;
}

function bindAccordionTabFlow({
  accordion,
  fields,
  fieldAttr,
  getIndex,
  openField,
}) {
  if (!accordion) return;

  accordion.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const index = getIndex();
    if (index < 0) return;

    const fieldId = fields[index];
    const item = accordion.querySelector(`[${fieldAttr}="${fieldId}"]`);
    const focusables = accordionItemFocusables(item);
    if (!focusables.length) return;

    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || !focusables.includes(active)) return;

    if (!event.shiftKey && active === focusables[focusables.length - 1] && index < fields.length - 1) {
      event.preventDefault();
      openField(index + 1);
      return;
    }

    if (event.shiftKey && active === focusables[0] && index > 0) {
      event.preventDefault();
      openField(index - 1);
      const prevItem = accordion.querySelector(`[${fieldAttr}="${fields[index - 1]}"]`);
      const prevFocusables = accordionItemFocusables(prevItem);
      focusFieldIfAllowed(prevFocusables[prevFocusables.length - 1]);
    }
  });
}

function collapsePersonalInfoIfComplete() {
  const lastField = INFO_FIELDS[INFO_FIELDS.length - 1];
  if (infoFieldIndex < 0 || INFO_FIELDS[infoFieldIndex] !== lastField) return false;
  const values = readForm();
  if (!infoSectionComplete(values)) return false;
  infoFieldIndex = -1;
  renderInfoAccordionState();
  updateStepNav();
  return true;
}

function maybeAdvanceInfoField(values = readForm()) {
  if (infoFieldIndex < 0) return;
  const fieldId = INFO_FIELDS[infoFieldIndex];
  if (!infoFieldIsValid(fieldId, values)) return;

  if (fieldId === 'sex' && infoFieldIndex < INFO_FIELDS.length - 1) {
    openInfoField(infoFieldIndex + 1);
    return;
  }

  if (fieldId === 'emailConfirm' && infoFieldIndex < INFO_FIELDS.length - 1) {
    openInfoField(infoFieldIndex + 1);
  }
}

let infoAccordionRenderQueued = false;
function scheduleInfoAccordionRender(advanceAfter = false) {
  if (infoAccordionRenderQueued) return;
  infoAccordionRenderQueued = true;
  requestAnimationFrame(() => {
    infoAccordionRenderQueued = false;
    const values = readForm();
    renderInfoAccordionState();
    if (advanceAfter) maybeAdvanceInfoField(values);
  });
}

function workPhysicalLabel(id) {
  return JOB_ACTIVITY_OPTIONS.find((item) => item.id === id)?.label
    || WORK_PHYSICAL.find((item) => item.id === id)?.label || id || '—';
}

function workStressLabel(id) {
  return WORK_STRESS.find((item) => item.id === id)?.label || id || '—';
}

function initFatSourceRadios() {
  const container = document.getElementById('fat-source-radios');
  if (!container) return;
  container.innerHTML = FAT_SOURCE_OPTIONS.map((option, index) => `
    <label class="intake-radio">
      <input type="radio" name="fatSource" value="${option.value}"${index === 0 ? ' required' : ''} />
      ${option.label}
    </label>
  `).join('');
}

function readForm() {
  const data = new FormData(form);
  const ageRaw = data.get('age');
  const age = ageRaw !== '' && ageRaw != null ? Number(ageRaw) : null;
  return {
    preferredName: String(data.get('preferredName') || '').trim(),
    referrerName: String(data.get('referrerName') || '').trim(),
    email: String(data.get('email') || '').trim(),
    emailConfirm: String(data.get('emailConfirm') || '').trim(),
    phone: String(data.get('phone') || '').trim(),
    intakeDate: data.get('intakeDate'),
    heightFeet: data.get('heightFeet'),
    heightInchesPart: data.get('heightInchesPart'),
    sex: data.get('sex'),
    age,
    totalWeight: data.get('totalWeight'),
    fatSource: data.get('fatSource'),
    fatSourceOther: String(data.get('fatSourceOther') || '').trim(),
    fatPercent: data.get('fatPercent'),
    workPhysical: data.get('workPhysical'),
    workStress: data.get('workStress'),
    weightTrainingHours: data.get('weightTrainingHours'),
    cardioHours: data.get('cardioHours'),
    fatBurningHours: data.get('fatBurningHours'),
    waiverAccepted: Boolean(String(data.get('signature') || '').trim()),
    signature: String(data.get('signature') || '').trim(),
    signatureDate: data.get('signatureDate'),
  };
}

function restoreFieldIndex(index, length) {
  const n = Number(index);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return -1;
  return Math.max(0, Math.min(n, length - 1));
}

function restoreStepIndex(index) {
  const n = Number(index);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(n, panels.length - 1));
}

function setFormControlValue(name, value) {
  const el = form.elements[name];
  if (!el) return;

  if (el instanceof RadioNodeList) {
    const selected = value == null ? '' : String(value);
    [...el].forEach((radio) => {
      radio.checked = radio.value === selected;
    });
    return;
  }

  if (el.type === 'checkbox') {
    el.checked = Boolean(value);
    return;
  }

  el.value = value == null ? '' : String(value);
}

function writeFormValues(values) {
  if (!values) return;

  setFormControlValue('preferredName', values.preferredName);
  setFormControlValue('referrerName', values.referrerName);
  setFormControlValue('email', values.email);
  setFormControlValue('emailConfirm', values.emailConfirm);
  setFormControlValue('phone', values.phone);
  setFormControlValue('intakeDate', values.intakeDate);
  setFormControlValue('heightFeet', values.heightFeet);
  setFormControlValue('heightInchesPart', values.heightInchesPart);
  setFormControlValue('sex', values.sex);
  setFormControlValue('age', values.age == null ? '' : values.age);
  setFormControlValue('totalWeight', values.totalWeight);
  setFormControlValue('fatSource', values.fatSource);
  setFormControlValue('fatSourceOther', values.fatSourceOther);
  setFormControlValue('fatPercent', values.fatPercent);
  setFormControlValue('workPhysical', values.workPhysical);
  setFormControlValue('workStress', values.workStress);
  setFormControlValue('weightTrainingHours', values.weightTrainingHours);
  setFormControlValue('cardioHours', values.cardioHours);
  setFormControlValue('fatBurningHours', values.fatBurningHours);
  setFormControlValue('signature', values.signature);
  setFormControlValue('signatureDate', values.signatureDate);

  syncFatSourceOtherField();
}

function draftHasQuestionnaireProgress(draft) {
  if (!draft) return false;
  if (draft.started) return true;
  if (Number(draft.step) > 0) return true;
  const values = draft.values || {};
  return Boolean(
    String(values.preferredName || '').trim()
    || String(values.email || '').trim()
    || String(values.sex || '').trim(),
  );
}

function buildQuestionnaireDraftSnapshot() {
  return {
    started: questionnaireStarted,
    step,
    infoFieldIndex,
    occupationFieldIndex,
    bodyFieldIndex,
    exerciseFieldIndex,
    values: readForm(),
  };
}

function scheduleQuestionnaireDraftSave() {
  if (draftRestoreActive || !questionnaireStarted) return;
  if (draftSaveTimer) clearTimeout(draftSaveTimer);
  draftSaveTimer = setTimeout(() => {
    draftSaveTimer = null;
    saveQuestionnaireDraft(buildQuestionnaireDraftSnapshot());
  }, DRAFT_SAVE_DEBOUNCE_MS);
}

function tryRestoreQuestionnaireDraft() {
  const draft = loadQuestionnaireDraft();
  if (!draft?.values || !draftHasQuestionnaireProgress(draft)) return false;

  draftRestoreActive = true;
  questionnaireStarted = true;
  showQuestionnaireShell();
  writeFormValues(draft.values);

  infoFieldIndex = restoreFieldIndex(draft.infoFieldIndex, INFO_FIELDS.length);
  occupationFieldIndex = restoreFieldIndex(draft.occupationFieldIndex, OCCUPATION_FIELDS.length);
  bodyFieldIndex = restoreFieldIndex(draft.bodyFieldIndex, BODY_FIELDS.length);
  exerciseFieldIndex = restoreFieldIndex(draft.exerciseFieldIndex, EXERCISE_FIELDS.length);

  syncAgeField();
  showStep(restoreStepIndex(draft.step));
  draftRestoreActive = false;
  scheduleQuestionnaireDraftSave();
  return true;
}

function toOnboardingForm(values) {
  return {
    preferredName: values.preferredName,
    referrerName: values.referrerName,
    email: values.email,
    sex: values.sex,
    heightFeet: String(values.heightFeet || ''),
    heightInchesPart: String(values.heightInchesPart || ''),
    heightInches: '',
    age: values.age,
    birthDate: '',
    birthDateText: '',
    weightText: String(values.totalWeight || ''),
    fatPercentText: String(values.fatPercent || ''),
    fatSource: values.fatSource,
    fatSourceOther: values.fatSource === 'other' ? values.fatSourceOther : '',
    workPhysical: values.workPhysical,
    workStress: values.workStress,
    weightTrainingHours: values.weightTrainingHours,
    cardioHours: values.cardioHours,
    fatBurningHours: values.fatBurningHours,
    wakeTime: '06:00',
    waiverSignature: values.signature,
    waiverSignedDate: values.signatureDate,
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
    case 'preferredName':
      return values.preferredName || '';
    case 'sex':
      if (values.sex === 'female') return 'Female';
      if (values.sex === 'male') return 'Male';
      return '';
    case 'email':
      return values.email || '';
    case 'emailConfirm':
      if (!values.emailConfirm) return '';
      if (values.email && values.emailConfirm === values.email) return 'Matches';
      return values.emailConfirm;
    case 'referrerName':
      return values.referrerName || '';
    default:
      return '';
  }
}

function validateInfoField(fieldId, values) {
  switch (fieldId) {
    case 'preferredName':
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
      if (!values.emailConfirm) return 'Type your email address again.';
      if (!isValidEmail(values.emailConfirm)) return 'Enter a valid email address.';
      if (values.email !== values.emailConfirm) return 'Email addresses do not match. Type it again.';
      return '';
    case 'referrerName':
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
    item.classList.add('is-invalid');
  } else {
    errorEl.textContent = '';
    errorEl.hidden = true;
    item.classList.remove('is-invalid');
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
      setAccordionTriggerTabOrder(trigger);
    }

    if (!isOpen) {
      const error = validateInfoField(fieldId, values);
      setInfoFieldError(item, isDone ? '' : error);
    }
  });
}

function updateStepNav() {
  if (!stepNav) return;
  stepNav.hidden = false;
  if (stepBackBtn) stepBackBtn.disabled = step === 0;
  if (stepNextBtn) {
    stepNextBtn.textContent = step === panels.length - 1 ? 'Build my program' : 'Next';
    stepNextBtn.disabled = step === panels.length - 1 && programBuilt;
  }
  refreshQuestionnaireMobileNavLayout(stepNav);
}

function initInfoFieldCopy() {
  if (!infoAccordion) return;
  INFO_FIELDS.forEach((fieldId) => {
    const item = infoAccordion.querySelector(`[data-info-field="${fieldId}"]`);
    populateAccFieldCopy(item, INFO_FIELD_META[fieldId]);
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
  focusFieldIfAllowed(focusTarget);
  scheduleQuestionnaireDraftSave();
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
    scheduleInfoAccordionRender(true);
  });

  infoAccordion.addEventListener('change', () => {
    renderInfoAccordionState();
    maybeAdvanceInfoField();
    updateStepNav();
  });

  infoAccordion.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.type === 'radio') return;
    event.preventDefault();
    advanceInfoField();
  });

  bindAccordionTabFlow({
    accordion: infoAccordion,
    fields: INFO_FIELDS,
    fieldAttr: 'data-info-field',
    getIndex: () => infoFieldIndex,
    openField: openInfoField,
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
      if (!values.workStress) return 'Select how you would describe your life outside work and training.';
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
    item.classList.add('is-invalid');
  } else {
    errorEl.textContent = '';
    errorEl.hidden = true;
    item.classList.remove('is-invalid');
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
      setAccordionTriggerTabOrder(trigger);
    }

    if (!isOpen) {
      const error = validateOccupationField(fieldId, values);
      setOccupationFieldError(item, isDone ? '' : error);
    }
  });
}

function initOccupationFieldCopy() {
  if (!occupationAccordion) return;
  OCCUPATION_FIELDS.forEach((fieldId) => {
    const item = occupationAccordion.querySelector(`[data-occ-field="${fieldId}"]`);
    const meta = OCCUPATION_FIELD_META[fieldId];
    if (!item || !meta) return;
    populateAccFieldCopy(item, meta);

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
  focusFieldIfAllowed(focusTarget);
  scheduleQuestionnaireDraftSave();
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

  bindAccordionTabFlow({
    accordion: occupationAccordion,
    fields: OCCUPATION_FIELDS,
    fieldAttr: 'data-occ-field',
    getIndex: () => occupationFieldIndex,
    openField: openOccupationField,
  });

  renderOccupationAccordionState();
}

function bodyFieldSummary(fieldId, values) {
  switch (fieldId) {
    case 'height':
      return heightLabel(values) !== '—' ? heightLabel(values) : '';
    case 'totalWeight':
      return values.totalWeight ? `${values.totalWeight} lbs` : '';
    case 'fatSource':
      return values.fatSource ? formatFatSourceLabel(values.fatSource, values.fatSourceOther) : '';
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
    case 'totalWeight': {
      const weight = Number(values.totalWeight);
      if (!values.totalWeight || !Number.isFinite(weight) || weight < 80 || weight > 500) {
        return 'Enter your weight in pounds.';
      }
      return '';
    }
    case 'fatSource':
      if (!values.fatSource) return 'Select how you know.';
      if (values.fatSource === 'other' && !values.fatSourceOther) return 'Enter how you know.';
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
    item.classList.add('is-invalid');
  } else {
    errorEl.textContent = '';
    errorEl.hidden = true;
    item.classList.remove('is-invalid');
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
      setAccordionTriggerTabOrder(trigger);
    }

    if (!isOpen) {
      const error = validateBodyField(fieldId, values);
      setBodyFieldError(item, isDone ? '' : error);
    }
  });
}

function initBodyFieldCopy() {
  if (!bodyAccordion) return;
  BODY_FIELDS.forEach((fieldId) => {
    const item = bodyAccordion.querySelector(`[data-body-field="${fieldId}"]`);
    populateAccFieldCopy(item, BODY_FIELD_META[fieldId]);
  });
}

function collapseBodyIfComplete() {
  if (bodyFieldIndex < 0 || BODY_FIELDS[bodyFieldIndex] !== 'fatSource') return false;
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
  focusFieldIfAllowed(focusTarget);
  scheduleQuestionnaireDraftSave();
}

function syncFatSourceOtherField() {
  const wrap = bodyAccordion?.querySelector('[data-fat-source-other]');
  const input = form.elements.fatSourceOther;
  if (!wrap || !input) return;
  const isOther = readForm().fatSource === 'other';
  wrap.hidden = !isOther;
  input.disabled = !isOther;
}

function bindBodyAccordion() {
  if (!bodyAccordion) return;

  initBodyFieldCopy();
  initFatSourceRadios();
  syncFatSourceOtherField();

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
    updateStepNav();
  });

  bodyAccordion.addEventListener('change', (event) => {
    syncFatSourceOtherField();
    if (event.target instanceof HTMLInputElement && event.target.name === 'fatSource' && event.target.value === 'other') {
      focusFieldIfAllowed(form.elements.fatSourceOther);
    }
    renderBodyAccordionState();
    collapseBodyIfComplete();
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

  bindAccordionTabFlow({
    accordion: bodyAccordion,
    fields: BODY_FIELDS,
    fieldAttr: 'data-body-field',
    getIndex: () => bodyFieldIndex,
    openField: openBodyField,
  });

  renderBodyAccordionState();
}

function exerciseHoursValue(fieldId, values) {
  return values[fieldId] ?? '';
}

function exerciseFieldSummary(fieldId, values) {
  switch (fieldId) {
    case 'age':
      return values.age != null ? String(values.age) : '';
    case 'weightTrainingHours':
    case 'cardioHours':
    case 'fatBurningHours': {
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
      return validateAthleteAge(values.age);
    }
    case 'weightTrainingHours':
    case 'cardioHours':
    case 'fatBurningHours': {
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
    item.classList.add('is-invalid');
  } else {
    errorEl.textContent = '';
    errorEl.hidden = true;
    item.classList.remove('is-invalid');
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
      setAccordionTriggerTabOrder(trigger);
    }

    if (!isOpen) {
      const error = validateExerciseField(fieldId, values);
      setExerciseFieldError(item, isDone ? '' : error);
    }
  });
}

function initExerciseFieldCopy() {
  if (!exerciseAccordion) return;
  EXERCISE_FIELDS.forEach((fieldId) => {
    const item = exerciseAccordion.querySelector(`[data-ex-field="${fieldId}"]`);
    const meta = EXERCISE_FIELD_META[fieldId];
    if (!item || !meta) return;
    populateAccFieldCopy(item, {
      ...meta,
      hoursNote: fieldId === 'age' ? '' : EXERCISE_HOURS_BREAKDOWN,
    }, { hintFrom: 'hint', detailFrom: 'sub' });
  });
}

function collapseExerciseIfComplete() {
  if (exerciseFieldIndex < 0 || EXERCISE_FIELDS[exerciseFieldIndex] !== 'fatBurningHours') return false;
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
  focusFieldIfAllowed(focusTarget);
  scheduleQuestionnaireDraftSave();
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

  bindAccordionTabFlow({
    accordion: exerciseAccordion,
    fields: EXERCISE_FIELDS,
    fieldAttr: 'data-ex-field',
    getIndex: () => exerciseFieldIndex,
    openField: openExerciseField,
  });

  renderExerciseAccordionState();
}

function syncAgeField() {
  const ageInput = form.elements.age;
  const age = ageInput?.value !== '' && ageInput?.value != null ? Number(ageInput.value) : null;
  syncHeartRateHints(Number.isFinite(age) ? age : null);
}

function syncHeartRateHints(age) {
  const cardio = document.querySelector('[data-hr-cardio]');
  const fat = document.querySelector('[data-hr-fat]');
  if (!age) {
    if (cardio) cardio.textContent = 'Cardio training range (BPM) — enter age above';
    if (fat) fat.textContent = 'Fat burning training range (BPM) — enter age above';
    return;
  }
  const hr = heartRates(age);
  if (cardio) cardio.textContent = `Cardio training range (BPM): ${hr.cardioLow}–${hr.cardioHigh}`;
  if (fat) fat.textContent = `Fat burning training range (BPM): ${hr.fatBurnLow}–${hr.fatBurnHigh}`;
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
      return infoSectionComplete(values);
    case 1:
      return occupationSectionComplete(values);
    case 2:
      return exerciseSectionComplete(values);
    case 3:
      return bodySectionComplete(values);
    case 4:
      return Boolean(values.signature && values.signatureDate);
    default:
      return true;
  }
}

function clearWaiverInvalidState() {
  document.querySelectorAll('#athlete-waiver-block .intake-waiver__cell.is-invalid').forEach((cell) => {
    cell.classList.remove('is-invalid');
  });
}

function highlightWaiverValidationErrors(values) {
  clearWaiverInvalidState();
  let focusTarget = null;
  if (!values.signature) {
    document.querySelector('#athlete-waiver-block .intake-waiver__cell--signed')?.classList.add('is-invalid');
    focusTarget = form.elements.signature;
  }
  if (!values.signatureDate) {
    document.querySelector('#athlete-waiver-block .intake-waiver__cell--date')?.classList.add('is-invalid');
    if (!focusTarget) focusTarget = form.elements.signatureDate;
  }
  focusFieldIfAllowed(focusTarget);
}

function highlightStepValidationErrors(stepIndex) {
  const values = readForm();

  switch (stepIndex) {
    case 0: {
      let firstInvalidIndex = -1;
      INFO_FIELDS.forEach((fieldId, index) => {
        const item = infoAccordion?.querySelector(`[data-info-field="${fieldId}"]`);
        const error = validateInfoField(fieldId, values);
        setInfoFieldError(item, error);
        if (error && firstInvalidIndex < 0) firstInvalidIndex = index;
      });
      if (firstInvalidIndex >= 0) openInfoField(firstInvalidIndex);
      else renderInfoAccordionState();
      break;
    }
    case 1: {
      let firstInvalidIndex = -1;
      OCCUPATION_FIELDS.forEach((fieldId, index) => {
        const item = occupationAccordion?.querySelector(`[data-occ-field="${fieldId}"]`);
        const error = validateOccupationField(fieldId, values);
        setOccupationFieldError(item, error);
        if (error && firstInvalidIndex < 0) firstInvalidIndex = index;
      });
      if (firstInvalidIndex >= 0) openOccupationField(firstInvalidIndex);
      else renderOccupationAccordionState();
      break;
    }
    case 2: {
      let firstInvalidIndex = -1;
      EXERCISE_FIELDS.forEach((fieldId, index) => {
        const item = exerciseAccordion?.querySelector(`[data-ex-field="${fieldId}"]`);
        const error = validateExerciseField(fieldId, values);
        setExerciseFieldError(item, error);
        if (error && firstInvalidIndex < 0) firstInvalidIndex = index;
      });
      if (firstInvalidIndex >= 0) {
        openExerciseField(firstInvalidIndex);
      } else {
        renderExerciseAccordionState();
      }
      break;
    }
    case 3: {
      let firstInvalidIndex = -1;
      BODY_FIELDS.forEach((fieldId, index) => {
        const item = bodyAccordion?.querySelector(`[data-body-field="${fieldId}"]`);
        const error = validateBodyField(fieldId, values);
        setBodyFieldError(item, error);
        if (error && firstInvalidIndex < 0) firstInvalidIndex = index;
      });
      if (firstInvalidIndex >= 0) openBodyField(firstInvalidIndex);
      else renderBodyAccordionState();
      break;
    }
    case 4:
      highlightWaiverValidationErrors(values);
      break;
    default:
      break;
  }
}

function intakeFieldStepIndex(fieldId) {
  return INTAKE_QUESTION_SECTIONS.findIndex(({ fields }) => fields.includes(fieldId));
}

function navigateToIntakeField(fieldId) {
  if (fieldId === 'waiver') {
    showStep(4);
    focusFieldIfAllowed(form.elements.signature);
    return;
  }

  const stepIndex = intakeFieldStepIndex(fieldId);
  if (stepIndex < 0) return;

  const section = INTAKE_QUESTION_SECTIONS[stepIndex];
  const fieldIndex = section.fields.indexOf(fieldId);
  if (fieldIndex < 0) return;

  showStep(stepIndex);

  switch (stepIndex) {
    case 0:
      openInfoField(fieldIndex);
      break;
    case 1:
      openOccupationField(fieldIndex);
      break;
    case 2:
      openExerciseField(fieldIndex);
      break;
    case 3:
      openBodyField(fieldIndex);
      break;
    default:
      break;
  }
}

function renderStepHeading() {
  if (stepHeadingEl) {
    stepHeadingEl.textContent = STEP_HEADINGS[step] || STEPS[step]?.label || '';
  }
  if (stepHeadingNoteEl) {
    const note = STEP_HEADING_NOTES[step] || '';
    stepHeadingNoteEl.textContent = note;
    stepHeadingNoteEl.hidden = !note;
  }
  renderMobileProgress();
}

function renderMobileProgress() {
  const stepNum = step + 1;
  const total = STEPS.length;
  const label = MOBILE_STEP_LABELS[step] || STEPS[step]?.label || '';

  if (mobileProgressLabelEl) {
    mobileProgressLabelEl.textContent = `Step ${stepNum} of ${total} — ${label}`;
  }
  if (mobileProgressTrackEl) {
    mobileProgressTrackEl.setAttribute('aria-valuenow', String(stepNum));
    mobileProgressTrackEl.setAttribute('aria-valuemax', String(total));
    mobileProgressTrackEl.setAttribute('aria-label', `Questionnaire progress, step ${stepNum} of ${total}`);
  }
  if (mobileProgressFillEl) {
    mobileProgressFillEl.style.width = `${(stepNum / total) * 100}%`;
  }
}

function renderNav() {
  renderMobileProgress();
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatReviewValue(row) {
  if (row.signatureDisplay?.name) {
    const name = escapeHtml(row.signatureDisplay.name);
    const date = row.signatureDisplay.date ? escapeHtml(row.signatureDisplay.date) : '';
    return date
      ? `<span class="intake-signature-display">${name}</span><span class="intake-signature-date"> — ${date}</span>`
      : `<span class="intake-signature-display">${name}</span>`;
  }
  return escapeHtml(row.value);
}

function renderReview() {
  const values = readForm();
  const pkg = buildProgramFromValues(values);
  const rows = buildAnswersConfirmationRows(pkg);

  reviewEl.innerHTML = rows.map((row) => {
    const label = formatAnswersConfirmationLabel(row);
    const fieldId = row.fieldId || '';
    return `
    <div>
      <dt>
        <button type="button" class="intake-review__link" data-review-field="${fieldId}">${label}</button>
      </dt>
      <dd>${formatReviewValue(row)}</dd>
    </div>
  `;
  }).join('');
  return pkg;
}

function showIntroGate() {
  questionnaireStarted = false;
  if (introGateEl) introGateEl.hidden = false;
  if (questionnaireShellEl) questionnaireShellEl.hidden = true;
}

function showQuestionnaireShell() {
  questionnaireStarted = true;
  if (introGateEl) introGateEl.hidden = true;
  if (questionnaireShellEl) questionnaireShellEl.hidden = false;
  refreshQuestionnaireMobileNavLayout(stepNav);
}

function beginQuestionnaire() {
  showQuestionnaireShell();
  showStep(0);
  saveQuestionnaireDraft(buildQuestionnaireDraftSnapshot());
}

function showStep(index) {
  step = Math.max(0, Math.min(index, panels.length - 1));
  panels.forEach((panel, i) => {
    panel.hidden = i !== step;
  });
  renderNav();
  renderStepHeading();
  if (step === 5) renderReview();
  refreshQuestionnaireMobileNavLayout(stepNav);
  if (step === 0) renderInfoAccordionState();
  if (step === 1) {
    if (occupationFieldIndex < 0 && !occupationSectionComplete(readForm())) {
      occupationFieldIndex = 0;
    }
    renderOccupationAccordionState();
  }
  if (step === 4) {
    syncLocalTodayDates();
  }
  if (step === 3) {
    if (bodyFieldIndex < 0 && !bodySectionComplete(readForm())) {
      bodyFieldIndex = 0;
    }
    syncFatSourceOtherField();
    renderBodyAccordionState();
  }
  if (step === 2) {
    if (exerciseFieldIndex < 0 && !exerciseSectionComplete(readForm())) {
      exerciseFieldIndex = 0;
    }
    renderExerciseAccordionState();
    syncAgeField();
  }
  updateStepNav();
  scheduleQuestionnaireDraftSave();
}

function syncLocalTodayDates() {
  const today = localDateKey(new Date());
  if (form.elements.intakeDate) {
    form.elements.intakeDate.value = today;
  }
  if (form.elements.signatureDate && !String(form.elements.signatureDate.value || '').trim()) {
    form.elements.signatureDate.value = today;
  }
}

function initDefaults() {
  syncLocalTodayDates();
  if (form.elements.fatBurningHours && !form.elements.fatBurningHours.value) {
    form.elements.fatBurningHours.value = '3';
  }
}

function bindExerciseHoursInfo() {
  if (!exerciseAccordion) return;

  exerciseAccordion.querySelectorAll('[data-hours-info-btn]').forEach((btn) => {
    const panel = btn.parentElement?.querySelector('[data-hours-info-panel]');
    if (!panel) return;
    panel.textContent = EXERCISE_HOURS_BREAKDOWN;

    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      const opening = panel.hidden;
      closeExerciseHoursInfoPanels();
      if (opening) {
        panel.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
      }
    });

    panel.addEventListener('click', (event) => {
      event.stopPropagation();
    });
  });
}

function closeExerciseHoursInfoPanels() {
  document.querySelectorAll('[data-hours-info-panel]').forEach((panel) => {
    panel.hidden = true;
  });
  document.querySelectorAll('[data-hours-info-btn]').forEach((btn) => {
    btn.setAttribute('aria-expanded', 'false');
  });
}

function bindEvents() {
  if (!form) {
    throw new Error('Questionnaire markup is missing required elements.');
  }

  bindInfoAccordion();
  bindOccupationAccordion();
  bindBodyAccordion();
  bindExerciseAccordion();
  bindAccordionMoreInfo(form);

  document.querySelector('[data-intro-start]')?.addEventListener('click', () => {
    beginQuestionnaire();
  });

  document.addEventListener('click', closeExerciseHoursInfoPanels);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeExerciseHoursInfoPanels();
  });

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) syncLocalTodayDates();
  });

  window.addEventListener('pagehide', () => {
    if (draftRestoreActive || !questionnaireStarted) return;
    if (draftSaveTimer) {
      clearTimeout(draftSaveTimer);
      draftSaveTimer = null;
    }
    saveQuestionnaireDraft(buildQuestionnaireDraftSnapshot());
  });

  reviewEl?.addEventListener('click', (event) => {
    const link = event.target.closest('[data-review-field]');
    if (!link) return;
    const fieldId = link.dataset.reviewField;
    if (!fieldId) return;
    navigateToIntakeField(fieldId);
  });

  form.addEventListener('input', () => {
    syncAgeField();
    clearWaiverInvalidState();
    updateStepNav();
    scheduleQuestionnaireDraftSave();
  });

  form.addEventListener('change', () => {
    syncAgeField();
    clearWaiverInvalidState();
    updateStepNav();
    scheduleQuestionnaireDraftSave();
  });

  stepBackBtn?.addEventListener('click', () => {
    if (step > 0) showStep(step - 1);
  });

  stepNextBtn?.addEventListener('click', () => {
    if (step === panels.length - 1) {
      buildProgram(stepNextBtn);
      return;
    }
    if (!canProceed(step)) {
      highlightStepValidationErrors(step);
      return;
    }
    showStep(step + 1);
  });
}

function buildProgram(triggerBtn) {
  if (!canProceed(4)) {
    showStep(4);
    highlightWaiverValidationErrors(readForm());
    return;
  }

  const email = String(readForm().email || '').trim();
  if (!isValidEmail(email)) {
    window.alert('Enter a valid email address before continuing.');
    showStep(0);
    return;
  }

  if (!triggerBtn) return;
  const prevLabel = triggerBtn.textContent;
  triggerBtn.disabled = true;
  triggerBtn.textContent = 'Building…';

  try {
    const pkg = renderReview();
    persistAppEmail(email);
    sessionStorage.setItem('bnb_program_draft', JSON.stringify(pkg));
    persistProgramBridge(pkg);
    programBuilt = true;
    clearQuestionnaireDraft();
    triggerBtn.textContent = 'Program built';
    updateStepNav();
    window.location.assign('/createyourfoodplan/');
  } catch (error) {
    console.error(error);
    window.alert('Could not build your program. Check your answers and try again.');
    triggerBtn.disabled = false;
    triggerBtn.textContent = prevLabel;
    updateStepNav();
  }
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
    syncIntakeQuestionNumbers();
    bindEvents();
    initQuestionnaireMobileNav({ stepNavEl: stepNav, formEl: form });
    initDefaults();
    if (!tryRestoreQuestionnaireDraft()) {
      showIntroGate();
    }
  } catch (error) {
    console.error(error);
    showBootError('Could not start the questionnaire. Hard refresh and try again.');
  }
}

boot();
