/**
 * Modern FAQ pages — Montserrat Q&A layout matching the 2026 report family.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { begin1982Page } from './draw1982Frame.js';
import {
  MODERN_REPORT_COLORS,
  MODERN_REPORT_FONTS,
  modernFooterRuleY,
  registerModernReportFonts,
} from './drawModernReportFrame.js';

const FONTS = MODERN_REPORT_FONTS;
const COLORS = MODERN_REPORT_COLORS;

const PDF_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FAT_CAN_3LB_IMAGE = path.join(PDF_ROOT, 'img/print/fat-can-3lb.png');

const FAQ_FAT_LOSS_QUESTION_NUMBER = 28;

const LAYOUT = Object.freeze({
  questionSize: 9.5,
  answerSize: 9,
  lineGap: 2,
  questionAnswerGap: 3,
  itemGap: 10,
  footerReserve: 36,
  fatCanCount: 3,
  fatCanMaxHeight: 88,
  fatCanGap: 14,
  fatCanGapBefore: 14,
  fatCanGapAfter: 10,
});

function contentBottom(page) {
  return Math.min(page.bottom, modernFooterRuleY(page.box) - LAYOUT.footerReserve);
}

function measureFaqItem(doc, { q, a }, width, questionNumber) {
  const questionText = `${questionNumber}. ${q}`;
  doc.font(FONTS.bold).fontSize(LAYOUT.questionSize);
  const questionH = doc.heightOfString(questionText, { width, lineGap: 0 });
  doc.font(FONTS.regular).fontSize(LAYOUT.answerSize);
  const answerH = doc.heightOfString(String(a || ''), {
    width,
    lineGap: LAYOUT.lineGap,
  });
  return questionH + LAYOUT.questionAnswerGap + answerH + LAYOUT.itemGap;
}

function measureFatCanRow(doc, width) {
  const availableW = width - (LAYOUT.fatCanCount - 1) * LAYOUT.fatCanGap;
  const imageW = availableW / LAYOUT.fatCanCount;
  const height = Math.min(LAYOUT.fatCanMaxHeight, imageW * 1.35);
  return LAYOUT.fatCanGapBefore + height + LAYOUT.fatCanGapAfter;
}

function drawFaqItem(doc, page, { q, a }, questionNumber) {
  const questionText = `${questionNumber}. ${q}`;
  doc
    .font(FONTS.bold)
    .fontSize(LAYOUT.questionSize)
    .fillColor(COLORS.body)
    .text(questionText, page.x, page.y, { width: page.width, lineGap: 0 });

  const answerY = doc.y + LAYOUT.questionAnswerGap;
  doc
    .font(FONTS.regular)
    .fontSize(LAYOUT.answerSize)
    .fillColor(COLORS.body)
    .text(String(a || ''), page.x, answerY, {
      width: page.width,
      lineGap: LAYOUT.lineGap,
    });

  return doc.y + LAYOUT.itemGap;
}

function drawFatCanRow(doc, page) {
  const available = contentBottom(page) - page.y - LAYOUT.fatCanGapBefore - LAYOUT.fatCanGapAfter;
  const availableW = page.width - (LAYOUT.fatCanCount - 1) * LAYOUT.fatCanGap;
  const imageW = availableW / LAYOUT.fatCanCount;
  const height = Math.min(LAYOUT.fatCanMaxHeight, Math.max(48, Math.min(available, imageW * 1.35)));
  const totalWidth = LAYOUT.fatCanCount * imageW + (LAYOUT.fatCanCount - 1) * LAYOUT.fatCanGap;
  const y = page.y + LAYOUT.fatCanGapBefore;
  let x = page.x + (page.width - totalWidth) / 2;

  for (let i = 0; i < LAYOUT.fatCanCount; i += 1) {
    doc.image(FAT_CAN_3LB_IMAGE, x, y, { height });
    x += imageW + LAYOUT.fatCanGap;
  }

  return y + height + LAYOUT.fatCanGapAfter;
}

function beginFaqPage(doc, payload, pageTitle) {
  const page = begin1982Page(doc, payload, pageTitle);
  return { ...page, bottom: contentBottom(page) };
}

function ensureFaqSpace(doc, payload, page, blockHeight) {
  if (page.y + blockHeight <= page.bottom) return page;
  return beginFaqPage(doc, payload, null);
}

export function drawModernFaqPages(doc, payload) {
  const items = payload?.faq?.items;
  if (!items?.length) return;

  registerModernReportFonts(doc);
  let page = beginFaqPage(doc, payload, 'Frequently Asked Questions');

  items.forEach((item, index) => {
    const questionNumber = index + 1;
    let blockH = measureFaqItem(doc, item, page.width, questionNumber);
    if (questionNumber === FAQ_FAT_LOSS_QUESTION_NUMBER) {
      blockH += measureFatCanRow(doc, page.width);
    }

    page = ensureFaqSpace(doc, payload, page, blockH);
    page = { ...page, y: drawFaqItem(doc, page, item, questionNumber) };

    if (questionNumber === FAQ_FAT_LOSS_QUESTION_NUMBER) {
      const canH = measureFatCanRow(doc, page.width);
      page = ensureFaqSpace(doc, payload, page, canH);
      page = { ...page, y: drawFatCanRow(doc, page) };
    }
  });
}
