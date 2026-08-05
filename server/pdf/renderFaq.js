import { HANDBOOK_FAQ_PRINT_PAGES } from '../../data/handbookFaqPrintout.js';
import { createPrintPdf } from './creator.js';
import { drawQaItem } from './draw.js';
import {
  addFramePage,
  drawFrameFooter,
  drawFrameHeader,
  drawFramePageTitle,
} from './drawFrame.js';

export async function renderFaqPdf({ title } = {}) {
  const docTitle = title || 'B&B - Frequently Asked Questions';
  const creator = createPrintPdf({ title: docTitle });
  const doc = creator.doc;
  let questionNumber = 0;

  HANDBOOK_FAQ_PRINT_PAGES.forEach((pageDef, pageIndex) => {
    const box = addFramePage(doc);
    let y = drawFrameHeader(doc, box, { personalized: false });

    if (pageIndex === 0) {
      y = drawFramePageTitle(doc, 'Frequently Asked Questions', box.x, y, box.width);
    }

    pageDef.items.forEach((item) => {
      questionNumber += 1;
      y = drawQaItem(
        doc,
        { question: item.q, answer: item.a, x: box.x, y, width: box.width },
        { questionNumber, uppercaseQuestion: true },
      );
    });

    drawFrameFooter(doc, box);
  });

  return creator.finish();
}
