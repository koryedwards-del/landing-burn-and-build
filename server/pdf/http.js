import { PdfError } from './errors.js';

export function sanitizePdfFilename(title, view) {
  const safeName = String(title || `burn-and-build-${view}`)
    .replace(/[^\w\s.-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    || `burn-and-build-${view}`;
  return `${safeName}.pdf`;
}

export function assertPdfBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 5) {
    throw new PdfError('PDF render produced invalid output.', 500);
  }
  if (buffer.slice(0, 5).toString('latin1') !== '%PDF-') {
    throw new PdfError('PDF render produced invalid output.', 500);
  }
  return buffer;
}
