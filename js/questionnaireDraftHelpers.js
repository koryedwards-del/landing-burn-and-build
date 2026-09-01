/** In-progress questionnaire draft — sessionStorage with TTL. */

export const QUESTIONNAIRE_DRAFT_STORAGE_KEY = 'bnb_questionnaire_draft';
export const QUESTIONNAIRE_DRAFT_VERSION = 1;
export const QUESTIONNAIRE_DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

export function isQuestionnaireDraftFresh(savedAt, now = Date.now()) {
  const savedMs = Date.parse(String(savedAt || ''));
  if (!Number.isFinite(savedMs)) return false;
  return now - savedMs <= QUESTIONNAIRE_DRAFT_TTL_MS;
}

export function clearQuestionnaireDraft() {
  try {
    sessionStorage.removeItem(QUESTIONNAIRE_DRAFT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function loadQuestionnaireDraft() {
  try {
    const raw = sessionStorage.getItem(QUESTIONNAIRE_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw);
    if (draft?.v !== QUESTIONNAIRE_DRAFT_VERSION || !draft.values) {
      clearQuestionnaireDraft();
      return null;
    }
    if (!isQuestionnaireDraftFresh(draft.savedAt)) {
      clearQuestionnaireDraft();
      return null;
    }
    return draft;
  } catch {
    clearQuestionnaireDraft();
    return null;
  }
}

export function saveQuestionnaireDraft(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return;
  try {
    sessionStorage.setItem(QUESTIONNAIRE_DRAFT_STORAGE_KEY, JSON.stringify({
      v: QUESTIONNAIRE_DRAFT_VERSION,
      savedAt: new Date().toISOString(),
      step: snapshot.step,
      infoFieldIndex: snapshot.infoFieldIndex,
      occupationFieldIndex: snapshot.occupationFieldIndex,
      bodyFieldIndex: snapshot.bodyFieldIndex,
      exerciseFieldIndex: snapshot.exerciseFieldIndex,
      values: snapshot.values,
    }));
  } catch {
    /* ignore quota / private mode */
  }
}
