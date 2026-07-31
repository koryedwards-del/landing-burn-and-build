/**
 * Generic Print Sheet Engine
 *
 * For Best Results is a fixed reference document. It uses
 * browser flow + min-height hacks, which are unreliable across print engines.
 *
 * Each logical page = one .generic-print-sheet (fixed width/height, overflow hidden).
 * Pagination is authored in data/*Printout.js — not computed at runtime.
 */

export const GENERIC_PRINT_VIEWS = new Set(['bestresults']);

export function isGenericPrintView(view) {
  return GENERIC_PRINT_VIEWS.has(view);
}

export function buildGenericPrintSheet({
  orientation = 'portrait',
  headerHtml = '',
  bodyHtml = '',
  logoUrl = '',
  pageIndex = 0,
  isLast = false,
  sectionClass = '',
} = {}) {
  const sheetClass = [
    'generic-print-sheet',
    `generic-print-sheet--${orientation}`,
    isLast ? 'generic-print-sheet--last' : '',
    sectionClass,
  ].filter(Boolean).join(' ');

  const watermarkStyle = logoUrl
    ? ` style="background-image: url('${logoUrl}')"`
    : '';

  return `
    <section class="${sheetClass}" data-page="${pageIndex + 1}">
      <div class="generic-print-sheet__watermark"${watermarkStyle} aria-hidden="true"></div>
      <div class="generic-print-sheet__surface">
        ${headerHtml}
        ${bodyHtml}
      </div>
    </section>
  `;
}

export function buildGenericPrintDocumentHtml({
  view,
  title,
  styles,
  sheetsHtml,
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,400;0,700;1,400&family=Oswald:wght@500;600;700&family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>${styles}</style>
</head>
<body class="generic-print-body generic-print-body--${escapeHtml(view)}">
  <article class="generic-print-document">
    ${sheetsHtml}
  </article>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
