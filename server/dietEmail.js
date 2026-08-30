import { dietPdfAttachmentFilename } from '../js/dietPdfNamingHelpers.js';
import { DIET_PDF_GENERATION_VERSION } from '../js/assetVersionData.js';
import {
  brandLogoUrl,
  burnAndBuildFaqUrl,
  menuPlanWorksheetDownloadUrl,
  purchaserPortalUrl,
  siteOrigin,
  SUPPORT_EMAIL,
} from './dietPdfUrls.js';

const RESEND_API = 'https://api.resend.com/emails';

const EMAIL_COLORS = Object.freeze({
  pageBg: '#F3F3F3',
  card: '#FFFFFF',
  black: '#0A0A0A',
  gold: '#FDC500',
  keepTint: '#FFFBE6',
  muted: '#5C5C5C',
  rule: '#E5E5E5',
});

const EMAIL_SUBJECT = 'Your Burn & Build Diet + Resources';
const SIGNATURE_FONT = 'Caveat';
const SIGNATURE_FONT_URL = 'https://fonts.googleapis.com/css2?family=Caveat:wght@400;500&display=swap';

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

function buildDietEmailText({ firstName, portalUrl, worksheetUrl, faqUrl }) {
  return [
    `Hi ${firstName},`,
    '',
    'Thank you for purchasing the Burn & Build Diet.',
    '',
    'Your payment is confirmed and your personalized program is ready.',
    '',
    'KEEP THIS EMAIL',
    '',
    'This email is your link back to your Burn & Build download page. If you ever need another copy of your diet, return here:',
    '',
    `Open your Burn & Build download page: ${portalUrl}`,
    '',
    'A copy of your Burn & Build Diet is also attached to this email.',
    '',
    'FREE RESOURCES',
    '',
    'Menu Plan Worksheet',
    'A blank worksheet for building your weekly menu.',
    `Download Menu Plan Worksheet: ${worksheetUrl}`,
    '',
    'Frequently Asked Questions',
    'Practical answers to questions that come up while following Burn & Build.',
    `Download FAQ: ${faqUrl}`,
    '',
    'Questions or need help getting started?',
    SUPPORT_EMAIL,
    '',
    '— Kory',
    'Burn & Build',
    'Athlete-tested since 1982',
  ].join('\n');
}

function buildDietEmailHtml({ firstName, portalUrl, worksheetUrl, faqUrl, logoUrl }) {
  const c = EMAIL_COLORS;
  const supportMailto = `mailto:${SUPPORT_EMAIL}`;
  const site = siteOrigin();
  const portalLink = `<a class="portal-link" href="${portalUrl}" style="color:${c.black} !important;-webkit-text-fill-color:${c.black} !important;font-weight:bold;text-decoration:none;border-bottom:2px solid ${c.gold};">Open your Burn & Build download page <span style="color:${c.gold} !important;-webkit-text-fill-color:${c.gold} !important;">&#8594;</span></a>`;
  const worksheetLink = `<a class="gold-link" href="${worksheetUrl}" style="color:${c.gold} !important;-webkit-text-fill-color:${c.gold} !important;font-weight:bold;text-decoration:underline;text-decoration-color:${c.gold};">Download Menu Plan Worksheet</a>`;
  const faqLink = `<a class="gold-link" href="${faqUrl}" style="color:${c.gold} !important;-webkit-text-fill-color:${c.gold} !important;font-weight:bold;text-decoration:underline;text-decoration-color:${c.gold};">Download FAQ</a>`;
  const supportLink = `<a class="support-link" href="${supportMailto}" style="color:${c.black} !important;-webkit-text-fill-color:${c.black} !important;font-weight:bold;text-decoration:underline;text-decoration-color:${c.gold};text-underline-offset:2px;">${SUPPORT_EMAIL}</a>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Your Burn &amp; Build Diet + Resources</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${SIGNATURE_FONT_URL}" rel="stylesheet">
  <style>
    a { text-decoration-skip-ink: none; }
    a.portal-link { color: ${c.black} !important; -webkit-text-fill-color: ${c.black} !important; }
    a.gold-link { color: ${c.gold} !important; -webkit-text-fill-color: ${c.gold} !important; }
    a.support-link { color: ${c.black} !important; -webkit-text-fill-color: ${c.black} !important; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${c.pageBg};font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${c.black};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${c.pageBg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:${c.card};border:1px solid ${c.rule};border-radius:8px;">
          <tr>
            <td align="center" style="padding:32px 32px 16px;">
              <a href="${site}" style="text-decoration:none;">
                <img src="${logoUrl}" alt="Burn &amp; Build" width="96" height="96" style="display:block;border:0;height:auto;max-width:96px;">
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 8px;font-size:16px;line-height:1.6;color:${c.black};">
              <p style="margin:0 0 16px;">Hi ${firstName},</p>
              <p style="margin:0 0 16px;">Thank you for purchasing the <strong>Burn &amp; Build Diet.</strong></p>
              <p style="margin:0 0 24px;">Your payment is confirmed and your personalized program is ready.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-left:3px solid ${c.gold};background-color:${c.keepTint};">
                <tr>
                  <td style="padding:16px 20px;font-size:16px;line-height:1.6;color:${c.black};">
                    <p style="margin:0 0 12px;font-size:11px;font-weight:bold;letter-spacing:0.08em;color:${c.gold};">KEEP THIS EMAIL</p>
                    <p style="margin:0 0 16px;">This email is your link back to your Burn &amp; Build download page. If you ever need another copy of your diet, return here:</p>
                    <p style="margin:0 0 16px;">${portalLink}</p>
                    <p style="margin:0;">A copy of your Burn &amp; Build Diet is also attached to this email.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px;font-size:16px;line-height:1.6;color:${c.black};">
              <p style="margin:0 0 16px;font-size:18px;font-weight:bold;color:${c.black};">Free Resources</p>
              <p style="margin:0 0 4px;font-weight:bold;">Menu Plan Worksheet</p>
              <p style="margin:0 0 8px;color:${c.muted};">A blank worksheet for building your weekly menu.</p>
              <p style="margin:0 0 20px;">${worksheetLink}</p>
              <p style="margin:0 0 4px;font-weight:bold;">Frequently Asked Questions</p>
              <p style="margin:0 0 8px;color:${c.muted};">Practical answers to questions that come up while following Burn &amp; Build.</p>
              <p style="margin:0;">${faqLink}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 32px;border-top:1px solid ${c.rule};font-size:15px;line-height:1.6;color:${c.muted};">
              <p style="margin:0 0 20px;color:${c.black};font-weight:bold;">Questions or need help getting started?<br>${supportLink}</p>
              <p style="margin:0 0 6px;font-family:'${SIGNATURE_FONT}',cursive;font-size:30px;line-height:1.1;color:#1A1A1A;">&mdash; Kory</p>
              <p style="margin:0 0 4px;color:${c.black};">Burn &amp; Build</p>
              <p style="margin:0;font-style:italic;color:${c.muted};">Athlete-tested since 1982</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildDietEmailPreview({
  preferredName = 'Sample',
  email = 'sample@example.com',
  programId = 'preview-program',
} = {}) {
  const firstNameRaw = firstNameFromPreferredName(preferredName);
  const firstName = escapeHtml(firstNameRaw);
  const portalUrl = purchaserPortalUrl(email, programId);
  const worksheetUrl = menuPlanWorksheetDownloadUrl();
  const faqUrl = burnAndBuildFaqUrl();
  const logoUrl = brandLogoUrl();
  const emailContent = {
    firstName: firstNameRaw,
    portalUrl,
    worksheetUrl,
    faqUrl,
    logoUrl,
  };
  return {
    subject: EMAIL_SUBJECT,
    html: buildDietEmailHtml({ ...emailContent, firstName }),
    text: buildDietEmailText(emailContent),
  };
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
  const { html, text } = buildDietEmailPreview({
    preferredName,
    email: to,
    programId,
  });

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
      subject: EMAIL_SUBJECT,
      html,
      text,
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
