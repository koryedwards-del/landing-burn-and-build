export class PdfError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'PdfError';
    this.status = status;
  }
}

export function pdfError(message, status = 400) {
  return new PdfError(message, status);
}
