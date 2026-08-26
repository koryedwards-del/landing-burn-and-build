#!/usr/bin/env node
/** Questionnaire intake smoke — static checks for the live workroom flow. */

import { readFileSync } from 'fs';

function read(path) {
  return readFileSync(path, 'utf8');
}

const html = read('questionnaire/index.html');
const js = read('questionnaire/js/questionnaire.js');
const { heightFromParts } = await import('../js/onboardingEngine.js');
const { QUESTIONNAIRE_START_PATH } = await import('../js/siteUrls.js');

const checks = [
  ['workroom shell in HTML', html.includes('class="q-app--workroom"') && html.includes('<body class="q-app--workroom">')],
  ['step 1 Contact Information', html.includes('1. Contact Information') && html.includes('>Contact Information</h2>')],
  ['bottom nav visible in HTML', html.includes('id="q-step-nav"') && !html.includes('id="q-step-nav" hidden')],
  ['STEPS starts Contact Information', /label: 'Contact Information'/.test(js)],
  ['no Welcome step in STEPS', !/label: 'Welcome'/.test(js)],
  ['heightFromParts export', heightFromParts(5, 10) === 70],
  ['entry URL hash', QUESTIONNAIRE_START_PATH === '/questionnaire/#welcome'],
  ['intake accordion boot', js.includes('bindInfoAccordion') && js.includes('updateStepNav')],
];

let failed = 0;
for (const [label, ok] of checks) {
  if (ok) {
    console.log(`ok  ${label}`);
  } else {
    console.error(`FAIL ${label}`);
    failed += 1;
  }
}

if (failed) process.exit(1);
console.log('\nQuestionnaire intake checks passed.');
