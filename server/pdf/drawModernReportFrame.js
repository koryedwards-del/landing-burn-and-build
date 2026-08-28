/**
 * Modern Burn & Build Diet report frame — header + footer shared across all pages.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { PDF_MARGIN } from './constants.js';
import { logoPath } from './draw.js';
import { PDF_FRAME_COLORS, PDF_FRAME_CONTACT } from './drawFrame.js';

const FONT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fonts');
const BRAND_GOLD = PDF_FRAME_COLORS.gold;

export const MODERN_REPORT_FONTS = Object.freeze({
  regular: 'Montserrat',
  bold: 'Montserrat-Bold',
  italic: 'Montserrat-Italic',
  boldItalic: 'Montserrat-BoldItalic',
});

export const MODERN_REPORT_COLORS = Object.freeze({
  body: '#111111',
  muted: '#5C5C5C',
  gold: BRAND_GOLD,
  goldLight: '#FFF0B3',
  goldPale: '#FFFBE6',
  white: '#FFFFFF',
  rule: '#D8D8D8',
});

export const MODERN_HEADER_LAYOUT = Object.freeze({
  logoWidth: 66,
  titleSize: 28,
  titleRule: 2.5,
  titleGap: 14,
  ruleGap: 12,
  personalSize: 7.5,
});

/** Shared with page bodies that pin content above the modern footer. */
export const MODERN_REPORT_FOOTER_LAYOUT = Object.freeze({
  ruleOffsetFromBottom: 28,
  contentGapAboveRule: 8,
});

export function modernFooterRuleY(box) {
  return box.bottom - MODERN_REPORT_FOOTER_LAYOUT.ruleOffsetFromBottom;
}

export function registerModernReportFonts(doc) {
  doc.registerFont(MODERN_REPORT_FONTS.regular, path.join(FONT_DIR, 'Montserrat-Regular.ttf'));
  doc.registerFont(MODERN_REPORT_FONTS.bold, path.join(FONT_DIR, 'Montserrat-Bold.ttf'));
  doc.registerFont(MODERN_REPORT_FONTS.italic, path.join(FONT_DIR, 'Montserrat-Italic.ttf'));
  doc.registerFont(MODERN_REPORT_FONTS.boldItalic, path.join(FONT_DIR, 'Montserrat-BoldItalic.ttf'));
}

export function modernReportContentBox(doc) {
  const { width, height } = doc.page;
  return {
    x: PDF_MARGIN.left,
    y: PDF_MARGIN.top,
    width: width - PDF_MARGIN.left - PDF_MARGIN.right,
    bottom: height - PDF_MARGIN.bottom,
  };
}

function titleCaseWords(text) {
  return String(text || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function formatPreparedDateUpper(value) {
  if (!value) return '';
  const isoMatch = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const monthIndex = Number(isoMatch[2]) - 1;
    const day = Number(isoMatch[3]);
    const month = new Date(year, monthIndex, 1).toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
    return `${month} ${day}, ${year}`;
  }
  return String(value).toUpperCase();
}

function drawAccentPageTitle(doc, x, y, width, title, { leadSize, accentSize } = {}) {
  const fonts = MODERN_REPORT_FONTS;
  const colors = MODERN_REPORT_COLORS;
  const layout = MODERN_HEADER_LAYOUT;
  const words = String(title || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) {
    return y;
  }

  const accentFontSize = accentSize ?? layout.titleSize;
  const leadFontSize = leadSize ?? accentFontSize;
  const upper = words.map((word) => word.toUpperCase());

  if (upper.length === 1) {
    doc.font(fonts.bold).fontSize(accentFontSize).fillColor(colors.body);
    doc.text(upper[0], x, y, { lineBreak: false });
  } else {
    const lead = `${upper.slice(0, -1).join(' ')} `;
    const accent = upper[upper.length - 1];
    doc.font(fonts.bold).fontSize(leadFontSize).fillColor(colors.body);
    doc.text(lead, x, y, { continued: true, lineGap: 0 });
    doc.font(fonts.bold).fontSize(accentFontSize).fillColor(colors.gold).text(accent, {
      continued: false,
      lineBreak: false,
    });
  }

  return y + Math.max(leadFontSize, accentFontSize) + 6;
}

/**
 * Logo left, personalization right, accent page title, gold rule.
 * @returns {number} body start y
 */
export function drawModernReportHeader(doc, box, payload, pageTitle, titleStyle = {}) {
  registerModernReportFonts(doc);
  const fonts = MODERN_REPORT_FONTS;
  const colors = MODERN_REPORT_COLORS;
  const layout = MODERN_HEADER_LAYOUT;
  const logoY = box.y;

  doc.image(logoPath, box.x, logoY, { width: layout.logoWidth });

  const name = titleCaseWords(payload?.clientName);
  const date = formatPreparedDateUpper(payload?.preparedDateLong || payload?.preparedDate);
  const personalLine = `PERSONALIZED FOR: ${name.toUpperCase()}  ·  ${date}`;
  doc
    .font(fonts.regular)
    .fontSize(layout.personalSize)
    .fillColor(colors.muted)
    .text(personalLine, box.x, logoY + 6, {
      width: box.width,
      align: 'right',
      lineGap: 0,
    });

  const titleY = logoY + layout.logoWidth + layout.titleGap;
  const ruleY = pageTitle
    ? drawAccentPageTitle(doc, box.x, titleY, box.width, pageTitle, titleStyle)
    : titleY;

  doc
    .strokeColor(colors.gold)
    .lineWidth(layout.titleRule)
    .moveTo(box.x, ruleY)
    .lineTo(box.x + box.width, ruleY)
    .stroke();

  return ruleY + layout.ruleGap;
}

/** Three-column footer — page number left, website center, email right. */
export function drawModernReportFooter(doc, box, { page, total, contact = PDF_FRAME_CONTACT } = {}) {
  registerModernReportFonts(doc);
  const fonts = MODERN_REPORT_FONTS;
  const colors = MODERN_REPORT_COLORS;
  const ruleY = modernFooterRuleY(box);
  const textY = box.bottom - 16;
  const website = String(contact?.website || PDF_FRAME_CONTACT.website).toUpperCase();
  const email = String(contact?.email || PDF_FRAME_CONTACT.email).toUpperCase();

  doc
    .strokeColor(colors.rule)
    .lineWidth(0.75)
    .moveTo(box.x, ruleY)
    .lineTo(box.x + box.width, ruleY)
    .stroke();

  if (page != null && total != null) {
    doc.font(fonts.regular).fontSize(7.5).fillColor(colors.muted);
    doc.text('PAGE ', box.x, textY, { continued: true, lineGap: 0 });
    doc.font(fonts.bold).text(`${page} `, { continued: true });
    doc.font(fonts.regular).text(`OF ${total}`, { lineBreak: false });
  }

  doc
    .font(fonts.regular)
    .fontSize(7.5)
    .fillColor(colors.muted)
    .text(website, box.x, textY, { width: box.width, align: 'center', lineGap: 0 });

  doc
    .font(fonts.regular)
    .fontSize(7.5)
    .fillColor(colors.muted)
    .text(email, box.x, textY, { width: box.width, align: 'right', lineGap: 0 });
}
