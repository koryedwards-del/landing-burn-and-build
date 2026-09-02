/** Segmented birthdate entry — MM / DD / YYYY with auto-advance between parts. */

const BIRTHDATE_PARTS = ['month', 'day', 'year'];

function partInput(root, part) {
  return root.querySelector(`[data-birthdate-part="${part}"]`);
}

function sanitizeDigits(value, maxLen) {
  return String(value || '').replace(/\D/g, '').slice(0, maxLen);
}

function normalizeMonth(value) {
  const digits = sanitizeDigits(value, 2);
  if (digits.length === 1 && Number(digits) > 1) {
    return { text: `0${digits}`, advance: true };
  }
  return { text: digits, advance: digits.length === 2 };
}

function normalizeDay(value) {
  const digits = sanitizeDigits(value, 2);
  if (digits.length === 1 && Number(digits) > 3) {
    return { text: `0${digits}`, advance: true };
  }
  return { text: digits, advance: digits.length === 2 };
}

function normalizeYear(value) {
  const text = sanitizeDigits(value, 4);
  return { text, advance: text.length === 4 };
}

function syncBirthDateHidden(root) {
  const month = partInput(root, 'month')?.value || '';
  const day = partInput(root, 'day')?.value || '';
  const year = partInput(root, 'year')?.value || '';
  const hidden = root.querySelector('input[name="birthDate"]');
  if (!hidden) return;

  if (month.length === 2 && day.length === 2 && year.length === 4) {
    hidden.value = `${year}-${month}-${day}`;
  } else {
    hidden.value = '';
  }

  hidden.dispatchEvent(new Event('input', { bubbles: true }));
  hidden.dispatchEvent(new Event('change', { bubbles: true }));
}

function focusBirthDatePart(root, part) {
  const input = partInput(root, part);
  if (!input) return;
  input.focus();
  input.select();
}

function adjacentBirthDatePart(part, direction) {
  const index = BIRTHDATE_PARTS.indexOf(part);
  if (index < 0) return null;
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= BIRTHDATE_PARTS.length) return null;
  return BIRTHDATE_PARTS[nextIndex];
}

function applyBirthDatePartValue(root, part, rawValue) {
  const input = partInput(root, part);
  if (!input) return;

  let result;
  if (part === 'month') result = normalizeMonth(rawValue);
  else if (part === 'day') result = normalizeDay(rawValue);
  else result = normalizeYear(rawValue);

  input.value = result.text;
  syncBirthDateHidden(root);

  if (result.advance) {
    const next = adjacentBirthDatePart(part, 1);
    if (next) focusBirthDatePart(root, next);
  }
}

function parsePastedBirthDate(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return { month: iso[2], day: iso[3], year: iso[1] };
  }

  const slash = raw.match(/^(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})$/);
  if (slash) {
    return {
      month: slash[1].padStart(2, '0'),
      day: slash[2].padStart(2, '0'),
      year: slash[3],
    };
  }

  const digits = raw.replace(/\D/g, '');
  if (digits.length === 8) {
    return {
      month: digits.slice(0, 2),
      day: digits.slice(2, 4),
      year: digits.slice(4, 8),
    };
  }

  return null;
}

export function setBirthDateInputValue(root, isoDate) {
  if (!root) return;

  const monthInput = partInput(root, 'month');
  const dayInput = partInput(root, 'day');
  const yearInput = partInput(root, 'year');
  if (!monthInput || !dayInput || !yearInput) return;

  const match = String(isoDate || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    monthInput.value = '';
    dayInput.value = '';
    yearInput.value = '';
    syncBirthDateHidden(root);
    return;
  }

  monthInput.value = match[2];
  dayInput.value = match[3];
  yearInput.value = match[1];
  syncBirthDateHidden(root);
}

export function bindBirthDateInput(root) {
  if (!root || root.dataset.birthDateBound === 'true') return;
  root.dataset.birthDateBound = 'true';

  BIRTHDATE_PARTS.forEach((part) => {
    const input = partInput(root, part);
    if (!input) return;

    input.addEventListener('input', () => {
      applyBirthDatePartValue(root, part, input.value);
    });

    input.addEventListener('keydown', (event) => {
      if (event.key !== 'Backspace') return;
      if (input.value !== '') return;

      const previous = adjacentBirthDatePart(part, -1);
      if (!previous) return;

      event.preventDefault();
      const previousInput = partInput(root, previous);
      if (!previousInput) return;

      previousInput.value = previousInput.value.slice(0, -1);
      previousInput.focus();
      syncBirthDateHidden(root);
    });

    input.addEventListener('paste', (event) => {
      const pasted = event.clipboardData?.getData('text') || '';
      const parsed = parsePastedBirthDate(pasted);
      if (!parsed) return;

      event.preventDefault();
      partInput(root, 'month').value = parsed.month;
      partInput(root, 'day').value = parsed.day;
      partInput(root, 'year').value = parsed.year;
      syncBirthDateHidden(root);
      focusBirthDatePart(root, 'year');
    });
  });

  syncBirthDateHidden(root);
}
