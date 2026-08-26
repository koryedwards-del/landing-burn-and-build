import { pdfError } from './errors.js';

const PROGRAM_REPORT_VIEW = 'programreport';

function requireString(value, field, { required = false } = {}) {
  if (value == null || value === '') {
    if (required) throw pdfError(`${field} is required.`);
    return;
  }
  if (typeof value !== 'string') {
    throw pdfError(`${field} must be a string.`);
  }
}

export function validatePrintView(view) {
  if (!view) {
    throw pdfError('Missing print view.');
  }
  if (view !== PROGRAM_REPORT_VIEW) {
    throw pdfError(`PDF view not supported: ${view}`);
  }
  return view;
}

export function validatePrintPayload(view, payload) {
  validatePrintView(view);

  if (!payload || typeof payload !== 'object') {
    throw pdfError(`Personalized PDF view requires payload: ${view}`);
  }

  requireString(payload.title, 'title', { required: true });
  requireString(payload.clientName, 'clientName', { required: true });
  requireString(payload.preparedAt, 'preparedAt', { required: true });

  if (payload.empty != null && typeof payload.empty !== 'boolean') {
    throw pdfError('empty must be a boolean.');
  }

  requireString(payload.preparedDate, 'preparedDate', { required: true });
  if (!payload.welcome || typeof payload.welcome !== 'object') {
    throw pdfError('welcome is required.');
  }
  if (!Array.isArray(payload.welcome.intro) || !payload.welcome.intro.length) {
    throw pdfError('welcome.intro is required.');
  }
  if (!payload.leanBodyAnalysis || typeof payload.leanBodyAnalysis !== 'object') {
    throw pdfError('leanBodyAnalysis is required.');
  }
  if (!payload.history || !Array.isArray(payload.history.rows)) {
    throw pdfError('history.rows is required.');
  }
  if (!payload.foodPlan || typeof payload.foodPlan !== 'object') {
    throw pdfError('foodPlan is required.');
  }
  if (!payload.servings || typeof payload.servings !== 'object') {
    throw pdfError('servings is required.');
  }

  return payload;
}
