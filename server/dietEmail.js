import { dietPdfAttachmentFilename } from '../js/dietPdfNaming.js';
import { dietPdfDownloadUrl } from './dietPdfUrls.js';

const RESEND_API = 'https://api.resend.com/emails';

export function dietEmailConfigured() {
  return !!String(process.env.RESEND_API_KEY || '').trim();
}

function emailFrom() {
  return process.env.DIET_EMAIL_FROM || 'Burn & Build <orders@burnandbuilddiet.com>';
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendDietPdfEmail({ to, preferredName, pkg, pdfBuffer, programId, forceResend = false }) {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  if (!apiKey) {
    console.warn('[diet-email] RESEND_API_KEY not set — skipping email.');
    return { ok: false, skipped: true, message: 'Diet email is not configured on the server.' };
  }

  const filename = dietPdfAttachmentFilename({ preferredName, pkg });
  const firstName = escapeHtml(String(preferredName || '').trim().split(/\s+/)[0] || 'there');
  const downloadUrl = dietPdfDownloadUrl(to, programId);

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  const id = String(programId || '').trim();
  if (id && !forceResend) {
    headers['Idempotency-Key'] = `diet-pdf/${id}`;
  }

  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      from: emailFrom(),
      to: [to],
      subject: 'Your Burn & Build Diet',
      html: `
        <p>Hi ${firstName},</p>
        <p>Payment confirmed — your <strong>Burn &amp; Build Diet</strong> is ready.</p>
        <p><a href="${downloadUrl}">Download your Burn &amp; Build Diet</a></p>
        <p>Return to <a href="https://burnandbuilddiet.com/createyourfoodplan/">burnandbuilddiet.com/createyourfoodplan</a> anytime to download again.</p>
        <p>A copy is attached to this email.</p>
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
    console.error('[diet-email] Resend error:', { status: res.status, data, to, from: emailFrom(), filename });
    return { ok: false, message: data?.message || 'Email could not be sent.' };
  }

  console.info('[diet-email] Sent diet PDF', { to, programId: id || null, id: data.id });
  return { ok: true, id: data.id };
}
