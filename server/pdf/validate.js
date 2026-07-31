import { PDF_PERSONALIZED_VIEWS, PDF_VIEWS } from './constants.js';

function validationError(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

function requireString(value, field) {
  if (value != null && typeof value !== 'string') {
    throw validationError(`${field} must be a string.`);
  }
}

function requireArray(value, field) {
  if (value != null && !Array.isArray(value)) {
    throw validationError(`${field} must be an array.`);
  }
}

export function validatePrintPayload(view, payload) {
  if (!PDF_VIEWS.has(view)) {
    throw validationError(`PDF view not supported: ${view}`);
  }

  if (!PDF_PERSONALIZED_VIEWS.has(view)) {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    throw validationError(`Personalized PDF view requires payload: ${view}`);
  }

  requireString(payload.title, 'title');
  requireString(payload.clientName, 'clientName');
  requireString(payload.preparedAt, 'preparedAt');

  if (payload.empty != null && typeof payload.empty !== 'boolean') {
    throw validationError('empty must be a boolean.');
  }

  if (view === 'week') {
    requireArray(payload.weekDays, 'weekDays');
    requireArray(payload.rows, 'rows');

    payload.weekDays?.forEach((day, index) => {
      if (!day || typeof day !== 'object') {
        throw validationError(`weekDays[${index}] must be an object.`);
      }
      requireString(day.id, `weekDays[${index}].id`);
      requireString(day.label, `weekDays[${index}].label`);
    });

    payload.rows?.forEach((row, index) => {
      if (!row || typeof row !== 'object') {
        throw validationError(`rows[${index}] must be an object.`);
      }
      requireString(row.id, `rows[${index}].id`);
      requireString(row.label, `rows[${index}].label`);
      if (row.cells != null && typeof row.cells !== 'object') {
        throw validationError(`rows[${index}].cells must be an object.`);
      }
    });
  }

  if (view === 'shopping') {
    requireArray(payload.groups, 'groups');

    payload.groups?.forEach((group, index) => {
      if (!group || typeof group !== 'object') {
        throw validationError(`groups[${index}] must be an object.`);
      }
      requireString(group.category, `groups[${index}].category`);
      requireArray(group.rows, `groups[${index}].rows`);

      group.rows?.forEach((row, rowIndex) => {
        if (!row || typeof row !== 'object') {
          throw validationError(`groups[${index}].rows[${rowIndex}] must be an object.`);
        }
        requireString(row.foodName, `groups[${index}].rows[${rowIndex}].foodName`);
        requireString(row.amount, `groups[${index}].rows[${rowIndex}].amount`);
      });
    });
  }

  return payload;
}
