import { HANDBOOK_FAQ_PRINT_PAGES } from '../../data/handbookFaqPrintout.js';
import {
  addGenericSheet,
  collectPdfBuffer,
  createPortraitPdf,
  drawQaItem,
} from './draw.js';

export async function renderFaqPdf({ title } = {}) {
  const docTitle = title || 'B&B - Frequently Asked Questions';
  const doc = createPortraitPdf({ title: docTitle });
  const bufferPromise = collectPdfBuffer(doc);
  let questionNumber = 0;

  HANDBOOK_FAQ_PRINT_PAGES.forEach((pageDef) => {
    const { box, y: startY } = addGenericSheet(doc, 'Frequently Asked Questions');
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
