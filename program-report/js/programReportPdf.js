/** Program report PDF — client fetch for the five-page seminar document. */

import { apiUrl } from '../../js/apiConfig.js';
import {
  PREVIEW_PROGRAM_REPORT_PDF,
  buildProgramReportPayload,
  programReportDocumentTitle,
} from '../../js/programReportPrintout.js';

export function buildProgramReportPrintPayload(programPackage, options = {}) {
  return buildProgramReportPayload(programPackage, options);
}

function isPreviewProgramPackage(programPackage) {
  return programPackage?.meta?.source === 'program-report-preview';
}

async function fetchPreviewProgramReportPdf() {
  const res = await fetch(PREVIEW_PROGRAM_REPORT_PDF, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Could not load sample program report PDF.');
  }
  const blob = await res.blob();
  const header = await blob.slice(0, 5).text();
  if (!header.startsWith('%PDF-')) {
    throw new Error('Could not load sample program report PDF.');
  }
  return blob;
}

export async function fetchProgramReportPdf(programPackage, options = {}) {
  if (isPreviewProgramPackage(programPackage)) {
    return fetchPreviewProgramReportPdf();
  }

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
  if (blob.size < 40_000) {
    return fetchPreviewProgramReportPdf();
  }
  return blob;
}
