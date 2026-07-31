import { FOR_BEST_RESULTS_PRINT_PAGES } from '../../data/forBestResultsPrintout.js';
import {
  addGenericSheet,
  collectPdfBuffer,
  createPortraitPdf,
  drawQaItem,
} from './draw.js';

export async function renderBestResultsPdf({ title } = {}) {
  const docTitle = title || 'B&B - For Best Results';
  const doc = createPortraitPdf({ title: docTitle });
  const bufferPromise = collectPdfBuffer(doc);
  let questionNumber = 0;

  FOR_BEST_RESULTS_PRINT_PAGES.forEach((pageDef) => {
    const { box, y: startY } = addGenericSheet(doc, 'For Best Results');
    let y = startY;

    pageDef.items.forEach((item) => {
      questionNumber += 1;
      y = drawQaItem(
        doc,
        { question: item.q, answer: item.a, x: box.x, y, width: box.width },
        { questionNumber, uppercaseQuestion: true },
      );
    });
  });

  doc.end();
  return bufferPromise;
}
