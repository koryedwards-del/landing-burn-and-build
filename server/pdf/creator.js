import {
  addGenericSheet,
  addPersonalizedSheet,
  collectPdfBuffer,
  createLandscapePdf,
  createPortraitPdf,
} from './draw.js';

/**
 * Burn & Build Print Shop PDF creator.
 * Owns document lifecycle, sheet headers, and pagination helpers.
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

  /**
   * Advance to a new sheet when content will not fit.
   * @returns {{ y: number, sheet: object }}
   */
  paginate({ y, bottom, needed, newSheet }) {
    if (y + needed <= bottom) {
      return { y, sheet: null };
    }
    const sheet = newSheet();
    return { y: sheet.y, sheet };
  }

  drawEmptyMessage(box, y, message) {
    this.#doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#666666')
      .text(String(message || ''), box.x, y, { width: box.width, lineGap: 2 });
  }

  async finish() {
    this.#doc.end();
    return this.#bufferPromise;
  }
}

export function createPrintPdf({ layout = 'portrait', title, author } = {}) {
  return new PrintPdfCreator({ layout, title, author });
}
