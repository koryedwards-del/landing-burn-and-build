/** Shared Print Shop shell — one template, content dropped in. */

import { formatPrintDateTime, programClientName } from '../../js/programBridgeUi.js';

/** Identical across all five Print Shop documents. */
export const PRINT_PAGE_MARGIN = '0.35in';
export const PRINT_PAGE_PADDING = '36px 44px 36px';

/** Letter content area inside @page margins (0.35in top + bottom). */
export const PRINT_SHEET_MIN_HEIGHT = {
  portrait: '10.3in',
  landscape: '7.8in',
};

/** @typedef {'generic' | 'personalized'} PrintHeaderVariant */
/** @typedef {'sheet' | 'flow'} PrintWatermarkMode */

/**
 * Print view config. Shell owns page wrapper, header, margins, watermark.
 * Each page shell: watermark (sheet docs) + transparent surface (header + body).
 *
 * headerVariant:
 *   generic      — logo + brand + title
 *   personalized — logo + title + prepared-for line
 *
 * watermarkMode:
 *   sheet — one printed page per shell; watermark embedded in each page
 *   flow  — content paginates; watermark via body CSS on print
 */
export const PRINT_VIEW_CONFIG = {
  week: {
    docTitle: 'Weekly',
    pageSize: 'landscape',
    headerVariant: 'personalized',
    headerTitle: 'Weekly Meal Plan',
    watermarkMode: 'flow',
  },
  shopping: {
    docTitle: 'Grocery List',
    pageSize: 'portrait',
    headerVariant: 'personalized',
    headerTitle: 'Grocery List',
    watermarkMode: 'flow',
  },
  foodlist: {
    docTitle: 'Food List',
    pageSize: 'landscape',
    headerVariant: 'generic',
    headerTitle: 'Food List',
    watermarkMode: 'sheet',
  },
  bestresults: {
    docTitle: 'For Best Results',
    pageSize: 'portrait',
    headerVariant: 'generic',
    headerTitle: 'For Best Results',
    watermarkMode: 'flow',
  },
  faq: {
    docTitle: 'Frequently Asked Questions',
    pageSize: 'portrait',
    headerVariant: 'generic',
    headerTitle: 'Frequently Asked Questions',
    watermarkMode: 'sheet',
  },
};

export function printDocumentTitle(view, programPackage) {
  const name = programClientName(programPackage);
  const docName = PRINT_VIEW_CONFIG[view]?.docTitle || 'Weekly';
  return `B&B- ${docName} - ${name}`;
}

export function buildPrintWatermarkHtml(logoUrl) {
  return `
    <div class="print-watermark" aria-hidden="true">
      <img src="${logoUrl}" alt="" width="240" height="240" />
    </div>
  `;
}

export function buildPrintHeaderHtml(variant, title, { logoUrl, programPackage } = {}) {
  const name = escapeHtml(programClientName(programPackage));
  const date = escapeHtml(formatPrintDateTime(new Date()));
  const brandLine = variant === 'generic'
    ? '<p class="print-header-brand">Burn &amp; Build Diet</p>'
    : '';
  const metaLine = variant === 'personalized'
    ? `<p class="print-header-meta">Prepared for ${name} · ${date}</p>`
    : '';

  return `
    <header class="print-header print-header--${variant}">
      <img class="print-logo" src="${logoUrl}" alt="Burn &amp; Build" width="72" height="72" />
      <div class="print-header-text">
        ${brandLine}
        <h1 class="print-header-title">${escapeHtml(title)}</h1>
        ${metaLine}
      </div>
    </header>
  `;
}

export function buildPrintViewHeaderHtml(view, context) {
  const config = PRINT_VIEW_CONFIG[view] || PRINT_VIEW_CONFIG.week;
  return buildPrintHeaderHtml(config.headerVariant, config.headerTitle, context);
}

export function buildPrintPageShell({
  headerHtml,
  bodyHtml,
  logoUrl = '',
  breakBefore = false,
  sheet = false,
  sectionClass = '',
} = {}) {
  const classes = [
    'print-page',
    sectionClass,
    sheet ? 'print-page--sheet' : '',
    breakBefore ? 'print-page--break' : '',
  ].filter(Boolean).join(' ');
  const watermarkHtml = sheet && logoUrl ? buildPrintWatermarkHtml(logoUrl) : '';

  return `
    <section class="${classes}">
      ${watermarkHtml}
      <div class="print-page-surface">
        ${headerHtml}
        ${bodyHtml}
      </div>
    </section>
  `;
}

export function buildPrintDocumentHtml({
  view,
  title,
  logoHref,
  styles,
  bodyHtml,
}) {
  const config = PRINT_VIEW_CONFIG[view] || PRINT_VIEW_CONFIG.week;
  const watermarkVar = config.watermarkMode === 'flow'
    ? `--print-watermark: url('${escapeHtml(logoHref)}');`
    : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,400;0,700;1,400&family=Oswald:wght@500;600;700&family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>${styles}</style>
</head>
<body class="print-body print-body--${view}" style="${watermarkVar}">
  <article class="print-document">
    ${bodyHtml}
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
