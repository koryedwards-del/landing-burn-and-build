/** Print Shop view titles — used for PDF metadata and filenames. */

import { programClientName } from '../../js/programBridgeUi.js';
import { isPrintShopView } from '../../js/printShopViews.js';

export const PRINT_VIEW_TITLES = Object.freeze({
  week: 'Weekly',
  shopping: 'Grocery List',
  foodlist: 'Food List',
  bestresults: 'For Best Results',
  faq: 'Frequently Asked Questions',
  programreport: 'Burn & Build Diet',
});

export function printDocumentTitle(view, programPackage) {
  const name = programClientName(programPackage);
  const docName = PRINT_VIEW_TITLES[view] || 'Weekly';
  return `B&B- ${docName} - ${name}`;
}

export function assertPrintShopView(view) {
  if (!isPrintShopView(view)) {
    throw new Error(`Print Shop view not supported: ${view}`);
  }
  return view;
}
