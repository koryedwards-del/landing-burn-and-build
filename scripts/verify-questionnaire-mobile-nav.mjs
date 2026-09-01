/** Verify questionnaire mobile nav helpers. */
import assert from 'node:assert/strict';
import { scrollFieldIntoView } from '../js/questionnaireMobileNavHelpers.js';

assert.equal(typeof scrollFieldIntoView, 'function');
assert.equal(typeof (await import('../js/questionnaireMobileNavHelpers.js')).initQuestionnaireMobileNav, 'function');

console.log('ok  questionnaire mobile nav checks');
