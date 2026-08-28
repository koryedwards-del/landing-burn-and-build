/** Client name and date helpers for PDF printouts. */

import { localDateKey } from './programPackageData.js';

/** Long month name from a calendar date key (YYYY-MM-DD) — no UTC day shift. */
export function formatProgramDateLong(isoOrKey) {
  const key = localDateKey(isoOrKey ?? new Date());
  if (!key) return '';
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function programClientName(pkg) {
  return pkg?.intake?.preferredName || 'You';
}

/** Calendar date key for PDF header/footer — user's local day when available. */
export function programPreparedDate(pkg) {
  const program = pkg?.program;
  const timeZone = program?.clientTimezone;
  return (
    localDateKey(program?.foodPlanCreatedDate)
    || localDateKey(program?.issuedAtLocalDate)
    || localDateKey(program?.firstSavedAtLocalDate)
    || localDateKey(program?.issuedAt, timeZone)
    || localDateKey(program?.issuedAt)
    || localDateKey(program?.startDate)
    || ''
  );
}

export function programClientNameUpper(pkg) {
  return String(programClientName(pkg) || 'You').trim().toUpperCase();
}
