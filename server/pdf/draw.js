import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import { PDF_LOGO_REL } from './constants.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const logoPath = path.join(root, PDF_LOGO_REL);

const PDF_WATERMARK_OPACITY = 0.08;
const PDF_WATERMARK_SIZE_PT = 180;

export function drawWatermark(doc) {
  const { width, height } = doc.page;
  const size = PDF_WATERMARK_SIZE_PT;
  const x = (width - size) / 2;
  const y = (height - size) / 2;

  doc.save();
  doc.opacity(PDF_WATERMARK_OPACITY);
  doc.image(logoPath, x, y, { width: size, height: size, fit: [size, size] });
  doc.restore();
  doc.opacity(1);
}

export function collectPdfBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

export function createPortraitPdf({ title, author = 'Burn & Build Diet', bufferPages = true } = {}) {
  return new PDFDocument({
    size: 'LETTER',
    layout: 'portrait',
    margin: 0,
    autoFirstPage: false,
    bufferPages,
    info: {
      Title: title || 'Burn & Build Diet',
      Author: author,
    },
  });
}
