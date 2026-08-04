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

  if (view === 'week') {
    requireArray(payload.weekDays, 'weekDays');
    requireArray(payload.rows, 'rows');

    payload.weekDays?.forEach((day, index) => {
      if (!day || typeof day !== 'object') {
        throw pdfError(`weekDays[${index}] must be an object.`);
      }
      requireString(day.id, `weekDays[${index}].id`, { required: true });
      requireString(day.label, `weekDays[${index}].label`, { required: true });
    });

    payload.rows?.forEach((row, index) => {
      if (!row || typeof row !== 'object') {
        throw pdfError(`rows[${index}] must be an object.`);
      }
      requireString(row.id, `rows[${index}].id`, { required: true });
      requireString(row.label, `rows[${index}].label`, { required: true });
      if (row.cells != null && typeof row.cells !== 'object') {
        throw pdfError(`rows[${index}].cells must be an object.`);
      }
    });
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

  if (view === 'shopping') {
    requireArray(payload.groups, 'groups');

    payload.groups?.forEach((group, index) => {
      if (!group || typeof group !== 'object') {
        throw pdfError(`groups[${index}] must be an object.`);
      }
      requireString(group.category, `groups[${index}].category`, { required: true });
      requireArray(group.rows, `groups[${index}].rows`);

      group.rows?.forEach((row, rowIndex) => {
        if (!row || typeof row !== 'object') {
          throw pdfError(`groups[${index}].rows[${rowIndex}] must be an object.`);
        }
        requireString(row.foodName, `groups[${index}].rows[${rowIndex}].foodName`, { required: true });
        requireString(row.amount, `groups[${index}].rows[${rowIndex}].amount`, { required: true });
      });
    });
  }

  return payload;
}
