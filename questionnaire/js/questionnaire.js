import {
  heartRates,
  WORK_PHYSICAL,
  WORK_STRESS,
} from '../../js/onboardingEngine.js';
import { buildProgramPackage } from '../../js/programPackage.js';
import { persistAppEmail, saveProgramToServer, isValidEmail } from '../../js/programApi.js';
import { persistProgramBridge } from '../../js/programBridgeHandoff.js';

import { CREATOR_CHECKOUT_URL, captureDietCreationTestBypass, isDietCreationGated, withDietCreationTestParam } from '../../js/siteUrls.js';
import { kwarnerPreviewPdfUrl } from '../../js/kwarnerPreviewBuild.js';

captureDietCreationTestBypass();

const STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'personal', label: 'Personal info' },
  { id: 'work', label: 'Workday' },
  { id: 'exercise', label: 'Exercise' },
  { id: 'body', label: 'Body composition' },
  { id: 'waiver', label: 'Agreement' },
  { id: 'review', label: 'Review' },
];

const INFO_FIELDS = [
  'firstName',
  'lastName',
  'age',
  'sex',
  'height',
  'weight',
  'email',
];

const form = document.getElementById('q-form');
const navList = document.getElementById('q-nav-list');
const reviewEl = document.getElementById('q-review');
const continueBtn = document.getElementById('q-continue');
const backBtn = document.querySelector('[data-q-back]');
const nextBtn = document.querySelector('#q-actions [data-q-next]');
const panels = [...document.querySelectorAll('.q-panel')];
const infoAccordion = document.getElementById('info-accordion');

let step = 0;
let infoFieldIndex = 0;

function workPhysicalLabel(id) {
  return WORK_PHYSICAL.find((item) => item.id === id)?.label || id || '—';
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

function fullName(values) {
  return [values.firstName, values.lastName].filter(Boolean).join(' ').trim();
}

function syncPreferredName() {
  const values = readForm();
  const hidden = form.elements.preferredName;
  if (hidden) hidden.value = fullName(values);
}

function readForm() {
  const data = new FormData(form);
  const firstName = String(data.get('firstName') || '').trim();
  const lastName = String(data.get('lastName') || '').trim();
  const ageRaw = data.get('age');
  const age = ageRaw !== '' && ageRaw != null ? Number(ageRaw) : null;
  return {
    firstName,
    lastName,
    preferredName: fullName({ firstName, lastName }),
    email: String(data.get('email') || '').trim(),
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
    case 'firstName':
      return values.firstName || '';
    case 'lastName':
      return values.lastName || '';
    case 'age':
      return values.age != null ? String(values.age) : '';
    case 'sex':
      if (values.sex === 'female') return 'Female';
      if (values.sex === 'male') return 'Male';
      return '';
    case 'height':
      return heightLabel(values);
    case 'weight':
      return values.weight ? `${values.weight} lbs` : '';
    case 'email':
      return values.email || '';
    default:
      return '';
  }
}

function validateInfoField(fieldId, values) {
  switch (fieldId) {
    case 'firstName':
      if (!values.firstName) return 'Enter your first name.';
      return '';
    case 'lastName':
      if (!values.lastName) return 'Enter your last name.';
      return '';
    case 'age': {
      const age = values.age;
      if (age == null || !Number.isFinite(age)) return 'Enter your age in years.';
      if (age < 16 || age > 99) return 'Enter an age between 16 and 99.';
      return '';
    }
    case 'sex':
      if (!values.sex) return 'Select female or male.';
      return '';
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
    case 'email':
      if (!values.email) return 'Enter your email address.';
      if (!isValidEmail(values.email)) return 'Enter a valid email address.';
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
  syncPreferredName();

  INFO_FIELDS.forEach((fieldId, index) => {
    const item = infoAccordion.querySelector(`[data-info-field="${fieldId}"]`);
    if (!item) return;

    const summary = item.querySelector('.intake-acc__summary');
    const trigger = item.querySelector('.intake-acc__trigger');
    const isOpen = index === infoFieldIndex;
    const isDone = infoFieldIsValid(fieldId, values);

    item.classList.toggle('is-open', isOpen);
    item.classList.toggle('is-done', isDone && !isOpen);

    if (summary) summary.textContent = infoFieldSummary(fieldId, values);
    if (trigger) {
      trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      trigger.tabIndex = 0;
    }

    if (!isOpen) setInfoFieldError(item, '');
  });
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
  syncAgeField();

  if (infoFieldIndex < INFO_FIELDS.length - 1) {
    openInfoField(infoFieldIndex + 1);
  } else {
    renderInfoAccordionState();
  }

  if (nextBtn && step === 1) nextBtn.disabled = !canProceed(step);
  return true;
}

function bindInfoAccordion() {
  if (!infoAccordion) return;

  infoAccordion.addEventListener('click', (event) => {
    const next = event.target.closest('.intake-acc__next');
    if (next) {
      event.preventDefault();
      advanceInfoField();
      return;
    }

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
    syncPreferredName();
    syncAgeField();
    renderInfoAccordionState();
    if (nextBtn && step === 1) nextBtn.disabled = !canProceed(step);
  });

  infoAccordion.addEventListener('change', () => {
    syncPreferredName();
    syncAgeField();
    renderInfoAccordionState();
    if (nextBtn && step === 1) nextBtn.disabled = !canProceed(step);
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
      return values.workPhysical && values.workStress;
    case 3:
      return values.weightTrainingHours !== ''
        && values.cardioHours !== ''
        && values.fatBurningHours !== '';
    case 4:
      return values.fatSource && Number(values.fatPercent) > 0;
    case 5:
      return values.waiverAccepted && values.signature;
    default:
      return true;
  }
}

function renderNav() {
  navList.innerHTML = STEPS.map((item, index) => `
    <li>
      <button type="button" class="q-nav__item${index === step ? ' is-active' : ''}${index < step ? ' is-done' : ''}" data-nav-step="${index}">
        ${index + 1}. ${item.label}
      </button>
    </li>
  `).join('');
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
    ['Work exertion', workPhysicalLabel(values.workPhysical)],
    ['Day stress', workStressLabel(values.workStress)],
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

function showStep(index) {
  step = Math.max(0, Math.min(index, panels.length - 1));
  panels.forEach((panel, i) => {
    panel.hidden = i !== step;
  });
  renderNav();
  if (step === 6) renderReview();
  if (step === 1) renderInfoAccordionState();
  if (backBtn) backBtn.hidden = step === 0;
  if (nextBtn) {
    nextBtn.hidden = step === 0 || step === panels.length - 1;
    nextBtn.disabled = !canProceed(step);
  }
  const actions = document.getElementById('q-actions');
  if (actions) actions.hidden = step === 0 || step === panels.length - 1;

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

  navList.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-nav-step]');
    if (!btn) return;
    const target = Number(btn.dataset.navStep);
    if (target <= step) showStep(target);
  });

  form.addEventListener('input', () => {
    syncPreferredName();
    syncAgeField();
    if (nextBtn && step < panels.length - 1) nextBtn.disabled = !canProceed(step);
  });

  form.addEventListener('change', () => {
    syncPreferredName();
    syncAgeField();
    if (nextBtn && step < panels.length - 1) nextBtn.disabled = !canProceed(step);
  });

  document.querySelectorAll('[data-q-next]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (step < panels.length - 1 && !canProceed(step)) return;
      showStep(step + 1);
    });
  });

  backBtn?.addEventListener('click', () => showStep(step - 1));

  window.addEventListener('hashchange', () => {
    if (location.hash === '#welcome' && step !== 0) showStep(0);
  });

  continueBtn?.addEventListener('click', async (event) => {
    event.preventDefault();
    const values = readForm();
    if (!canProceed(5)) return;

    const email = String(values.email || '').trim();
    if (!isValidEmail(email)) {
      window.alert('Enter a valid email address before continuing.');
      showStep(1);
      return;
    }

    continueBtn.disabled = true;
    const prevLabel = continueBtn.textContent;
    continueBtn.textContent = 'Opening checkout…';

    try {
      const program = buildProgramFromValues(values);
      persistAppEmail(email);
      persistProgramBridge(program);
      sessionStorage.setItem('bnb_creator_phase', 'plan-ready');

      const saved = await saveProgramToServer(email, program);
      if (!saved.ok) {
        window.alert(saved.message || 'Could not save your plan. Check your connection and try again.');
        continueBtn.disabled = false;
        continueBtn.textContent = prevLabel;
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
      continueBtn.disabled = false;
      continueBtn.textContent = prevLabel;
    }
  });
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
      <button type="button" class="q-btn q-btn--primary" data-q-next>Create your diet</button>
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
