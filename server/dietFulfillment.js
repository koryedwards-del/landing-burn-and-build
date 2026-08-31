import { dietPdfDocumentLabel } from '../js/dietPdfNamingHelpers.js';
import { buildSampleDietPrintoutPayload } from '../js/sampleDietPrintoutData.js';
import { renderSampleDietPrintout } from './pdf/renderSampleDietPrintout.js';
import { getProgramById, isProgramPaid, releaseDietEmailSendClaim, tryClaimDietEmailSend, wasDietEmailSent, getProgramPaidAt } from './db.js';
import { writeStoredDietPdf } from './dietPdfStorage.js';
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

/** Generate, store, and return the Burn & Build Diet PDF buffer. Always renders fresh. */
export async function ensureDietPdf(email, programId) {
  const id = String(programId || '').trim();
  if (!id) throw new Error('Missing program id.');
  if (!isProgramPaid(email, id)) throw new Error('Purchase required for this program.');

  const pkg = getProgramById(email, id);
  if (!pkg) throw new Error('Program not found for this email.');

  const payload = buildSampleDietPrintoutPayload(pkg);
  const title = dietPdfDocumentLabel({ preferredName: pkg?.intake?.preferredName, pkg });
  const pdf = await renderSampleDietPrintout(payload, { title });
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
      emailAlreadySent: true,
      emailError: null,
      forced: false,
    };
  }

  let claimedSend = false;
  if (!forceEmail) {
    claimedSend = tryClaimDietEmailSend(email, programId);
    if (!claimedSend) {
      return {
        pdfReady: true,
        emailSent: false,
        emailSkipped: true,
        emailAlreadySent: true,
        emailError: null,
        forced: false,
      };
    }
  }

  const emailResult = await sendDietPdfEmail({
    to: email,
    preferredName,
    pkg,
    pdfBuffer: pdf,
    programId,
    paidAt: getProgramPaidAt(email, programId),
    forceResend: forceEmail,
  });

  if (emailResult.ok) {
    console.info('[diet-email] Delivery complete', { email, programId, resendId: emailResult.id, forced: forceEmail });
  } else {
    if (claimedSend) {
      releaseDietEmailSendClaim(email, programId);
    }
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
    emailAlreadySent: !emailResult.ok && claimedSend === false && !forceEmail,
    emailError,
    forced: forceEmail,
  };
}
