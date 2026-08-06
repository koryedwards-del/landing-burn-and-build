import { PDF_MARGIN } from './constants.js';
import { drawWatermark, logoPath } from './draw.js';
import { PRINT_TEMPLATE_TYPOGRAPHY as PT } from '../../js/printTemplateTypography.js';

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

const FOOTER_BAND_HEIGHT = 14 + PT.contact + 10 + 4;

export const PDF_FRAME = Object.freeze({
  logoWidth: 68,
  logoGap: 16,
  contentPad: PT.contentPad,
  footerContactOffset: 14,
  footerRuleAboveText: 10,
  footerBandHeight: FOOTER_BAND_HEIGHT,
  personalizationSize: PT.personalization,
  contentPageTitleSize: PT.pageTitle,
  footerContactSize: PT.contact,
  pageNumberSize: PT.pageNumber,
  sectionGap: PT.sectionGap,
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

export function frameFooterRuleY(box) {
  return box.bottom - PDF_FRAME.footerBandHeight;
}

/** @deprecated Use frameContentContainer with topGoldY */
export function frameBodyBottom(box) {
  return frameFooterRuleY(box) - PDF_FRAME.contentPad;
}

/** Content band between top and bottom gold dividers with equal padding. */
export function frameContentContainer(box, topGoldY) {
  const bottomGoldY = frameFooterRuleY(box);
  const pad = PDF_FRAME.contentPad;
  const top = topGoldY + pad;
  const bottom = bottomGoldY - pad;
  return {
    x: box.x,
    y: top,
    width: box.width,
    top,
    bottom,
    topGoldY,
    bottomGoldY,
    height: Math.max(0, bottom - top),
  };
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
  return y;
}

/** Content pages — contact + personalization rows, no logo (more vertical space). */
export function drawCompactPersonalizedHeader(doc, box, {
  clientName,
  preparedDateLong,
  preparedDate,
  contact = PDF_FRAME_CONTACT,
} = {}) {
  const phone = contact?.phone || '';
  const website = contact?.website || PDF_FRAME_CONTACT.website;
  const email = contact?.email || PDF_FRAME_CONTACT.email;
  const contactLine = [phone, website, email].filter(Boolean).join('  ·  ');
  let y = box.y;

  doc
    .font(PDF_FRAME_FONTS.regular)
    .fontSize(PDF_FRAME.footerContactSize + 1)
    .fillColor(PDF_FRAME_COLORS.muted)
    .text(contactLine, box.x, y, { width: box.width, align: 'center', lineGap: 0 });

  y = doc.y + 6;
  const name = titleCaseWords(clientName);
  const date = formatPreparedDateOrdinal(preparedDateLong || preparedDate);
  doc
    .font(PDF_FRAME_FONTS.bold)
    .fontSize(PDF_FRAME.personalizationSize)
    .fillColor(PDF_FRAME_COLORS.body)
    .text(`Prepared exclusively for: ${name}`, box.x, y, {
      width: box.width * 0.64,
      align: 'left',
      lineGap: 0,
    });
  doc
    .font(PDF_FRAME_FONTS.bold)
    .fontSize(PDF_FRAME.personalizationSize)
    .text(`On: ${date}`, box.x + box.width * 0.64, y, {
      width: box.width * 0.36,
      align: 'right',
      lineGap: 0,
    });

  y = Math.max(doc.y, y + 14) + 8;
  drawGoldDivider(doc, box.x, y, box.width);
  return y;
}

export function drawFramePageTitle(doc, title, x, y, width, { size } = {}) {
  const display = String(title || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  doc
    .font(PDF_FRAME_FONTS.bold)
    .fontSize(size || PDF_FRAME.contentPageTitleSize)
    .fillColor(PDF_FRAME_COLORS.body)
    .text(display, x, y, { width, lineGap: 0 });
  return doc.y + PDF_FRAME.sectionGap;
}

export function frameContentContainerTight(box, topGoldY, pad = 6) {
  const bottomGoldY = frameFooterRuleY(box);
  const top = topGoldY + pad;
  const bottom = bottomGoldY - pad;
  return {
    x: box.x,
    y: top,
    width: box.width,
    top,
    bottom,
    topGoldY,
    bottomGoldY,
    height: Math.max(0, bottom - top),
  };
}

export function drawFrameFooter(doc, box, contact = PDF_FRAME_CONTACT) {
  const footerTextY = box.bottom - PDF_FRAME.footerContactOffset;
  const ruleY = frameFooterRuleY(box);
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

/** Centered at bottom of content band, above the footer gold line. */
export function drawFramePageNumber(doc, box, { page, total }) {
  const label = `Page ${page} of ${total}`;
  doc
    .font(PDF_FRAME_FONTS.regular)
    .fontSize(PDF_FRAME.pageNumberSize)
    .fillColor(PDF_FRAME_COLORS.muted);

  const textHeight = doc.heightOfString(label, { width: box.width, align: 'center', lineGap: 0 });
  const y = frameFooterRuleY(box) - PDF_FRAME.contentPad - textHeight;

  doc.text(label, box.x, y, {
    width: box.width,
    align: 'center',
    lineGap: 0,
  });

  return y;
}

/** Program report: page number (optional) + gold footer.contact */
export function drawFramePageFooter(doc, box, { page, total, contact } = {}) {
  if (page != null && total != null) {
    drawFramePageNumber(doc, box, { page, total });
  }
  drawFrameFooter(doc, box, contact);
}

/** Max y for body content when a page number is shown. */
export function frameContentBottomLimit(box) {
  return frameFooterRuleY(box)
    - PDF_FRAME.contentPad
    - PDF_FRAME.pageNumberSize
    - 10;
}

/** Content container bottom when page numbers are reserved above the footer rule. */
export function frameContentContainerBottom(box, topGoldY) {
  return frameContentBottomLimit(box);
}

/** Stamp centered "Page X of Y" on every buffered page before finalize. */
export function stampAllPageNumbers(doc) {
  if (typeof doc.bufferedPageRange !== 'function') return;

  const range = doc.bufferedPageRange();
  const total = range.count;
  if (total <= 0) return;

  for (let index = 0; index < total; index += 1) {
    doc.switchToPage(range.start + index);
    const box = frameContentBox(doc);
    drawFramePageNumber(doc, box, { page: index + 1, total });
  }
}
