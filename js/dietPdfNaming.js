/** Diet plan PDF document label + download filename. */

import { programClientName } from './programBridgeUi.js';
import { localDateKey } from './programPackage.js';
import { seminarPreparedDate } from './programReportPrintout.js';

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
  return `B&B-${name}-${date}`;
}

export function dietPdfFilename(options = {}) {
  return `${dietPdfDocumentLabel(options)}.pdf`;
}
