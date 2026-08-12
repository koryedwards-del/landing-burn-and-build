import { buildKwarnerLockedPayloadFromPackage } from '../js/kwarnerLockedPayload.js';
import { renderProgramReportKwarnerLockedPreview } from './pdf/renderProgramReportKwarnerLockedPreview.js';
import { getProgramById, isProgramPaid, markDietEmailSent, wasDietEmailSent } from './db.js';
import { readStoredDietPdf, writeStoredDietPdf } from './dietPdfStorage.js';
import { sendDietPdfEmail } from './dietEmail.js';

/** Generate (if needed), store, and return the personalized diet PDF buffer. */
export async function ensureDietPdf(email, programId) {
  const id = String(programId || '').trim();
  if (!id) throw new Error('Missing program id.');
  if (!isProgramPaid(email, id)) throw new Error('Purchase required for this program.');

  const cached = readStoredDietPdf(id);
  if (cached) return cached;

  const pkg = getProgramById(email, id);
  if (!pkg) throw new Error('Program not found for this email.');

  const payload = buildKwarnerLockedPayloadFromPackage(pkg);
  const pdf = await renderProgramReportKwarnerLockedPreview(payload);
  writeStoredDietPdf(id, pdf);
  return pdf;
}

/** Ensure PDF exists and email a copy (skips duplicate sends unless force). */
export async function fulfillDietDelivery(email, programId, { forceEmail = false } = {}) {
  const pdf = await ensureDietPdf(email, programId);
  const pkg = getProgramById(email, programId);
  const preferredName = pkg?.intake?.preferredName || 'Your';

  if (!forceEmail && wasDietEmailSent(email, programId)) {
    return {
      pdfReady: true,
      emailSent: false,
      emailSkipped: true,
      emailError: null,
      forced: false,
    };
  }

  const emailResult = await sendDietPdfEmail({
    to: email,
    preferredName,
    pdfBuffer: pdf,
  });

  if (emailResult.ok) {
    markDietEmailSent(email, programId);
  }

  return {
    pdfReady: true,
    emailSent: !!emailResult.ok,
    emailSkipped: !!emailResult.skipped,
    emailError: emailResult.ok ? null : (emailResult.message || 'Email failed'),
    forced: forceEmail,
  };
}
