import { isStaticPrintShopBody } from '../../js/printShopViews.js';
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

export function sendPrintPdfResponse(res, view, pdf, title) {
  const body = assertPdfBuffer(pdf);
  const filename = sanitizePdfFilename(title, view);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.setHeader('X-Print-View', view);

  if (isStaticPrintShopBody(view)) {
    res.setHeader('Cache-Control', 'public, max-age=3600');
  } else {
    res.setHeader('Cache-Control', 'no-store');
  }

  res.send(body);
}

export function sendPrintPdfError(res, err) {
  const status = err?.status || 500;
  if (status >= 500) {
    console.error('PDF render error:', err);
  }
  res.status(status).json({
    ok: false,
    message: err?.message || 'Could not generate PDF.',
  });
}
