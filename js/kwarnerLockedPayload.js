/** Burn & Build Diet program-report PDF payload from a saved program package. */

import { buildProgramReportPayload } from './programReportPrintout.js';
import {
  KWARNER_FOOD_GROUPS_INTRO,
  KWARNER_FOOD_PLAN_HOWTO,
  KWARNER_FOOD_PLAN_LEAD,
  KWARNER_MEAL_BUILD_STEPS,
  KWARNER_WELCOME_COPY,
} from './kwarnerLockedCopy.js';

/** Apply Burn & Build Diet program-report copy and layout fields to a print payload. */
export function applyKwarnerLockedPayload(payload) {
  payload.welcome = KWARNER_WELCOME_COPY;
  if (payload.foodPlan) {
    payload.foodPlan.lead = KWARNER_FOOD_PLAN_LEAD;
    payload.foodPlan.howToParagraphs = [...KWARNER_FOOD_PLAN_HOWTO];
    payload.foodPlan.macroSignalIntro = [...KWARNER_FOOD_GROUPS_INTRO];
  }
  if (payload.servings) {
    payload.servings.mealBuildSteps = [...KWARNER_MEAL_BUILD_STEPS];
  }
  delete payload.gettingStarted;
  delete payload.stepsToSuccess;
  return payload;
}

export function buildKwarnerLockedPayloadFromPackage(pkg, options = {}) {
  return applyKwarnerLockedPayload(buildProgramReportPayload(pkg, options));
}
