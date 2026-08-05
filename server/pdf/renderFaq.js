import { HANDBOOK_FAQ_ITEMS } from '../../data/handbookFaqPrintout.js';
import { createPrintPdf } from './creator.js';
import { drawQaItem, measureQaItemHeight } from './draw.js';
import { createFramePaginator } from './framePaginator.js';

export async function renderFaqPdf({ title } = {}) {
  const docTitle = title || 'B&B - Frequently Asked Questions';
  const creator = createPrintPdf({ title: docTitle });
  const doc = creator.doc;
  const paginator = createFramePaginator(doc, { personalized: false });

  paginator.startPage({ pageTitle: 'Frequently Asked Questions' });
  const { x, width } = paginator.container;

  HANDBOOK_FAQ_ITEMS.forEach((item, index) => {
    const questionNumber = index + 1;
    const blockHeight = measureQaItemHeight(
      doc,
      { question: item.q, answer: item.a, width },
      { questionNumber, uppercaseQuestion: true },
    );
    paginator.ensureSpace(blockHeight);
    paginator.y = drawQaItem(
      doc,
      { question: item.q, answer: item.a, x, y: paginator.y, width },
      { questionNumber, uppercaseQuestion: true },
    );
  });

  paginator.close();
  return creator.finish();
}
