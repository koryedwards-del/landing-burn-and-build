import { PDF_MARGIN } from './constants.js';
import { drawWatermark, logoPath } from './draw.js';

/** Generic row 2 — non-personalized PDFs (FAQ, food list, etc.). */
export const PDF_FRAME_TAGLINE = 'Burn & Build — Stronger Today. Leaner Tomorrow.';

export const PDF_FRAME_CONTACT = Object.freeze({
  website: 'www.burnandbuilddiet.com',
  email: 'support@burnandbuilddiet.com',
});

export const PDF_FRAME_FONTS = Object.freeze({
  regular: 'Times-Roman',
  bold: 'Times-Bold',
  italic: 'Times-Italic',
  boldItalic: 'Times-BoldItalic',
});

export const PDF_FRAME = Object.freeze({
  logoWidth: 68,
  logoGap: 16,
  footerZone: 30,
  personalizationSize: 12,
  contentPageTitleSize: 18,
  footerContactSize: 8,
  sectionGap: 12,
  ruleGap: 10,
});

export const PDF_FRAME_COLORS = Object.freeze({
  body: '#111111',
  muted: '#444444',
  gold: '#fdc500',
});

export function frameContentBox(doc) {
  const { width, height } = doc.page;
  return {
    x: PDF_MARGIN.left,
    y: PDF_MARGIN.top,
    width: width - PDF_MARGIN.left - PDF_MARGIN.right,
    height: height - PDF_MARGIN.top - PDF_MARGIN.bottom,
    bottom: height - PDF_MARGIN.bottom,
  };
}

export function addFramePage(doc) {
  doc.addPage({ size: 'LETTER', layout: 'portrait', margin: 0 });
  drawWatermark(doc);
  return frameContentBox(doc);
}

export function frameBodyBottom(box) {
  return box.bottom - PDF_FRAME.footerZone;
}

function titleCaseWords(text) {
  return String(text || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function ordinalSuffix(day) {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

function formatPreparedDateOrdinal(value) {
  if (!value) return '';
  const isoMatch = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const d = new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T12:00:00`);
    const month = d.toLocaleDateString('en-US', { month: 'long' });
    const day = d.getDate();
    return `${month} ${day}${ordinalSuffix(day)}, ${d.getFullYear()}`;
  }
  const longMatch = String(value).match(/^(\w+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (longMatch) {
    const day = Number(longMatch[2]);
    return `${longMatch[1]} ${day}${ordinalSuffix(day)}, ${longMatch[3]}`;
  }
  return String(value);
}

export function drawGoldDivider(doc, x, y, width) {
  doc
    .strokeColor(PDF_FRAME_COLORS.gold)
    .lineWidth(1.5)
    .moveTo(x, y)
    .lineTo(x + width, y)
    .stroke();
}

/**
 * Unified header: centered logo, row 2 personalized or tagline, gold divider.
 * @returns {number} body top y
 */
export function drawFrameHeader(doc, box, {
  personalized = false,
  clientName,
  preparedDateLong,
  preparedDate,
} = {}) {
  const logoY = box.y;
  const logoWidth = PDF_FRAME.logoWidth;
  const logoX = box.x + (box.width - logoWidth) / 2;
  const rowSize = PDF_FRAME.personalizationSize;

  doc.image(logoPath, logoX, logoY, { width: logoWidth });

  const rowY = logoY + logoWidth + PDF_FRAME.logoGap;

  if (personalized) {
    const name = titleCaseWords(clientName);
    const date = formatPreparedDateOrdinal(preparedDateLong || preparedDate);
    doc
      .font(PDF_FRAME_FONTS.bold)
      .fontSize(rowSize)
      .fillColor(PDF_FRAME_COLORS.body)
      .text(`Personalized exclusively for: ${name}`, box.x, rowY, {
        width: box.width * 0.64,
        align: 'left',
        lineGap: 0,
      });
    doc
      .font(PDF_FRAME_FONTS.bold)
      .fontSize(rowSize)
      .text(`On: ${date}`, box.x + box.width * 0.64, rowY, {
        width: box.width * 0.36,
        align: 'right',
        lineGap: 0,
      });
  } else {
    doc
      .font(PDF_FRAME_FONTS.bold)
      .fontSize(rowSize)
      .fillColor(PDF_FRAME_COLORS.body)
      .text(PDF_FRAME_TAGLINE, box.x, rowY, {
        width: box.width,
        align: 'center',
        lineGap: 0,
      });
  }

  const y = Math.max(doc.y, rowY + 14) + 10;
  drawGoldDivider(doc, box.x, y, box.width);
  return y + PDF_FRAME.ruleGap;
}

export function drawFramePageTitle(doc, title, x, y, width) {
  const display = String(title || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  doc
    .font(PDF_FRAME_FONTS.bold)
    .fontSize(PDF_FRAME.contentPageTitleSize)
    .fillColor(PDF_FRAME_COLORS.body)
    .text(display, x, y, { width, lineGap: 0 });
  return doc.y + PDF_FRAME.sectionGap;
}

export function drawFrameFooter(doc, box, contact = PDF_FRAME_CONTACT) {
  const footerTextY = box.bottom - 12;
  const ruleY = footerTextY - 12;
  const website = contact?.website || PDF_FRAME_CONTACT.website;
  const email = contact?.email || PDF_FRAME_CONTACT.email;

  drawGoldDivider(doc, box.x, ruleY, box.width);

  doc
    .font(PDF_FRAME_FONTS.regular)
    .fontSize(PDF_FRAME.footerContactSize)
    .fillColor(PDF_FRAME_COLORS.muted)
    .text(`${website} · ${email}`, box.x, footerTextY, {
      width: box.width,
      align: 'center',
      lineGap: 0,
    });

  return ruleY;
}
