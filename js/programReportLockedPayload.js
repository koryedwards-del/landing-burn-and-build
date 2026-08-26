/** Burn & Build Diet program-report PDF payload from a saved program package. */

import { buildProgramReportPayload } from './programReportPrintout.js';
import {
  PROGRAM_REPORT_FOOD_GROUPS_INTRO,
  PROGRAM_REPORT_FOOD_PLAN_HOWTO,
  PROGRAM_REPORT_FOOD_PLAN_LEAD,
  PROGRAM_REPORT_FOOD_PLAN_MEASURE_TIP,
  PROGRAM_REPORT_FOOD_PLAN_TO_USE,
  PROGRAM_REPORT_MEAL_BUILD_STEPS,
  PROGRAM_REPORT_WELCOME_COPY,
} from './programReportCopy.js';

/** Apply Burn & Build Diet program-report copy and layout fields to a print payload. */
export function applyProgramReportLockedCopy(payload) {
  payload.welcome = PROGRAM_REPORT_WELCOME_COPY;
  if (payload.foodPlan) {
    payload.foodPlan.lead = PROGRAM_REPORT_FOOD_PLAN_LEAD;
    payload.foodPlan.howToParagraphs = [...PROGRAM_REPORT_FOOD_PLAN_HOWTO];
    payload.foodPlan.measureTip = PROGRAM_REPORT_FOOD_PLAN_MEASURE_TIP;
    payload.foodPlan.toUseThisPlan = PROGRAM_REPORT_FOOD_PLAN_TO_USE;
    payload.foodPlan.macroSignalIntro = [...PROGRAM_REPORT_FOOD_GROUPS_INTRO];
  }
  if (payload.servings) {
    payload.servings.mealBuildSteps = [...PROGRAM_REPORT_MEAL_BUILD_STEPS];
  }
  delete payload.gettingStarted;
  delete payload.stepsToSuccess;
  return payload;
}

export function buildProgramReportLockedPayload(pkg, options = {}) {
  return applyProgramReportLockedCopy(buildProgramReportPayload(pkg, options));
}
