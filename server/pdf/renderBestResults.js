import { FOR_BEST_RESULTS_PRINT_PAGES } from '../../data/forBestResultsPrintout.js';
import { createPrintPdf } from './creator.js';
import { drawQaItem } from './draw.js';

export async function renderBestResultsPdf({ title } = {}) {
  const docTitle = title || 'B&B - For Best Results';
  const creator = createPrintPdf({ title: docTitle });
  let questionNumber = 0;

  FOR_BEST_RESULTS_PRINT_PAGES.forEach((pageDef) => {
    const { box, y: startY } = creator.addGenericSheet('For Best Results');
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
