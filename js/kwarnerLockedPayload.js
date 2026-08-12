/** KWarner locked-frame PDF payload from a saved program package. */

import { buildProgramReportPayload } from './programReportPrintout.js';
import { KWARNER_FOOD_PLAN_LEAD, KWARNER_WELCOME_COPY } from './kwarnerLockedPreviewFixtures.js';

export function buildKwarnerLockedPayloadFromPackage(pkg) {
  const payload = buildProgramReportPayload(pkg);
  payload.welcome = KWARNER_WELCOME_COPY;
  if (payload.foodPlan) {
    payload.foodPlan.lead = KWARNER_FOOD_PLAN_LEAD;
  }
  delete payload.gettingStarted;
  delete payload.stepsToSuccess;
  return payload;
}
