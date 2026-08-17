import {
  getProgramById,
  isProgramPaid,
  listDueBodyCompFollowups,
  markBodyCompFollowupSent,
  scheduleBodyCompFollowup,
} from './db.js';
import { sendBodyCompFollowupEmail } from './dietEmail.js';

const DEFAULT_DELAY_DAYS = 2;

function followupDelayMs() {
  const days = Number(process.env.BODY_COMP_FOLLOWUP_DAYS || DEFAULT_DELAY_DAYS);
  if (!Number.isFinite(days) || days < 0) return DEFAULT_DELAY_DAYS * 24 * 60 * 60 * 1000;
  return days * 24 * 60 * 60 * 1000;
}

function programUsedEstimate(pkg) {
  return pkg?.intake?.fatSource === 'guess';
}

/** Queue a follow-up email when intake used an estimated body fat %. */
export function scheduleBodyCompFollowupIfNeeded(email, programId) {
  const pkg = getProgramById(email, programId);
  if (!pkg || !programUsedEstimate(pkg)) return { scheduled: false };

  const scheduledAt = new Date(Date.now() + followupDelayMs()).toISOString();
  const scheduled = scheduleBodyCompFollowup(email, programId, scheduledAt);
  if (scheduled) {
    console.log(`[body-comp-followup] Scheduled for ${email} program ${programId} at ${scheduledAt}`);
  }
  return { scheduled };
}

/** Send due follow-up emails (estimators only). */
export async function processDueBodyCompFollowups() {
  const due = listDueBodyCompFollowups();
  let sent = 0;
  let failed = 0;

  for (const row of due) {
    const { program_id: programId, email } = row;
    if (!isProgramPaid(email, programId)) {
      markBodyCompFollowupSent(programId);
      continue;
    }

    const pkg = getProgramById(email, programId);
    if (!pkg || !programUsedEstimate(pkg)) {
      markBodyCompFollowupSent(programId);
      continue;
    }

    const result = await sendBodyCompFollowupEmail({
      to: email,
      preferredName: pkg.intake?.preferredName,
    });

    if (result.ok) {
      markBodyCompFollowupSent(programId);
      sent += 1;
      console.log(`[body-comp-followup] Sent to ${email} program ${programId}`);
    } else if (result.skipped) {
      failed += 1;
    } else {
      failed += 1;
      console.error(`[body-comp-followup] Failed for ${email} program ${programId}:`, result.message);
    }
  }

  return { due: due.length, sent, failed };
}

const POLL_MS = Number(process.env.BODY_COMP_FOLLOWUP_POLL_MS) || 60 * 60 * 1000;

export function startBodyCompFollowupWorker() {
  const tick = () => {
    processDueBodyCompFollowups().catch((err) => {
      console.error('[body-comp-followup] Worker error:', err.message);
    });
  };
  tick();
  return setInterval(tick, POLL_MS);
}
