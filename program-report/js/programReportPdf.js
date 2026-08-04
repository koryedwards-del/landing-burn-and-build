/** Program report PDF — client fetch for the five-page seminar document. */

import { apiUrl } from '../../js/apiConfig.js';
import { buildProgramReportPayload, programReportDocumentTitle } from '../../js/programReportPrintout.js';

export function buildProgramReportPrintPayload(programPackage, options = {}) {
  return buildProgramReportPayload(programPackage, options);
}

export async function fetchProgramReportPdf(programPackage, options = {}) {
  const payload = buildProgramReportPrintPayload(programPackage, options);
  const res = await fetch(apiUrl('/api/print/pdf'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({
      ...payload,
      title: programReportDocumentTitle(programPackage),
    }),
  });

  if (!res.ok) {
    let message = 'Could not generate program report PDF.';
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch (_) {
      /* ignore */
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  const header = await blob.slice(0, 5).text();
  if (!header.startsWith('%PDF-')) {
    throw new Error('Could not load program report PDF.');
  }
  return blob;
}
