/** Program report PDF document label + download filename. */

import { programClientName } from './programBridgeUi.js';
import { localDateKey } from './programPackage.js';
import { seminarPreparedDate } from './programReportPrintout.js';

const DIET_PDF_PREFIX = 'Burn&Build';

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
  const date = formatCreationDate(createdAt || (pkg ? seminarPreparedDate(pkg) : null));
  return `${DIET_PDF_PREFIX}-${name}-${date}`;
}

export function dietPdfFilename(options = {}) {
  return `${dietPdfDocumentLabel(options)}.pdf`;
}

/** Email attachments — ASCII-safe filename (no & in MIME headers). */
export function dietPdfAttachmentFilename(options = {}) {
  return dietPdfFilename(options).replace(/&/g, 'and');
}
