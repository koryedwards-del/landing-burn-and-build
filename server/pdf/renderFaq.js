import PDFDocument from 'pdfkit';
import { HANDBOOK_FAQ_PRINT_PAGES } from '../../data/handbookFaqPrintout.js';
import { PDF_FAQ } from './constants.js';
import { contentBox, drawGenericHeader, drawWatermark } from './draw.js';

function collectPdfBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

function drawFaqItem(doc, item, questionNumber, x, y, width) {
  const question = `${questionNumber}. ${item.q}`.toUpperCase();

  doc
    .font('Helvetica-Bold')
    .fontSize(PDF_FAQ.questionSize)
    .fillColor('#111111')
    .text(question, x, y, {
      width,
      lineGap: 0,
    });

  const answerY = doc.y + PDF_FAQ.questionAnswerGap;
  doc
    .font('Helvetica')
    .fontSize(PDF_FAQ.answerSize)
    .fillColor('#333333')
    .text(item.a, x, answerY, {
      width,
      lineGap: PDF_FAQ.lineGap,
    });

  return doc.y + PDF_FAQ.itemGap;
}

export async function renderFaqPdf({ title } = {}) {
  const docTitle = title || 'B&B - Frequently Asked Questions';
  const doc = new PDFDocument({
    size: 'LETTER',
    margin: 0,
    autoFirstPage: false,
    info: {
      Title: docTitle,
      Author: 'Burn & Build Diet',
    },
  });

  const bufferPromise = collectPdfBuffer(doc);
  let questionNumber = 0;

  HANDBOOK_FAQ_PRINT_PAGES.forEach((pageDef) => {
    doc.addPage({ size: 'LETTER', margin: 0 });
    drawWatermark(doc);

    const box = contentBox(doc);
    let y = drawGenericHeader(doc, 'Frequently Asked Questions');

    pageDef.items.forEach((item) => {
      questionNumber += 1;
      y = drawFaqItem(doc, item, questionNumber, box.x, y, box.width);
    });
  });

  doc.end();
  return bufferPromise;
}
