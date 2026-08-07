import { createPrintPdf } from './creator.js';
import {
  drawGuidedLesson,
  drawServingsLesson,
} from './drawProgramReportNarrative.js';
import { drawWelcomeNarrative } from './drawSeminar.js';
import { validatePrintPayload } from './validate.js';

export async function renderProgramReportPdf(payload, { title } = {}) {
  validatePrintPayload('programreport', payload);

  const creator = createPrintPdf({
    title: title || payload.title || 'Program Report',
    author: 'Burn & Build Diet',
  });

  drawWelcomeNarrative(creator.doc, payload);
  drawGuidedLesson(creator.doc, payload, payload.bodyTodayNarrative);
  drawGuidedLesson(creator.doc, payload, payload.progressNarrative);
  drawGuidedLesson(creator.doc, payload, payload.foodPlanNarrative);
  drawServingsLesson(creator.doc, payload, payload.servingsNarrative);

  return creator.finish();
}
