/** Session handoff — questionnaire → checkout (Burn & Build Diet PDF download). */

export const BUILT_PROGRAM_KEY = 'bnb_built_package';
export const PAID_PROGRAM_ID_KEY = 'bnb_paid_program_id';

export function persistPaidProgramId(programId) {
  const id = String(programId || '').trim();
  if (!id) return;
  try {
    sessionStorage.setItem(PAID_PROGRAM_ID_KEY, id);
    localStorage.setItem(PAID_PROGRAM_ID_KEY, id);
  } catch {
    /* ignore */
  }
}

export function readPaidProgramId() {
  return sessionStorage.getItem(PAID_PROGRAM_ID_KEY)
    || (typeof localStorage !== 'undefined' ? localStorage.getItem(PAID_PROGRAM_ID_KEY) : '')
    || '';
}

export function persistProgramBridge(pkg) {
  if (!pkg) return;
  const programId = String(pkg?.program?.id || '').trim();
  if (programId) persistPaidProgramId(programId);
  try {
    sessionStorage.setItem(BUILT_PROGRAM_KEY, JSON.stringify(pkg));
  } catch (err) {
    console.error(err);
  }
}

export function loadProgramBridge() {
  try {
    const raw = sessionStorage.getItem(BUILT_PROGRAM_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    sessionStorage.removeItem(BUILT_PROGRAM_KEY);
    return null;
  }
}
