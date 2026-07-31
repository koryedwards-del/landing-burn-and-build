/** Print Shop view titles — used for PDF metadata and filenames. */

import { programClientName } from '../../js/programBridgeUi.js';

export const PRINT_VIEW_TITLES = {
  week: 'Weekly',
  shopping: 'Grocery List',
  foodlist: 'Food List',
  bestresults: 'For Best Results',
  faq: 'Frequently Asked Questions',
};

export function printDocumentTitle(view, programPackage) {
  const name = programClientName(programPackage);
  const docName = PRINT_VIEW_TITLES[view] || 'Weekly';
  return `B&B- ${docName} - ${name}`;
}
