import {
  collectPdfBuffer,
  createLandscapePdf,
  createPortraitPdf,
} from './draw.js';
import { stampAllPageNumbers } from './drawFrame.js';

/** Burn & Build Diet PDF creator — program report lifecycle. */
export class PrintPdfCreator {
  #doc;
  #bufferPromise;
  #layout;

  constructor({ layout = 'portrait', title, author = 'Burn & Build Diet' } = {}) {
    this.#layout = layout;
    this.#doc = layout === 'landscape'
      ? createLandscapePdf({ title, author })
      : createPortraitPdf({ title, author });
    this.#bufferPromise = collectPdfBuffer(this.#doc);
  }

  get doc() {
    return this.#doc;
  }

  get layout() {
    return this.#layout;
  }

  async finish({ stampPageNumbers = true } = {}) {
    if (stampPageNumbers) {
      stampAllPageNumbers(this.#doc);
    }
    this.#doc.end();
    return this.#bufferPromise;
  }
}

export function createPrintPdf({ layout = 'portrait', title, author } = {}) {
  return new PrintPdfCreator({ layout, title, author });
}
