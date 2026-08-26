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

const form = document.getElementById('questionnaire-form');
const stepLabel = document.getElementById('step-label');
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

function showStep(index) {
  step = Math.max(0, Math.min(index, panels.length - 1));
  panels.forEach((panel, i) => { panel.hidden = i !== step; });
  stepLabel.textContent = `Step ${step + 1} of ${STEPS.length} — ${STEPS[step]}`;
  btnBack.disabled = step === 0;
  btnNext.textContent = step === panels.length - 1 ? 'Build my program' : 'Next';
  showError('');
  if (step === 2) syncHeartRates();
  if (step === 5 && !programBuilt) renderReview();
  if (step < 5) formSuccess.hidden = true;
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

form.addEventListener('change', (event) => {
  if (event.target.name === 'fatSource') syncFatSourceOther();
  if (event.target.name === 'age') syncHeartRates();
});

renderFatSourceOptions();
syncFatSourceOther();
const today = new Date().toISOString().slice(0, 10);
if (form.elements.signatureDate && !form.elements.signatureDate.value) {
  form.elements.signatureDate.value = today;
}
showStep(0);
