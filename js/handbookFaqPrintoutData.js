/** Standalone FAQ handbook PDF — generic reference doc (not part of the Burn & Build Diet PDF). */

import { HANDBOOK_FAQ_ITEMS } from '../data/handbookFaqPrintout.js';
import { SAMPLE_DIET_HEADER } from './sampleDietPrintoutCopyData.js';

export function buildHandbookFaqPayload() {
  return {
    view: 'handbookfaq',
    handbook: true,
    title: 'Burn & Build FAQ Handbook',
    clientName: '',
    preparedDate: '',
    header: { ...SAMPLE_DIET_HEADER },
    faq: {
      items: HANDBOOK_FAQ_ITEMS,
    },
  };
}
