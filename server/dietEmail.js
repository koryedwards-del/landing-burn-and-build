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
  dietHighlight: '#FFFBE6',
  muted: '#5C5C5C',
  rule: '#E5E5E5',
});

const BONUS_MENU_PLANNER_FILENAME = 'Burn&Build-Menu-Planner.pdf';
const BONUS_FAQ_FILENAME = 'Burn&Build-FAQ.pdf';
const PDF_ICON_COLOR = '#FFCC00';

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

function pdfDocumentIconDataUri({ width = 24, height = 28, color = PDF_ICON_COLOR } = {}) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 24 28" role="img" aria-hidden="true"><path fill="${color}" d="M0 3.5A3.5 3.5 0 0 1 3.5 0H14.5L24 9.5V24.5A3.5 3.5 0 0 1 20.5 28H3.5A3.5 3.5 0 0 1 0 24.5V3.5zm14.5-3.5L24 9.5h-6A3.5 3.5 0 0 1 14.5 0z"/><path fill="#FFFFFF" fill-opacity="0.3" d="M14.5 0L24 9.5H18A3.5 3.5 0 0 1 14.5 6V0z"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function pdfDocumentIconImg({ width = 24, height = 28, color = PDF_ICON_COLOR } = {}) {
  const src = pdfDocumentIconDataUri({ width, height, color });
  return `<img src="${src}" width="${width}" height="${height}" alt="" style="display:block;border:0;width:${width}px;height:${height}px;">`;
}

function pdfFileLink(href, filename, { fontSize = 16, fontWeight = 600, lineHeight = 1.5 } = {}) {
  const c = EMAIL_COLORS;
  const safe = escapeHtml(filename);
  return `<a class="pdf-file-link" href="${href}" style="color:${c.black} !important;-webkit-text-fill-color:${c.black} !important;font-size:${fontSize}px;font-weight:${fontWeight};line-height:${lineHeight};text-decoration:underline;text-decoration-color:${c.rule};text-underline-offset:3px;">${safe}</a>`;
}

function pdfFileRow(href, filename, {
  iconWidth,
  iconHeight,
  fontSize,
  fontWeight,
  iconGap,
  lineHeight = 1.5,
} = {}) {
  const link = pdfFileLink(href, filename, { fontSize, fontWeight, lineHeight });
  const icon = pdfDocumentIconImg({ width: iconWidth, height: iconHeight });
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="vertical-align:middle;padding-right:${iconGap}px;line-height:0;font-size:0;">${icon}</td>
      <td style="vertical-align:middle;">${link}</td>
    </tr>
  </table>`;
}

function dietPdfFileLink(href, filename) {
  const c = EMAIL_COLORS;
  const row = pdfFileRow(href, filename, {
    iconWidth: 26,
    iconHeight: 30,
    fontSize: 16,
    fontWeight: 600,
    iconGap: 14,
  });
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${c.dietHighlight};">
    <tr>
      <td style="width:3px;background-color:${c.gold};font-size:0;line-height:0;">&nbsp;</td>
      <td style="padding:12px 16px;">${row}</td>
    </tr>
  </table>`;
}

function bonusPdfFileLink(href, filename) {
  return pdfFileRow(href, filename, {
    iconWidth: 18,
    iconHeight: 21,
    fontSize: 14,
    fontWeight: 600,
    iconGap: 10,
    lineHeight: 1.2,
  });
}

function bonusResourcesBlock(menuPlannerRow, faqRow) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 40px;">
    <tr>
      <td style="padding:0 0 2px 0;">${menuPlannerRow}</td>
    </tr>
    <tr>
      <td style="padding:0;">${faqRow}</td>
    </tr>
  </table>`;
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
  const dietLink = dietPdfFileLink(dietDownloadUrl, dietPdfFilename);
  const menuPlannerLink = bonusPdfFileLink(worksheetUrl, BONUS_MENU_PLANNER_FILENAME);
  const faqLink = bonusPdfFileLink(faqUrl, BONUS_FAQ_FILENAME);
  const bonusLinks = bonusResourcesBlock(menuPlannerLink, faqLink);
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
            <td align="center" style="padding:0 32px 20px;">
              <a href="${site}" style="text-decoration:none;">
                <img src="${logoUrl}" alt="Burn &amp; Build" width="88" height="88" style="display:block;border:0;height:auto;max-width:88px;">
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;line-height:0;font-size:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid ${c.gold};font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
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
              ${bonusLinks}
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
