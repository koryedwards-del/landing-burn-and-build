/** Program PDF document label + download filename. */

import { programClientName, programPreparedDate } from './programClientDataHelpers.js';
import { localDateKey } from './programPackageData.js';

const DIET_PDF_PREFIX = 'HARDKOR-Diet';

/** Product name for the full personalized PDF deliverable. */
export const BURN_AND_BUILD_DIET_PDF_NAME = 'The HARDKOR Diet';

function sanitizeNamePart(preferredName) {
  return String(preferredName || 'Client')
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60) || 'Client';
}

function formatCreationDate(isoOrDate) {
  const key = localDateKey(isoOrDate) || localDateKey(new Date());
  const [year, month, day] = key.split('-');
  return `${month}-${day}-${year}`;
}

export function dietPdfDocumentLabel({ preferredName, createdAt, pkg } = {}) {
  const name = sanitizeNamePart(preferredName || (pkg ? programClientName(pkg) : ''));
  const date = formatCreationDate(createdAt || (pkg ? programPreparedDate(pkg) : null));
  return `${DIET_PDF_PREFIX}-${name}-${date}`;
}

export function dietPdfFilename(options = {}) {
  return `${dietPdfDocumentLabel(options)}.pdf`;
}

/** Email attachments — ASCII-safe filename (no & in MIME headers). */
export function dietPdfAttachmentFilename(options = {}) {
  return dietPdfFilename(options).replace(/&/g, 'and');
}
