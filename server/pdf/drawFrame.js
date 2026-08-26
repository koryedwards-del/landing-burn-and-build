import { PDF_MARGIN } from './constants.js';
import { drawWatermark, logoPath } from './draw.js';
import { PRINT_TEMPLATE_TYPOGRAPHY as PT } from '../../js/printTemplateTypographyData.js';

/** Generic row 2 — program report continuation headers. */
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

const FOOTER_BOTTOM_PAD = 6;
const FOOTER_CONTACT_GAP = 3;
const FOOTER_PAGE_NUM_GAP = 3;

/** Below rule: gap + contact + bottom pad. Above rule: page number + gap (reserved at stamp). */
const FOOTER_BELOW_RULE = FOOTER_CONTACT_GAP + PT.contact + FOOTER_BOTTOM_PAD;
const FOOTER_ABOVE_RULE = FOOTER_PAGE_NUM_GAP + PT.pageNumber + PT.contentPad;
const FOOTER_BAND_HEIGHT = FOOTER_BELOW_RULE + FOOTER_ABOVE_RULE;

export const PDF_FRAME = Object.freeze({
  logoWidth: 68,
  logoGap: 16,
  contentPad: PT.contentPad,
  footerContactOffset: FOOTER_BOTTOM_PAD + PT.contact,
  footerRuleAboveText: FOOTER_CONTACT_GAP,
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
  gold: '#FFCC00',
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
  return box.bottom - FOOTER_BELOW_RULE;
}

const TITLE_CASE_SMALL_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'but', 'for', 'in', 'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'vs', 'via',
]);

function titleCaseWords(text) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && index < words.length - 1 && TITLE_CASE_SMALL_WORDS.has(lower)) {
        return lower;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
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
  fonts = PDF_FRAME_FONTS,
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
      .font(fonts.bold)
      .fontSize(rowSize)
      .fillColor(PDF_FRAME_COLORS.body)
      .text(`Personalized exclusively for: ${name}`, box.x, rowY, {
        width: box.width * 0.64,
        align: 'left',
        lineGap: 0,
      });
    doc
      .font(fonts.bold)
      .fontSize(rowSize)
      .text(`On: ${date}`, box.x + box.width * 0.64, rowY, {
        width: box.width * 0.36,
        align: 'right',
        lineGap: 0,
      });
  } else {
    doc
      .font(fonts.bold)
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

export function drawContinuationHeader(doc, box) {
  const y = box.y + 14;
  drawGoldDivider(doc, box.x, y, box.width);
  return y;
}

/** Clear the gap between body content and footer rule (page-number band). */
export function clearContentFooterGap(doc, box) {
  const ruleY = frameFooterRuleY(box);
  const bandTop = frameContentBottomLimit(box);
  const bandHeight = ruleY - bandTop - 2;
  if (bandHeight <= 0) return;
  doc.save();
  doc.rect(box.x, bandTop, box.width, bandHeight).fill('#ffffff');
  doc.restore();
}

/** Y to start page title — clears the header gold rule. */
export function framePageTitleStartY(topGoldY) {
  return topGoldY + 2 + PT.titleTopGap;
}

export function drawFramePageTitle(doc, title, x, y, width, { size, gapAfter, fonts = PDF_FRAME_FONTS } = {}) {
  const display = titleCaseWords(title);

  doc
    .font(fonts.bold)
    .fontSize(size || PDF_FRAME.contentPageTitleSize)
    .fillColor(PDF_FRAME_COLORS.body)
    .text(display, x, y, { width, lineGap: 0 });
  return doc.y + (gapAfter ?? PDF_FRAME.sectionGap);
}

/** Centered at bottom of content band, above the footer gold line. */
function drawFramePageNumber(doc, box, { page, total }) {
  const label = `Page ${page} of ${total}`;
  doc
    .font(PDF_FRAME_FONTS.regular)
    .fontSize(PDF_FRAME.pageNumberSize)
    .fillColor(PDF_FRAME_COLORS.muted);

  const textHeight = doc.heightOfString(label, { width: box.width, align: 'center', lineGap: 0 });
  const y = frameFooterRuleY(box) - FOOTER_PAGE_NUM_GAP - textHeight;

  doc.text(label, box.x, y, {
    width: box.width,
    align: 'center',
    lineGap: 0,
  });

  return y;
}

/** Max y for body content when a page number is shown. */
export function frameContentBottomLimit(box) {
  return frameFooterRuleY(box) - FOOTER_ABOVE_RULE;
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
    clearContentFooterGap(doc, box);
    drawFramePageNumber(doc, box, { page: index + 1, total });
  }
}

/** Burn & Build Diet program report — single footer draw, pinned to bottom (no gap hacks). */
export const PINNED_FOOTER = Object.freeze({
  bottomPad: 4,
  contactGap: 8,
  pageNumGap: 4,
  contentClearance: 4,
});

export function pinnedFooterBelowRule() {
  return PINNED_FOOTER.contactGap + PT.contact + PINNED_FOOTER.bottomPad;
}

export function pinnedFooterAboveRule() {
  return PINNED_FOOTER.pageNumGap + PT.pageNumber + PINNED_FOOTER.contentClearance;
}

export function pinnedContentBottomY(box) {
  return box.bottom - pinnedFooterBelowRule() - pinnedFooterAboveRule();
}

export function drawPinnedProgramFooter(doc, box, { page, total, contact = PDF_FRAME_CONTACT, fonts = PDF_FRAME_FONTS } = {}) {
  const ruleY = box.bottom - pinnedFooterBelowRule();
  const contactY = box.bottom - PINNED_FOOTER.bottomPad - PT.contact;
  const phone = contact?.phone || '';
  const website = contact?.website || PDF_FRAME_CONTACT.website;
  const email = contact?.email || PDF_FRAME_CONTACT.email;
  const footerLine = [phone, website, email].filter(Boolean).join('  ·  ');

  if (page != null && total != null) {
    const label = `Page ${page} of ${total}`;
    doc
      .font(fonts.regular)
      .fontSize(PT.pageNumber)
      .fillColor(PDF_FRAME_COLORS.muted);
    const textHeight = doc.heightOfString(label, { width: box.width, align: 'center', lineGap: 0 });
    doc.text(label, box.x, ruleY - PINNED_FOOTER.pageNumGap - textHeight, {
      width: box.width,
      align: 'center',
      lineGap: 0,
    });
  }

  drawGoldDivider(doc, box.x, ruleY, box.width);

  doc
    .font(fonts.regular)
    .fontSize(PT.contact)
    .fillColor(PDF_FRAME_COLORS.muted)
    .text(footerLine, box.x, contactY, {
      width: box.width,
      align: 'center',
      lineGap: 0,
    });

  return ruleY;
}

export function stampPinnedProgramFooters(doc, contact = PDF_FRAME_CONTACT, fonts = PDF_FRAME_FONTS) {
  if (typeof doc.bufferedPageRange !== 'function') return 0;
  const range = doc.bufferedPageRange();
  const total = range.count;
  for (let index = 0; index < total; index += 1) {
    doc.switchToPage(range.start + index);
    drawPinnedProgramFooter(doc, frameContentBox(doc), {
      page: index + 1,
      total,
      contact,
      fonts,
    });
  }
  return total;
}
