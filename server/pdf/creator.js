import {
  addGenericSheet,
  addPersonalizedSheet,
  collectPdfBuffer,
  createLandscapePdf,
  createPortraitPdf,
} from './draw.js';
import { stampAllPageNumbers } from './drawFrame.js';

/**
 * Burn & Build Print Shop PDF creator.
 * Owns document lifecycle and sheet headers for all five documents.
 */
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

  addGenericSheet(headerTitle) {
    return addGenericSheet(this.#doc, headerTitle);
  }

  addPersonalizedSheet({
    headerTitle,
    clientName,
    preparedAt,
    layout = this.#layout,
  }) {
    return addPersonalizedSheet(this.#doc, {
      headerTitle,
      clientName,
      preparedAt,
      layout,
    });
  }

  drawEmptyMessage(box, y, message) {
    this.#doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#666666')
      .text(String(message || ''), box.x, y, { width: box.width, lineGap: 2 });
  }

  async finish() {
    stampAllPageNumbers(this.#doc);
    this.#doc.end();
    return this.#bufferPromise;
  }
}

export function createPrintPdf({ layout = 'portrait', title, author } = {}) {
  return new PrintPdfCreator({ layout, title, author });
}
