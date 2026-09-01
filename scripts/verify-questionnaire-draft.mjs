#!/usr/bin/env node
import {
  isQuestionnaireDraftFresh,
  QUESTIONNAIRE_DRAFT_TTL_MS,
  QUESTIONNAIRE_DRAFT_VERSION,
} from '../js/questionnaireDraftHelpers.js';
import { requiresParentApproval } from '../js/parentConsentData.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(QUESTIONNAIRE_DRAFT_VERSION === 1, 'draft version');
assert(QUESTIONNAIRE_DRAFT_TTL_MS === 24 * 60 * 60 * 1000, 'draft ttl');

const now = Date.parse('2026-09-01T12:00:00.000Z');
assert(isQuestionnaireDraftFresh('2026-09-01T11:00:00.000Z', now), 'draft within ttl');
assert(!isQuestionnaireDraftFresh('2026-08-30T11:00:00.000Z', now), 'draft past ttl');
assert(!isQuestionnaireDraftFresh('', now), 'draft invalid date');

assert(!requiresParentApproval(null), 'empty age does not require parent');
assert(!requiresParentApproval(''), 'blank age does not require parent');
assert(!requiresParentApproval(15), 'under-16 does not require parent');
assert(requiresParentApproval(16), 'age 16 requires parent');
assert(requiresParentApproval(17), 'age 17 requires parent');
assert(!requiresParentApproval(18), 'age 18 does not require parent');

console.log('ok  questionnaire draft + parent consent checks');
