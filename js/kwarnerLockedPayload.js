/** KWarner locked-frame PDF payload from a saved program package. */

import { buildProgramReportPayload } from './programReportPrintout.js';
import {
  KWARNER_FOOD_GROUPS_INTRO,
  KWARNER_FOOD_PLAN_HOWTO,
  KWARNER_FOOD_PLAN_LEAD,
  KWARNER_MEAL_BUILD_STEPS,
  KWARNER_SERVINGS_INTRO,
  KWARNER_WELCOME_COPY,
} from './kwarnerLockedCopy.js';

export function buildKwarnerLockedPayloadFromPackage(pkg) {
  const payload = buildProgramReportPayload(pkg);
  payload.welcome = KWARNER_WELCOME_COPY;
  if (payload.foodPlan) {
    payload.foodPlan.lead = KWARNER_FOOD_PLAN_LEAD;
    payload.foodPlan.howToParagraphs = [...KWARNER_FOOD_PLAN_HOWTO];
    payload.foodPlan.macroSignalIntro = [...KWARNER_FOOD_GROUPS_INTRO];
  }
  if (payload.servings) {
    payload.servings.intro = [...KWARNER_SERVINGS_INTRO];
    payload.servings.mealBuildSteps = [...KWARNER_MEAL_BUILD_STEPS];
  }
  delete payload.gettingStarted;
  delete payload.stepsToSuccess;
  return payload;
}
