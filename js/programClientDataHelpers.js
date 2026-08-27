/** Client name and date helpers for PDF printouts. */

import { localDateKey } from './programPackageData.js';

export function formatProgramDateLong(iso) {
  if (!iso) {
    return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function programClientName(pkg) {
  return pkg?.intake?.preferredName || 'You';
}

/** ISO date key for PDF header/footer (food plan created or program issued). */
export function programPreparedDate(pkg) {
  return localDateKey(
    pkg?.program?.foodPlanCreatedDate
    || pkg?.program?.issuedAtLocalDate
    || pkg?.program?.issuedAt
    || pkg?.program?.startDate,
  ) || '';
}

export function programClientNameUpper(pkg) {
  return String(programClientName(pkg) || 'You').trim().toUpperCase();
}
