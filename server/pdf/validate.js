import {
  isPersonalizedPrintShopView,
  isPrintShopView,
} from '../../js/printShopViews.js';
import { pdfError } from './errors.js';

function requireString(value, field, { required = false } = {}) {
  if (value == null || value === '') {
    if (required) throw pdfError(`${field} is required.`);
    return;
  }
  if (typeof value !== 'string') {
    throw pdfError(`${field} must be a string.`);
  }
}

function requireArray(value, field) {
  if (value != null && !Array.isArray(value)) {
    throw pdfError(`${field} must be an array.`);
  }
}

export function validatePrintView(view) {
  if (!view) {
    throw pdfError('Missing print view.');
  }
  if (!isPrintShopView(view)) {
    throw pdfError(`PDF view not supported: ${view}`);
  }
  return view;
}

export function validatePrintPayload(view, payload) {
  validatePrintView(view);

  if (!isPersonalizedPrintShopView(view)) {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    throw pdfError(`Personalized PDF view requires payload: ${view}`);
  }

  requireString(payload.title, 'title', { required: true });
  requireString(payload.clientName, 'clientName', { required: true });
  requireString(payload.preparedAt, 'preparedAt', { required: true });

  if (payload.empty != null && typeof payload.empty !== 'boolean') {
    throw pdfError('empty must be a boolean.');
  }

  if (view === 'programreport') {
    requireString(payload.preparedDate, 'preparedDate', { required: true });
    if (!payload.stepsToSuccess && !payload.welcome) {
      throw pdfError('stepsToSuccess or welcome is required.');
    }
    if (payload.stepsToSuccess) {
      if (typeof payload.stepsToSuccess !== 'object') {
        throw pdfError('stepsToSuccess must be an object.');
      }
      if (!Array.isArray(payload.stepsToSuccess.steps) || !payload.stepsToSuccess.steps.length) {
        throw pdfError('stepsToSuccess.steps is required.');
      }
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
  }

  return payload;
}
