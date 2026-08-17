import { dietPdfFilename } from './dietPdfStorage.js';

const RESEND_API = 'https://api.resend.com/emails';

export function dietEmailConfigured() {
  return !!String(process.env.RESEND_API_KEY || '').trim();
}

function emailFrom() {
  return process.env.DIET_EMAIL_FROM || 'Burn & Build <orders@burnandbuilddiet.com>';
}

export async function sendDietPdfEmail({ to, preferredName, pdfBuffer }) {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  if (!apiKey) {
    console.warn('[diet-email] RESEND_API_KEY not set — skipping email.');
    return { ok: false, skipped: true };
  }

  const filename = dietPdfFilename(preferredName);
  const firstName = String(preferredName || '').trim().split(/\s+/)[0] || 'there';

  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: emailFrom(),
      to: [to],
      subject: 'Your Burn & Build Diet',
      html: `
        <p>Hi ${firstName},</p>
        <p>Payment confirmed — your personalized <strong>Burn &amp; Build Diet</strong> is attached.</p>
        <p>Save this PDF somewhere you will see it every day. It is your full diet plan.</p>
        <p>Need it again later? Visit <a href="https://burnandbuilddiet.com/get-your-diet/">burnandbuilddiet.com/get-your-diet</a> and enter your email to download or resend.</p>
        <p>— Burn &amp; Build<br>support@burnandbuilddiet.com</p>
      `,
      attachments: [{
        filename,
        content: Buffer.from(pdfBuffer).toString('base64'),
      }],
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('[diet-email] Resend error:', data);
    return { ok: false, message: data?.message || 'Email could not be sent.' };
  }

  return { ok: true, id: data.id };
}

export async function sendBodyCompFollowupEmail({ to, preferredName }) {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  if (!apiKey) {
    console.warn('[body-comp-followup] RESEND_API_KEY not set — skipping email.');
    return { ok: false, skipped: true };
  }

  const firstName = String(preferredName || '').trim().split(/\s+/)[0] || 'there';
  const supportEmail = 'support@burnandbuilddiet.com';

  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: emailFrom(),
      to: [to],
      subject: 'The option for a complimentary updated plan',
      html: `
        <p>Hi ${firstName},</p>
        <p>You built your Burn &amp; Build program using an estimated body fat percentage. Accurate body composition is the biggest driver of your serving calculations.</p>
        <p>When you have a professional body comp test — DEXA, Bod Pod, skinfolds, InBody, or similar — you have the option of a complimentary updated plan. Email <a href="mailto:${supportEmail}">${supportEmail}</a> with your new number and we will take care of it.</p>
        <p>— Burn &amp; Build<br>${supportEmail}</p>
      `,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('[body-comp-followup] Resend error:', data);
    return { ok: false, message: data?.message || 'Email could not be sent.' };
  }

  return { ok: true, id: data.id };
}
