import {
  collectPdfBuffer,
  createPortraitPdf,
} from './draw.js';
import { stampAllPageNumbers } from './drawFrame.js';

/** Burn & Build Diet PDF creator — program report lifecycle. */
export class PrintPdfCreator {
  #doc;
  #bufferPromise;

  constructor({ title, author = 'Burn & Build Diet' } = {}) {
    this.#doc = createPortraitPdf({ title, author });
    this.#bufferPromise = collectPdfBuffer(this.#doc);
  }

  get doc() {
    return this.#doc;
  }

  async finish({ stampPageNumbers = true } = {}) {
    if (stampPageNumbers) {
      stampAllPageNumbers(this.#doc);
    }
    this.#doc.end();
    return this.#bufferPromise;
  }
}

export function createPrintPdf({ title, author } = {}) {
  return new PrintPdfCreator({ title, author });
}
