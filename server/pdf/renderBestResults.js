import PDFDocument from 'pdfkit';
import { FOR_BEST_RESULTS_PRINT_PAGES } from '../../data/forBestResultsPrintout.js';
import { PDF_BEST_RESULTS } from './constants.js';
import {
  beginPortraitSheet,
  contentBox,
  drawClampedText,
  drawGenericHeader,
  drawWatermark,
} from './draw.js';

function collectPdfBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

function drawBestResultsItem(doc, item, questionNumber, x, y, width, bottomY) {
  if (y >= bottomY - 4) return y;

  const question = `${questionNumber}. ${item.q}`;
  drawClampedText(doc, question, x, y, width, bottomY, {
    font: 'Helvetica-Bold',
    fontSize: PDF_BEST_RESULTS.questionSize,
    fillColor: '#111111',
    lineGap: 0,
  });

  const answerY = doc.y + PDF_BEST_RESULTS.questionAnswerGap;
  if (answerY >= bottomY - 4) return bottomY;

  drawClampedText(doc, item.a, x, answerY, width, bottomY, {
    font: 'Helvetica',
    fontSize: PDF_BEST_RESULTS.answerSize,
    fillColor: '#222222',
    lineGap: PDF_BEST_RESULTS.lineGap,
  });

  return Math.min(doc.y + PDF_BEST_RESULTS.itemGap, bottomY);
}

export async function renderBestResultsPdf({ title } = {}) {
  const docTitle = title || 'B&B - For Best Results';
  const doc = new PDFDocument({
    size: 'LETTER',
    layout: 'portrait',
    margin: 0,
    autoFirstPage: false,
    info: {
      Title: docTitle,
      Author: 'Burn & Build Diet',
    },
  });

  const bufferPromise = collectPdfBuffer(doc);
  let questionNumber = 0;

  FOR_BEST_RESULTS_PRINT_PAGES.forEach((pageDef) => {
    beginPortraitSheet(doc);
    drawWatermark(doc);

    const box = contentBox(doc);
    const bottomY = box.bottom;
    let y = drawGenericHeader(doc, 'For Best Results');

    pageDef.items.forEach((item) => {
      questionNumber += 1;
      y = drawBestResultsItem(doc, item, questionNumber, box.x, y, box.width, bottomY);
    });
  });

  doc.end();
  return bufferPromise;
}
