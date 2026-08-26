import { dietPdfDocumentLabel } from '../js/dietPdfNaming.js';
import { buildProgramReportPayload } from '../js/programReportPrintout.js';
import { renderProgramReportPdf } from './pdf/renderProgramReport.js';
import { getProgramById, isProgramPaid, markDietEmailSent, wasDietEmailSent } from './db.js';
import { readStoredDietPdf, writeStoredDietPdf, isStoredDietPdfCurrent, deleteStoredDietPdf } from './dietPdfStorage.js';
import { dietEmailConfigured, sendDietPdfEmail } from './dietEmail.js';

const emailRetryTimers = new Map();

/** Background retries after checkout — PDF generation or Resend can lag the first attempt. */
export function scheduleDietEmailRetries(email, programId, { attempts = 6, delayMs = 5000 } = {}) {
  if (!dietEmailConfigured()) return;
  const key = `${normalizeRetryKey(email)}:${String(programId || '').trim()}`;
  if (wasDietEmailSent(email, programId)) return;
  if (emailRetryTimers.has(key)) return;

  let attempt = 0;
  const run = async () => {
    if (wasDietEmailSent(email, programId)) {
      emailRetryTimers.delete(key);
      return;
    }
    if (attempt >= attempts) {
      emailRetryTimers.delete(key);
      return;
    }
    attempt += 1;
    try {
      const result = await fulfillDietDelivery(email, programId, { forceEmail: attempt > 1 });
      if (result.emailSent || result.emailAlreadySent) {
        emailRetryTimers.delete(key);
        return;
      }
    } catch (err) {
      console.error(`[diet-email] retry ${attempt}/${attempts} failed:`, err.message);
    }
    setTimeout(run, delayMs);
  };

  emailRetryTimers.set(key, true);
  setTimeout(run, delayMs);
}

function normalizeRetryKey(email) {
  return String(email || '').trim().toLowerCase();
}

/** Generate (if needed), store, and return the Burn & Build Diet PDF (program report) buffer. */
export async function ensureDietPdf(email, programId, { forceRegenerate = false } = {}) {
  const id = String(programId || '').trim();
  if (!id) throw new Error('Missing program id.');
  if (!isProgramPaid(email, id)) throw new Error('Purchase required for this program.');

  if (!forceRegenerate && isStoredDietPdfCurrent(id)) {
    return readStoredDietPdf(id);
  }

  if (forceRegenerate || readStoredDietPdf(id)) {
    deleteStoredDietPdf(id);
  }

  const pkg = getProgramById(email, id);
  if (!pkg) throw new Error('Program not found for this email.');

  const payload = buildProgramReportPayload(pkg);
  const title = dietPdfDocumentLabel({ preferredName: pkg?.intake?.preferredName, pkg });
  const pdf = await renderProgramReportPdf(payload, { title });
  writeStoredDietPdf(id, pdf);
  return pdf;
}

/** Ensure PDF exists and email a copy (skips duplicate sends unless force). */
export async function fulfillDietDelivery(email, programId, { forceEmail = false } = {}) {
  const pdf = await ensureDietPdf(email, programId, { forceRegenerate: forceEmail });
  const pkg = getProgramById(email, programId);
  const preferredName = pkg?.intake?.preferredName || 'Your';

  if (!forceEmail && wasDietEmailSent(email, programId)) {
    return {
      pdfReady: true,
      emailSent: false,
      emailSkipped: true,
      emailAlreadySent: true,
      emailError: null,
      forced: false,
    };
  }

  const emailResult = await sendDietPdfEmail({
    to: email,
    preferredName,
    pkg,
    pdfBuffer: pdf,
    programId,
    forceResend: forceEmail,
  });

  if (emailResult.ok) {
    markDietEmailSent(email, programId);
    console.info('[diet-email] Delivery complete', { email, programId, resendId: emailResult.id, forced: forceEmail });
  } else {
    console.error('[diet-email] Delivery failed', {
      email,
      programId,
      forced: forceEmail,
      skipped: !!emailResult.skipped,
      message: emailResult.message,
    });
  }

  const emailError = emailResult.ok
    ? null
    : (emailResult.message || (emailResult.skipped ? 'Diet email is not configured on the server.' : 'Email could not be sent.'));

  return {
    pdfReady: true,
    emailSent: !!emailResult.ok,
    emailSkipped: !!emailResult.skipped,
    emailError,
    forced: forceEmail,
  };
}
