import PDFDocument from 'pdfkit';
import { FOR_BEST_RESULTS_PRINT_PAGES } from '../../data/forBestResultsPrintout.js';
import { PDF_BEST_RESULTS } from './constants.js';
import { contentBox, drawGenericHeader, drawWatermark } from './draw.js';

function collectPdfBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

function drawBestResultsItem(doc, item, questionNumber, x, y, width) {
  const question = `${questionNumber}. ${item.q}`;

  doc
    .font('Helvetica-Bold')
    .fontSize(PDF_BEST_RESULTS.questionSize)
    .fillColor('#111111')
    .text(question, x, y, {
      width,
      lineGap: 0,
    });

  const answerY = doc.y + PDF_BEST_RESULTS.questionAnswerGap;
  doc
    .font('Helvetica')
    .fontSize(PDF_BEST_RESULTS.answerSize)
    .fillColor('#222222')
    .text(item.a, x, answerY, {
      width,
      lineGap: PDF_BEST_RESULTS.lineGap,
    });

  return doc.y + PDF_BEST_RESULTS.itemGap;
}

export async function renderBestResultsPdf({ title } = {}) {
  const docTitle = title || 'B&B - For Best Results';
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

  FOR_BEST_RESULTS_PRINT_PAGES.forEach((pageDef) => {
    doc.addPage({ size: 'LETTER', margin: 0 });
    drawWatermark(doc);

    const box = contentBox(doc);
    let y = drawGenericHeader(doc, 'For Best Results');

    pageDef.items.forEach((item) => {
      questionNumber += 1;
      y = drawBestResultsItem(doc, item, questionNumber, box.x, y, box.width);
    });
  });

  doc.end();
  return bufferPromise;
}
