/** KWarner locked-frame PDF payload from a saved program package. */

import { buildProgramReportPayload } from './programReportPrintout.js';
import { KWARNER_FOOD_PLAN_LEAD, KWARNER_FOOD_PLAN_STEP4, KWARNER_WELCOME_COPY } from './kwarnerLockedPreviewFixtures.js';

export function buildKwarnerLockedPayloadFromPackage(pkg) {
  const payload = buildProgramReportPayload(pkg);
  payload.welcome = KWARNER_WELCOME_COPY;
  if (payload.foodPlan) {
    payload.foodPlan.lead = KWARNER_FOOD_PLAN_LEAD;
  }
  const step4 = payload.foodPlanNarrative?.blocks?.find(
    (block) => block.title === 'Step 4 — Turn targets into servings',
  );
  if (step4) {
    step4.paragraphs = [...KWARNER_FOOD_PLAN_STEP4];
  }
  delete payload.gettingStarted;
  delete payload.stepsToSuccess;
  return payload;
}
