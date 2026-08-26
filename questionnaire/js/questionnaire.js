import { heartRates } from '../../js/profileDataEngine.js';
import { buildProgramPackage } from '../../js/programPackageData.js';
import { buildAnswersConfirmationRows } from '../../js/answersConfirmationPrintout.js';

const STEPS = [
  'Contact Information',
  'Occupation',
  'Exercise',
  'Body composition',
  'Agreement',
  'Review',
];

const FAT_SOURCE_OPTIONS = [
  { value: 'guess', label: "I'm estimating" },
  { value: 'smart_scales', label: 'Smart scales' },
  { value: 'tape', label: 'Tape measurements' },
  { value: 'bia', label: 'InBody/BIA' },
  { value: 'scan3d', label: '3D scanning (Styku and Fit3D)' },
  { value: 'skinfolds', label: 'Skinfolds' },
  { value: 'bodpod', label: 'Bod Pod' },
  { value: 'dexa', label: 'DEXA' },
  { value: 'hydrostatic', label: 'Hydrostatic weighing' },
  { value: 'other', label: 'Other' },
];

const STEP_NAV_LABELS = [
  'Contact',
  'Occupation',
  'Exercise',
  'Body',
  'Agreement',
  'Review',
];

const form = document.getElementById('questionnaire-form');
const stepNavList = document.getElementById('step-nav-list');
const panels = [...form.querySelectorAll('.form-step')];
const btnBack = document.getElementById('btn-back');
const btnNext = document.getElementById('btn-next');
const formError = document.getElementById('form-error');
const formSuccess = document.getElementById('form-success');
const reviewList = document.getElementById('review-list');
const fatSourceList = document.getElementById('fat-source-list');
const fatSourceOtherWrap = document.getElementById('fat-source-other-wrap');

let step = 0;
let programBuilt = false;

function accordionItems(acc) {
  return [...acc.querySelectorAll('.acc-item')].filter((el) => !el.hidden);
}

function focusablesIn(container) {
  return [...container.querySelectorAll(
    'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])',
  )].filter((el) => {
    if (el.tabIndex < 0) return false;
    return el.getClientRects().length > 0;
  });
}

function syncAccordionInert(acc) {
  accordionItems(acc).forEach((item) => {
    item.inert = !item.classList.contains('is-open');
    item.querySelector('.acc-item__head')?.setAttribute('tabindex', '-1');
  });
}

function openAccordionItem(acc, item, focusPosition = 'first') {
  accordionItems(acc).forEach((el) => el.classList.remove('is-open'));
  item.classList.add('is-open');
  syncAccordionInert(acc);
  const fields = focusablesIn(item);
  const target = focusPosition === 'last' ? fields[fields.length - 1] : fields[0];
  target?.focus();
}

function initAccordions(root = form) {
  root.querySelectorAll('[data-accordion]').forEach((acc) => {
    syncAccordionInert(acc);
    acc.querySelectorAll('.acc-item__head').forEach((head) => {
      head.setAttribute('tabindex', '-1');
      head.addEventListener('click', () => {
        const item = head.closest('.acc-item');
        if (!item || item.hidden) return;
        const open = item.classList.contains('is-open');
        accordionItems(acc).forEach((el) => el.classList.remove('is-open'));
        if (!open) item.classList.add('is-open');
        syncAccordionInert(acc);
        if (!open) openAccordionItem(acc, item);
      });
    });
  });
}

function resetAccordions(panel) {
  panel.querySelectorAll('[data-accordion]').forEach((acc) => {
    const items = accordionItems(acc);
    items.forEach((el) => el.classList.remove('is-open'));
    if (items[0]) items[0].classList.add('is-open');
    syncAccordionInert(acc);
  });
}

function handleAccordionTab(event) {
  if (event.key !== 'Tab') return;
  const panel = panels[step];
  if (!panel || panel.hidden) return;

  const acc = panel.querySelector('[data-accordion]');
  if (!acc) return;

  const items = accordionItems(acc);
  const openItem = acc.querySelector('.acc-item.is-open:not([hidden])');
  if (!openItem) return;

  const fields = focusablesIn(openItem);
  const active = document.activeElement;
  const idx = fields.indexOf(active);

  if (event.shiftKey) {
    if (idx <= 0) {
      const itemIdx = items.indexOf(openItem);
      if (itemIdx > 0) {
        event.preventDefault();
        openAccordionItem(acc, items[itemIdx - 1], 'last');
      }
    }
    return;
  }

  if (idx === fields.length - 1) {
    const itemIdx = items.indexOf(openItem);
    if (itemIdx < items.length - 1) {
      event.preventDefault();
      openAccordionItem(acc, items[itemIdx + 1]);
    }
  }
}

function showError(message) {
  formError.textContent = message;
  formError.hidden = !message;
}

function readForm() {
  const data = new FormData(form);
  return {
    preferredName: String(data.get('preferredName') || '').trim(),
    email: String(data.get('email') || '').trim(),
    emailConfirm: String(data.get('emailConfirm') || '').trim(),
    referrerName: String(data.get('referrerName') || '').trim(),
    sex: data.get('sex'),
    workPhysical: data.get('workPhysical'),
    workStress: data.get('workStress'),
    age: data.get('age'),
    weightTrainingHours: data.get('weightTrainingHours'),
    cardioHours: data.get('cardioHours'),
    fatBurningHours: data.get('fatBurningHours'),
    heightFeet: data.get('heightFeet'),
    heightInchesPart: data.get('heightInchesPart'),
    weight: data.get('weight'),
    fatPercent: data.get('fatPercent'),
    fatSource: data.get('fatSource'),
    fatSourceOther: String(data.get('fatSourceOther') || '').trim(),
    signature: String(data.get('signature') || '').trim(),
    signatureDate: data.get('signatureDate'),
  };
}

function toEngineForm(values) {
  return {
    preferredName: values.preferredName,
    referrerName: values.referrerName,
    email: values.email,
    sex: values.sex,
    heightFeet: String(values.heightFeet || ''),
    heightInchesPart: String(values.heightInchesPart || ''),
    heightInches: '',
    age: values.age === '' ? null : Number(values.age),
    birthDate: '',
    birthDateText: '',
    weightText: String(values.weight || ''),
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

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseHours(value, max = 15) {
  if (value === '' || value == null) return null;
  if (value === 0 || value === '0') return 0;
  const n = Number(String(value).trim());
  if (!Number.isFinite(n) || n < 0 || n > max) return null;
  const quarters = Math.round(n * 4);
  if (Math.abs(n * 4 - quarters) > 0.001) return null;
  return quarters / 4;
}

function validateStep(index) {
  const v = readForm();
  switch (index) {
    case 0:
      if (!v.preferredName) return 'Enter your full name.';
      if (!v.sex) return 'Select your gender.';
      if (!isValidEmail(v.email)) return 'Enter a valid email address.';
      if (v.email.toLowerCase() !== v.emailConfirm.toLowerCase()) return 'Email addresses do not match.';
      return '';
    case 1:
      if (!v.workPhysical) return 'Select how physically active your job is.';
      if (!v.workStress) return 'Select how you would describe your life outside work and training.';
      return '';
    case 2: {
      const age = Number(v.age);
      if (!Number.isFinite(age) || age < 16 || age > 99) return 'Enter your age (16–99).';
      for (const [field, label, max] of [
        ['weightTrainingHours', 'stop & go', 15],
        ['cardioHours', 'cardio training', 15],
        ['fatBurningHours', 'fat burning training', 20],
      ]) {
        if (parseHours(v[field], max) === null) return `Enter ${label} hours per week (0 if none). Use decimals like 0.25 for 15 minutes.`;
      }
      return '';
    }
    case 3: {
      const feet = Number(v.heightFeet);
      if (!Number.isFinite(feet) || feet < 4 || feet > 8) return 'Enter your height in feet.';
      const weight = Number(v.weight);
      if (!Number.isFinite(weight) || weight <= 0) return 'Enter your weight in pounds.';
      const fat = Number(v.fatPercent);
      if (!Number.isFinite(fat) || fat <= 0 || fat >= 70) return 'Enter your body fat percentage.';
      if (!v.fatSource) return 'Select how you know your body fat percentage.';
      if (v.fatSource === 'other' && !v.fatSourceOther) return 'Describe how you know your body fat percentage.';
      return '';
    }
    case 4:
      if (!v.signature) return 'Sign the waiver with your full name.';
      if (!v.signatureDate) return 'Enter the date you signed.';
      return '';
    default:
      return '';
  }
}

function syncHeartRates() {
  const age = Number(readForm().age);
  const cardioEl = document.getElementById('cardio-heart-rate');
  const fatEl = document.getElementById('fat-burn-heart-rate');
  if (!Number.isFinite(age) || age < 16) {
    cardioEl.textContent = 'Cardio training range (BPM) — enter age above';
    fatEl.textContent = 'Fat burning training range (BPM) — enter age above';
    return;
  }
  const hr = heartRates(age);
  cardioEl.textContent = `Cardio training range (BPM): ${hr.cardioLow}–${hr.cardioHigh}`;
  fatEl.textContent = `Fat burning training range (BPM): ${hr.fatBurnLow}–${hr.fatBurnHigh}`;
}

function renderFatSourceOptions() {
  fatSourceList.innerHTML = FAT_SOURCE_OPTIONS.map((opt, i) => `
    <label class="choice">
      <input type="radio" name="fatSource" value="${opt.value}"${i === 0 ? ' required' : ''} />
      ${opt.label}
    </label>
  `).join('');
}

function syncFatSourceOther() {
  const isOther = readForm().fatSource === 'other';
  fatSourceOtherWrap.hidden = !isOther;
  const input = form.elements.fatSourceOther;
  input.disabled = !isOther;
  if (!isOther) input.value = '';
  const acc = fatSourceOtherWrap.closest('[data-accordion]');
  if (!acc) return;
  if (isOther) {
    openAccordionItem(acc, fatSourceOtherWrap);
  } else {
    syncAccordionInert(acc);
  }
}

function renderReview() {
  const pkg = buildProgramPackage(toEngineForm(readForm()), {
    label: '8-Week Burn & Build Program',
    meta: { source: 'questionnaire' },
  });
  reviewList.innerHTML = buildAnswersConfirmationRows(pkg).map(({ label, value }) => `
    <div><dt>${label}</dt><dd>${value}</dd></div>
  `).join('');
  return pkg;
}

function stepIsComplete(index) {
  return !validateStep(index);
}

function canReachStep(target) {
  if (target <= step) return true;
  for (let i = 0; i < target; i += 1) {
    if (!stepIsComplete(i)) return false;
  }
  return true;
}

function renderStepNav() {
  stepNavList.innerHTML = STEPS.map((label, index) => {
    const classes = ['q-stepnav__item'];
    if (index === step) classes.push('is-active');
    if (index < step) classes.push('is-done');
    const reachable = canReachStep(index);
    return `<li><button type="button" class="${classes.join(' ')}" data-step="${index}" tabindex="-1"${reachable ? '' : ' disabled'}>${index + 1}. ${STEP_NAV_LABELS[index]}</button></li>`;
  }).join('');
  stepNavList.querySelector('.is-active')?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
}

function showStep(index) {
  step = Math.max(0, Math.min(index, panels.length - 1));
  panels.forEach((panel, i) => {
    const active = i === step;
    panel.hidden = !active;
    panel.inert = !active;
    if (active) resetAccordions(panel);
  });
  renderStepNav();
  btnBack.disabled = step === 0;
  btnNext.textContent = step === panels.length - 1 ? 'Build my program' : 'Next';
  showError('');
  if (step === 2) syncHeartRates();
  if (step === 5 && !programBuilt) renderReview();
  if (step < 5) formSuccess.hidden = true;

  const panel = panels[step];
  const acc = panel?.querySelector('[data-accordion]');
  const openItem = acc?.querySelector('.acc-item.is-open:not([hidden])');
  const firstField = openItem && focusablesIn(openItem)[0];
  firstField?.focus();
}

function buildProgram() {
  const pkg = renderReview();
  sessionStorage.setItem('bnb_program_draft', JSON.stringify(pkg));
  programBuilt = true;
  formSuccess.hidden = false;
  formSuccess.innerHTML = `<strong>Your program was built.</strong> Protein servings: ${pkg.plan.servings.planServings.protein}. Checkout wiring comes next.`;
  btnNext.disabled = true;
}

btnBack.addEventListener('click', () => {
  if (step > 0) showStep(step - 1);
});

btnNext.addEventListener('click', () => {
  const err = validateStep(step);
  if (err) {
    showError(err);
    return;
  }
  if (step === panels.length - 1) {
    try {
      buildProgram();
    } catch (e) {
      showError('Could not build your program. Check your answers and try again.');
      console.error(e);
    }
    return;
  }
  showStep(step + 1);
});

form.addEventListener('keydown', handleAccordionTab);

form.addEventListener('change', (event) => {
  if (event.target.name === 'fatSource') syncFatSourceOther();
  if (event.target.name === 'age') syncHeartRates();
  renderStepNav();
});

stepNavList.addEventListener('click', (event) => {
  const btn = event.target.closest('[data-step]');
  if (!btn || btn.disabled) return;
  showStep(Number(btn.dataset.step));
});

renderFatSourceOptions();
initAccordions();
syncFatSourceOther();
const today = new Date().toISOString().slice(0, 10);
if (form.elements.signatureDate && !form.elements.signatureDate.value) {
  form.elements.signatureDate.value = today;
}
showStep(0);
