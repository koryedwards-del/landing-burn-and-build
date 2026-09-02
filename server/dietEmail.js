import { dietPdfFilename } from '../js/dietPdfNamingHelpers.js';
import { DIET_PDF_GENERATION_VERSION } from '../js/assetVersionData.js';
import {
  PURCHASE_EMAIL_CSS_FAMILY,
  PURCHASE_EMAIL_FONT_URL,
  PURCHASE_EMAIL_SIGNATURE_CLOSE_SIZE_PX,
} from '../js/purchaseEmailStyleData.js';
import {
  SIGNATURE_DISPLAY_CSS_FAMILY,
  SIGNATURE_DISPLAY_FONT_URL,
} from '../js/signatureDisplayData.js';
import {
  brandLogoUrl,
  burnAndBuildFaqUrl,
  dietPdfDownloadUrl,
  menuPlanWorksheetDownloadUrl,
  purchaserPortalUrl,
  PURCHASE_EMAIL_CONTACT,
  siteOrigin,
} from './dietPdfUrls.js';

const RESEND_API = 'https://api.resend.com/emails';

const EMAIL_COLORS = Object.freeze({
  pageBg: '#F3F3F3',
  card: '#FFFFFF',
  black: '#0A0A0A',
  gold: '#FDC500',
  muted: '#5C5C5C',
  rule: '#E5E5E5',
});

const BONUS_MENU_PLANNER_FILENAME = 'Burn&Build-Menu-Planner.pdf';
const BONUS_FAQ_FILENAME = 'Burn&Build-FAQ.pdf';

const EMAIL_SUBJECT = 'Your Burn & Build Diet is here';

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

function dietEmailPdfFilename({ preferredName, pkg, paidAt } = {}) {
  const firstName = firstNameFromPreferredName(preferredName);
  return dietPdfFilename({
    preferredName: firstName,
    pkg,
    createdAt: paidAt || pkg?.program?.issuedAt,
  });
}

function pdfFileLink(href, filename) {
  const c = EMAIL_COLORS;
  const safe = escapeHtml(filename);
  return `<a class="pdf-file-link" href="${href}" style="color:${c.black} !important;-webkit-text-fill-color:${c.black} !important;font-size:16px;font-weight:600;line-height:1.5;text-decoration:underline;text-decoration-color:${c.rule};text-underline-offset:3px;">${safe}</a>`;
}

function buildDietEmailText({
  firstName,
  dietPdfFilename,
  dietDownloadUrl,
  portalUrl,
  worksheetUrl,
  faqUrl,
}) {
  return [
    `Hi ${firstName},`,
    '',
    'Your Burn & Build Diet is here.',
    '',
    dietPdfFilename,
    dietDownloadUrl,
    '',
    'Access Your Burn & Build Account →',
    portalUrl,
    'Keep this email for future access.',
    '',
    'Bonus Resources',
    '',
    BONUS_MENU_PLANNER_FILENAME,
    worksheetUrl,
    '',
    BONUS_FAQ_FILENAME,
    faqUrl,
    '',
    'Questions? Just email me.',
    PURCHASE_EMAIL_CONTACT,
    '',
    '— Kory',
    'Burn & Build',
    'Athlete-tested since 1982',
  ].join('\n');
}

function buildDietEmailHtml({
  firstName,
  dietPdfFilename,
  dietDownloadUrl,
  portalUrl,
  worksheetUrl,
  faqUrl,
  logoUrl,
}) {
  const c = EMAIL_COLORS;
  const contactMailto = `mailto:${PURCHASE_EMAIL_CONTACT}`;
  const site = siteOrigin();
  const dietLink = pdfFileLink(dietDownloadUrl, dietPdfFilename);
  const menuPlannerLink = pdfFileLink(worksheetUrl, BONUS_MENU_PLANNER_FILENAME);
  const faqLink = pdfFileLink(faqUrl, BONUS_FAQ_FILENAME);
  const portalLink = `<a class="portal-link" href="${portalUrl}" style="color:${c.black} !important;-webkit-text-fill-color:${c.black} !important;font-size:16px;font-weight:700;line-height:1.5;text-decoration:none;border-bottom:2px solid ${c.gold};">Access Your Burn &amp; Build Account <span style="color:${c.gold} !important;-webkit-text-fill-color:${c.gold} !important;">&#8594;</span></a>`;
  const contactLink = `<a class="contact-link" href="${contactMailto}" style="font-family:${PURCHASE_EMAIL_CSS_FAMILY};font-size:16px;line-height:1.5;color:${c.black} !important;-webkit-text-fill-color:${c.black} !important;font-weight:600;text-decoration:underline;text-decoration-color:${c.rule};text-underline-offset:3px;">${PURCHASE_EMAIL_CONTACT}</a>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Your Burn &amp; Build Diet is here</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${PURCHASE_EMAIL_FONT_URL}" rel="stylesheet">
  <link href="${SIGNATURE_DISPLAY_FONT_URL}" rel="stylesheet">
  <style>
    a { text-decoration-skip-ink: none; }
    a.pdf-file-link { color: ${c.black} !important; -webkit-text-fill-color: ${c.black} !important; }
    a.portal-link { color: ${c.black} !important; -webkit-text-fill-color: ${c.black} !important; }
    a.contact-link { color: ${c.black} !important; -webkit-text-fill-color: ${c.black} !important; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${c.pageBg};font-family:${PURCHASE_EMAIL_CSS_FAMILY};color:${c.black};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${c.pageBg};padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:${c.card};">
          <tr>
            <td align="center" style="padding:0 32px 28px;">
              <a href="${site}" style="text-decoration:none;">
                <img src="${logoUrl}" alt="Burn &amp; Build" width="88" height="88" style="display:block;border:0;height:auto;max-width:88px;">
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 8px;font-size:16px;line-height:1.6;color:${c.black};">
              <p style="margin:0 0 20px;">Hi ${firstName},</p>
              <p style="margin:0 0 28px;font-size:16px;font-weight:700;line-height:1.5;color:${c.black};">Your Burn &amp; Build Diet is here.</p>
              <p style="margin:0 0 36px;">${dietLink}</p>
              <p style="margin:0 0 10px;">${portalLink}</p>
              <p style="margin:0 0 36px;font-size:15px;line-height:1.5;color:${c.muted};">Keep this email for future access.</p>
              <p style="margin:0 0 20px;font-size:16px;font-weight:700;line-height:1.5;color:${c.black};">Bonus Resources</p>
              <p style="margin:0 0 14px;">${menuPlannerLink}</p>
              <p style="margin:0 0 40px;">${faqLink}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 40px;font-size:15px;line-height:1.6;color:${c.muted};">
              <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:${c.black};">Questions? Just email me.</p>
              <p style="margin:0 0 28px;">${contactLink}</p>
              <p style="margin:0 0 6px;font-family:${SIGNATURE_DISPLAY_CSS_FAMILY};font-size:${PURCHASE_EMAIL_SIGNATURE_CLOSE_SIZE_PX}px;line-height:1.1;color:#1A1A1A;">&mdash; Kory</p>
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
  pkg = null,
  paidAt = null,
} = {}) {
  const firstNameRaw = firstNameFromPreferredName(preferredName);
  const firstName = escapeHtml(firstNameRaw);
  const portalUrl = purchaserPortalUrl(email, programId);
  const dietDownloadUrl = dietPdfDownloadUrl(email, programId);
  const worksheetUrl = menuPlanWorksheetDownloadUrl();
  const faqUrl = burnAndBuildFaqUrl();
  const logoUrl = brandLogoUrl();
  const dietPdfFilename = dietEmailPdfFilename({ preferredName, pkg, paidAt });
  const emailContent = {
    firstName: firstNameRaw,
    dietPdfFilename,
    dietDownloadUrl,
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

  const filename = dietEmailPdfFilename({ preferredName, pkg, paidAt });
  const { html, text } = buildDietEmailPreview({
    preferredName,
    email: to,
    programId,
    pkg,
    paidAt,
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
      reply_to: PURCHASE_EMAIL_CONTACT,
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
