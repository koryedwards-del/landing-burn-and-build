import { HANDBOOK_FAQ_PRINT_PAGES } from '../../data/handbookFaqPrintout.js';
import { createPrintPdf } from './creator.js';
import { drawQaItem } from './draw.js';

export async function renderFaqPdf({ title } = {}) {
  const docTitle = title || 'B&B - Frequently Asked Questions';
  const creator = createPrintPdf({ title: docTitle });
  let questionNumber = 0;

  HANDBOOK_FAQ_PRINT_PAGES.forEach((pageDef) => {
    const { box, y: startY } = creator.addGenericSheet('Frequently Asked Questions');
    let y = startY;

    pageDef.items.forEach((item) => {
      questionNumber += 1;
      y = drawQaItem(
        creator.doc,
        { question: item.q, answer: item.a, x: box.x, y, width: box.width },
        { questionNumber, uppercaseQuestion: true },
      );
    });
  });

  return creator.finish();
}
