/** Print Shop styles — personalized flow docs + generic fixed-sheet docs. */

import {
  PRINT_VIEW_CONFIG,
  PRINT_PAGE_MARGIN,
  PRINT_PAGE_PADDING,
  PRINT_SHEET_MIN_HEIGHT,
} from './plannerPrintShell.js';
import { isGenericPrintView } from './genericPrintEngine.js';

/** Generic docs: zero @page margin; inset lives on each fixed-size sheet. */
const GENERIC_SHEET_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Open Sans", system-ui, sans-serif;
    background: #ececec;
    color: #111111;
    margin: 0;
  }
  .generic-print-document {
    background: #ffffff;
    color: #111111;
    margin: 0 auto;
  }
  .generic-print-sheet {
    position: relative;
    width: 8.5in;
    height: 11in;
    padding: 0.35in 0.44in;
    overflow: hidden;
    background: #ffffff;
    page-break-after: always;
    break-after: page;
  }
  .generic-print-sheet--landscape {
    width: 11in;
    height: 8.5in;
  }
  .generic-print-sheet--last {
    page-break-after: auto;
    break-after: auto;
  }
  .generic-print-sheet__watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 240px;
    height: 240px;
    transform: translate(-50%, -50%);
    background-position: center;
    background-size: contain;
    background-repeat: no-repeat;
    opacity: 0.06;
    pointer-events: none;
    z-index: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .generic-print-sheet__surface {
    position: relative;
    z-index: 1;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .print-header {
    display: flex;
    align-items: center;
    gap: 20px;
    flex-shrink: 0;
    margin-bottom: 14px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e8e8e8;
    background: transparent;
  }
  .print-logo {
    display: block;
    width: 72px;
    height: auto;
    flex-shrink: 0;
  }
  .print-header-brand {
    font-family: Oswald, system-ui, sans-serif;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #888;
    margin-bottom: 4px;
  }
  .print-header-title {
    font-family: Oswald, system-ui, sans-serif;
    font-size: 2rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #111;
    line-height: 1.05;
    margin-bottom: 4px;
  }
  @media print {
    body { background: #fff; }
    .generic-print-document {
      background: transparent;
      margin: 0;
    }
    .generic-print-sheet {
      padding: 0.35in 0.44in;
      background: #ffffff;
    }
  }
`;

const PRINT_SHELL_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Open Sans", system-ui, sans-serif;
    background: #ececec;
    color: #111111;
    margin: 0;
  }
  .print-document {
    background: #ffffff;
    color: #111111;
    margin: 0 auto;
    position: relative;
  }
  .print-page-surface {
    position: relative;
    z-index: 1;
    background: transparent;
  }
  .print-watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 240px;
    pointer-events: none;
    z-index: 0;
  }
  .print-watermark img {
    display: block;
    width: 240px;
    height: auto;
    opacity: 0.06;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .print-page {
    position: relative;
    box-sizing: border-box;
    padding: ${PRINT_PAGE_PADDING};
    background: #ffffff;
  }
  .print-body--bestresults .print-page--sheet {
    min-height: ${PRINT_SHEET_MIN_HEIGHT.portrait};
  }
  .print-page--break,
  .print-page--sheet + .print-page--sheet {
    break-before: page;
    page-break-before: always;
  }
  .print-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 14px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e8e8e8;
    background: transparent;
  }
  .print-logo {
    display: block;
    width: 72px;
    height: auto;
    flex-shrink: 0;
  }
  .print-header-brand {
    font-family: Oswald, system-ui, sans-serif;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #888;
    margin-bottom: 4px;
  }
  .print-header-title {
    font-family: Oswald, system-ui, sans-serif;
    font-size: 2rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #111;
    line-height: 1.05;
    margin-bottom: 4px;
  }
  .print-header-meta {
    font-size: 0.82rem;
    color: #666;
    letter-spacing: 0.01em;
  }
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  .assistant-empty { color: #666; font-size: 0.9rem; }
  @media print {
    body { background: #fff; }
    .print-document {
      background: transparent;
      padding: 0;
      margin: 0;
      max-width: none;
    }
    .print-page {
      padding: ${PRINT_PAGE_PADDING};
      background: transparent;
    }
    .print-page-surface,
    .print-header {
      background: transparent;
    }
    .print-logo {
      width: 72px;
    }
    .print-body--week::after,
    .print-body--shopping::after {
      content: '';
      position: fixed;
      top: 50%;
      left: 50%;
      width: 240px;
      height: 200px;
      transform: translate(-50%, -50%);
      background: var(--print-watermark) center / contain no-repeat;
      opacity: 0.06;
      pointer-events: none;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .print-body--foodlist .print-page--sheet {
      min-height: ${PRINT_SHEET_MIN_HEIGHT.landscape};
    }
    .print-body--bestresults .print-page--sheet,
    .print-body--faq .print-page--sheet {
      min-height: ${PRINT_SHEET_MIN_HEIGHT.portrait};
    }
  }
`;

const WEEK_CONTENT_STYLES = `
  .agenda-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }
  .agenda-table-corner {
    width: 76px;
    border-bottom: 2px solid transparent;
  }
  .agenda-day-head {
    font-family: Oswald, system-ui, sans-serif;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    text-align: center;
    color: #111;
    padding: 0 6px 8px;
    border-bottom: 2px solid #fdc500;
    vertical-align: bottom;
  }
  .agenda-row-head {
    font-family: Oswald, system-ui, sans-serif;
    vertical-align: top;
    text-align: right;
    padding: 26px 10px 26px 0;
    border-bottom: 1px solid #ececec;
    width: 76px;
  }
  .agenda-row:last-child .agenda-row-head,
  .agenda-row:last-child .agenda-cell {
    border-bottom: none;
  }
  .agenda-cell {
    vertical-align: top;
    padding: 26px 10px;
    border-bottom: 1px solid #ececec;
    border-left: 1px solid #f2f2f2;
  }
  .agenda-time {
    display: block;
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    color: #111;
    line-height: 1.2;
  }
  .agenda-meal-label {
    display: block;
    font-size: 0.56rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #777;
    line-height: 1.25;
    margin-top: 1px;
  }
  .agenda-cell-empty {
    display: block;
    color: #d8d8d8;
    font-size: 0.85rem;
    text-align: center;
    line-height: 1;
  }
  .agenda-foods {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .agenda-foods li {
    display: flex;
    justify-content: space-between;
    gap: 6px;
    font-size: 0.62rem;
    line-height: 1.35;
  }
  .agenda-food { font-weight: 400; color: #222; }
  .agenda-meal-title .agenda-food { font-weight: 700; color: #111; }
  .agenda-amount {
    font-weight: 700;
    font-size: 0.62rem;
    color: #111;
    text-align: right;
    flex-shrink: 0;
  }
  @media print {
    .agenda-row-head,
    .agenda-cell {
      padding-top: 22px;
      padding-bottom: 22px;
    }
  }
`;

const SHOPPING_CONTENT_STYLES = `
  .assistant-section h2 {
    font-family: Oswald, system-ui, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #333;
    margin-bottom: 8px;
  }
  .assistant-section { margin-bottom: 20px; }
  .assistant-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .assistant-list li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    font-size: 0.9rem;
    padding: 4px 0;
    border-bottom: 1px solid #eee;
  }
  .assistant-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    flex: 1;
    min-width: 0;
    cursor: pointer;
  }
  .assistant-check {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    margin-top: 2px;
    accent-color: #c9a000;
  }
  .assistant-food { flex: 1; }
  .assistant-amount {
    color: #333;
    font-weight: 600;
    text-align: right;
    flex-shrink: 0;
    max-width: 38%;
  }
`;

const BESTRESULTS_CONTENT_STYLES = `
  .print-qa-page {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
  .print-qa-item {
    break-inside: avoid;
    margin-bottom: 2em;
  }
  .print-qa-item:last-child {
    margin-bottom: 0;
  }
  .print-qa-question {
    font-family: "Open Sans", system-ui, sans-serif;
    font-size: 0.78rem;
    font-weight: 700;
    line-height: 1.35;
    letter-spacing: 0.01em;
    color: #111;
    margin-bottom: 0.4em;
  }
  .print-qa-answer {
    font-family: Merriweather, Georgia, "Times New Roman", serif;
    font-size: 0.72rem;
    line-height: 1.5;
    color: #222;
  }
  @media print {
    .print-qa-item { margin-bottom: 2em; }
    .print-qa-question { font-size: 0.74rem; }
    .print-qa-answer { font-size: 0.68rem; line-height: 1.5; }
  }
`;

const CONTENT_STYLES = {
  week: WEEK_CONTENT_STYLES,
  shopping: SHOPPING_CONTENT_STYLES,
  bestresults: BESTRESULTS_CONTENT_STYLES,
};

function buildPrintStylesForView(view) {
  const config = PRINT_VIEW_CONFIG[view] || PRINT_VIEW_CONFIG.week;
  const contentStyles = CONTENT_STYLES[view] || CONTENT_STYLES.week;

  if (isGenericPrintView(view)) {
    const pageRule = `@page { size: ${config.pageSize}; margin: 0; }`;
    return `${pageRule}\n${GENERIC_SHEET_STYLES}\n${contentStyles}`;
  }

  const pageRule = `@page { size: ${config.pageSize}; margin: ${PRINT_PAGE_MARGIN}; }`;
  return `${pageRule}\n${PRINT_SHELL_STYLES}\n${contentStyles}`;
}

export {
  buildPrintStylesForView,
};
