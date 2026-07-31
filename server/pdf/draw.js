import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import {
  PDF_COLORS,
  PDF_HEADER,
  PDF_LOGO_REL,
  PDF_MARGIN,
  PDF_QA,
  PDF_WATERMARK_OPACITY,
  PDF_WATERMARK_SIZE_PT,
} from './constants.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const logoPath = path.join(root, PDF_LOGO_REL);

export function collectPdfBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

export function createPortraitPdf({ title, author = 'Burn & Build Diet' } = {}) {
  return new PDFDocument({
    size: 'LETTER',
    layout: 'portrait',
    margin: 0,
    autoFirstPage: false,
    info: {
      Title: title || 'Burn & Build Diet',
      Author: author,
    },
  });
}

export function contentBox(doc) {
  const { width, height } = doc.page;
  return {
    x: PDF_MARGIN.left,
    y: PDF_MARGIN.top,
    width: width - PDF_MARGIN.left - PDF_MARGIN.right,
    height: height - PDF_MARGIN.top - PDF_MARGIN.bottom,
    bottom: height - PDF_MARGIN.bottom,
  };
}

/** Logo watermark + generic header — one sheet in the Print Shop family. */
export function addGenericSheet(doc, headerTitle) {
  doc.addPage({ size: 'LETTER', layout: 'portrait', margin: 0 });
  drawWatermark(doc);
  const box = contentBox(doc);
  const y = drawGenericHeader(doc, headerTitle, box);
  return { box, y };
}

export function drawWatermark(doc) {
  const { width, height } = doc.page;
  const size = PDF_WATERMARK_SIZE_PT;
  const x = (width - size) / 2;
  const y = (height - size) / 2;

  doc.save();
  doc.opacity(PDF_WATERMARK_OPACITY);
  doc.image(logoPath, x, y, { width: size, height: size, fit: [size, size] });
  doc.restore();
  doc.opacity(1);
}

export function drawGenericHeader(doc, title, box = contentBox(doc)) {
  const logoY = box.y;
  const textX = box.x + PDF_HEADER.logoWidth + 16;
  const textWidth = box.width - PDF_HEADER.logoWidth - 16;

  doc.image(logoPath, box.x, logoY, { width: PDF_HEADER.logoWidth });

  let textY = logoY + 2;
  doc
    .font('Helvetica-Bold')
    .fontSize(PDF_HEADER.brandSize)
    .fillColor(PDF_COLORS.brand)
    .text('BURN & BUILD DIET', textX, textY, {
      width: textWidth,
      characterSpacing: 1.6,
    });

  textY = doc.y + 3;
  doc
    .font('Helvetica-Bold')
    .fontSize(PDF_HEADER.titleSize)
    .fillColor(PDF_COLORS.question)
    .text(String(title || '').toUpperCase(), textX, textY, {
      width: textWidth,
      lineGap: 0,
    });

  const headerBottom = Math.max(doc.y, logoY + PDF_HEADER.logoWidth) + PDF_HEADER.ruleGap;
  doc
    .strokeColor(PDF_COLORS.rule)
    .lineWidth(1)
    .moveTo(box.x, headerBottom)
    .lineTo(box.x + box.width, headerBottom)
    .stroke();

  doc.fillColor(PDF_COLORS.question);
  return headerBottom + PDF_HEADER.gap;
}

/**
 * Shared Q&A block — FAQ, For Best Results, and food-list tips.
 * @returns {number} next y position
 */
export function drawQaItem(
  doc,
  { question, answer, x, y, width },
  { questionNumber, uppercaseQuestion = false } = {},
) {
  const prefix = questionNumber != null ? `${questionNumber}. ` : '';
  const questionText = `${prefix}${question}`;
  const displayQuestion = uppercaseQuestion ? questionText.toUpperCase() : questionText;

  doc
    .font('Helvetica-Bold')
    .fontSize(PDF_QA.questionSize)
    .fillColor(PDF_COLORS.question)
    .text(displayQuestion, x, y, {
      width,
      lineGap: 0,
    });

  const answerY = doc.y + PDF_QA.questionAnswerGap;
  doc
    .font('Helvetica')
    .fontSize(PDF_QA.answerSize)
    .fillColor(PDF_COLORS.body)
    .text(answer, x, answerY, {
      width,
      lineGap: PDF_QA.lineGap,
    });

  return doc.y + PDF_QA.itemGap;
}
