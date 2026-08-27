import { dietPdfAttachmentFilename } from '../js/dietPdfNamingHelpers.js';
import { DIET_PDF_GENERATION_VERSION } from '../js/assetVersionData.js';
import {
  brandLogoUrl,
  dietPdfDownloadUrl,
  menuPlanTemplateUrl,
  purchaserPortalUrl,
  siteOrigin,
  SUPPORT_EMAIL,
} from './dietPdfUrls.js';

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

function firstNameFromPreferredName(preferredName) {
  return String(preferredName || '').trim().split(/\s+/)[0] || 'there';
}

function buildDietEmailText({ firstName, downloadUrl, portalUrl, templateUrl }) {
  return [
    `Hi ${firstName},`,
    '',
    'Thank you for purchasing the Burn & Build Diet.',
    '',
    'Your payment is confirmed and your personalized program is ready.',
    '',
    `Download your Burn & Build Diet: ${downloadUrl}`,
    '',
    `Need it again later? Open your download page: ${portalUrl}`,
    'Your program opens automatically when you return.',
    '',
    'A copy of your Burn & Build Diet is attached to this email.',
    '',
    'Resources',
    `Print a blank Menu Plan worksheet: ${templateUrl}`,
    '',
    `Questions or need help getting started? Contact us at ${SUPPORT_EMAIL} — we are happy to help.`,
    '',
    '— Burn & Build',
    siteOrigin(),
  ].join('\n');
}

function buildDietEmailHtml({ firstName, downloadUrl, portalUrl, templateUrl, logoUrl }) {
  const supportMailto = `mailto:${SUPPORT_EMAIL}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Your Burn &amp; Build Diet</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Georgia,'Times New Roman',Times,serif;color:#111111;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border:1px solid #e5e5e5;border-radius:8px;">
          <tr>
            <td align="center" style="padding:32px 32px 8px;">
              <a href="${siteOrigin()}" style="text-decoration:none;">
                <img src="${logoUrl}" alt="Burn &amp; Build" width="120" height="120" style="display:block;border:0;height:auto;max-width:120px;">
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 0;font-size:16px;line-height:1.6;">
              <p style="margin:0 0 16px;">Hi ${firstName},</p>
              <p style="margin:0 0 16px;">Thank you for purchasing the <strong>Burn &amp; Build Diet</strong>.</p>
              <p style="margin:0 0 24px;">Your payment is confirmed and your personalized program is ready.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 32px 24px;">
              <a href="${downloadUrl}" style="display:inline-block;background-color:#2F6FA8;color:#ffffff;text-decoration:none;font-family:Georgia,'Times New Roman',Times,serif;font-size:16px;font-weight:bold;padding:14px 28px;border-radius:6px;">Download your Burn &amp; Build Diet</a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px;font-size:16px;line-height:1.6;">
              <p style="margin:0 0 16px;">Need it again later? <a href="${portalUrl}" style="color:#2F6FA8;">Open your download page</a> — your program opens automatically.</p>
              <p style="margin:0 0 24px;">A copy of your Burn &amp; Build Diet is attached to this email.</p>
              <p style="margin:0 0 8px;font-weight:bold;">Resources</p>
              <p style="margin:0;"><a href="${templateUrl}" style="color:#2F6FA8;">Print a blank Menu Plan worksheet</a></p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 32px;border-top:1px solid #e5e5e5;font-size:15px;line-height:1.6;color:#444444;">
              <p style="margin:0 0 12px;">Questions or need help getting started? Contact Burn &amp; Build at <a href="${supportMailto}" style="color:#2F6FA8;">${SUPPORT_EMAIL}</a> — we&rsquo;re happy to help.</p>
              <p style="margin:0;font-size:14px;color:#666666;">— Burn &amp; Build<br><a href="${siteOrigin()}" style="color:#666666;text-decoration:none;">www.burnandbuilddiet.com</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendDietPdfEmail({
  to,
  preferredName,
  pkg,
  pdfBuffer,
  programId,
  paidAt,
  forceResend = false,
}) {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  if (!apiKey) {
    console.warn('[diet-email] RESEND_API_KEY not set — skipping email.');
    return { ok: false, skipped: true, message: 'Diet email is not configured on the server.' };
  }

  const filename = dietPdfAttachmentFilename({ preferredName, pkg });
  const firstNameRaw = firstNameFromPreferredName(preferredName);
  const firstName = escapeHtml(firstNameRaw);
  const downloadUrl = dietPdfDownloadUrl(to, programId);
  const portalUrl = purchaserPortalUrl(to, programId);
  const templateUrl = menuPlanTemplateUrl();
  const logoUrl = brandLogoUrl();
  const emailContent = {
    firstName: firstNameRaw,
    downloadUrl,
    portalUrl,
    templateUrl,
    logoUrl,
  };

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  const id = String(programId || '').trim();
  if (id && !forceResend) {
    const paidStamp = paidAt || pkg?.program?.issuedAt || 'unknown';
    headers['Idempotency-Key'] = `diet-pdf/${id}/${paidStamp}/${DIET_PDF_GENERATION_VERSION}`;
  }

  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      from: emailFrom(),
      reply_to: SUPPORT_EMAIL,
      to: [to],
      subject: 'Your Burn & Build Diet',
      html: buildDietEmailHtml({ ...emailContent, firstName }),
      text: buildDietEmailText(emailContent),
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
