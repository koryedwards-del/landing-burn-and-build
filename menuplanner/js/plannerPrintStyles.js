/** Print Shop styles — shared shell + per-content extensions. */

import { PRINT_VIEW_CONFIG } from './plannerPrintShell.js';

const PRINT_SHELL_BASE = `
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
  .print-watermark {
    z-index: 0;
    pointer-events: none;
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .print-watermark img {
    width: 240px;
    height: auto;
    opacity: 0.06;
  }
  .print-page {
    position: relative;
    z-index: 1;
  }
  .print-page--break,
  .print-page--sheet + .print-page--sheet {
    break-before: page;
    page-break-before: always;
  }
  .print-header,
  .print-page > *:not(.print-watermark) {
    position: relative;
    z-index: 1;
  }
  .print-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e8e8e8;
  }
  .print-logo {
    display: block;
    width: 72px;
    height: auto;
    flex-shrink: 0;
  }
  .print-header--personalized {
    margin-bottom: 14px;
    padding-bottom: 12px;
  }
  .print-header--personalized .print-header-title {
    margin-bottom: 4px;
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
    margin-bottom: 8px;
  }
  .print-header-meta {
    font-size: 0.82rem;
    color: #666;
    letter-spacing: 0.01em;
  }
  .print-doc-footer {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin-top: 28px;
    padding-top: 12px;
    border-top: 1px solid #e8e8e8;
    font-size: 0.68rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #999;
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
    .print-watermark {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
`;

const WEEK_CONTENT_STYLES = `
  .print-body--week .print-document {
    padding: 36px 44px 52px;
  }
  .agenda-section-title {
    font-family: Oswald, system-ui, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #111;
    margin-bottom: 4px;
  }
  .agenda-section-sub {
    font-size: 0.78rem;
    color: #666;
    margin-bottom: 18px;
  }
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
    .print-logo { width: 64px; }
    .agenda-row-head,
    .agenda-cell {
      padding-top: 22px;
      padding-bottom: 22px;
    }
  }
`;

const SHOPPING_CONTENT_STYLES = `
  .print-body--shopping .print-document {
    padding: 36px 44px 52px;
    max-width: 540px;
  }
  h2 {
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
  @media print {
    .print-body--shopping .print-document { max-width: none; }
    .print-logo { width: 64px; }
  }
`;

const FOODLIST_CONTENT_STYLES = `
  .print-body--foodlist .print-document {
    padding: 18px 24px 16px;
  }
  .print-body--foodlist .print-header {
    gap: 14px;
    margin-bottom: 10px;
    padding-bottom: 8px;
  }
  .print-body--foodlist .print-logo { width: 48px; }
  .print-body--foodlist .print-header-brand {
    font-size: 0.58rem;
    margin-bottom: 2px;
  }
  .print-body--foodlist .print-header-title {
    font-size: 1.35rem;
    margin-bottom: 2px;
  }
  .food-list-section + .food-list-section {
    margin-top: 18px;
    padding-top: 18px;
    border-top: 1px solid #e8e8e8;
  }
  .food-list-columns {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0;
    align-items: start;
  }
  .food-list-col {
    position: relative;
    padding: 0 12px;
    border-left: 2px solid #111;
  }
  .food-list-col:first-child { border-left: none; padding-left: 0; }
  .food-list-col:last-child { padding-right: 0; }
  .food-list-col-title {
    font-family: Oswald, system-ui, sans-serif;
    font-size: 0.82rem;
    font-weight: 700;
    font-style: italic;
    letter-spacing: 0.04em;
    text-align: center;
    color: #111;
    margin-bottom: 8px;
  }
  .food-list-items {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .food-list-items li {
    font-size: 0.56rem;
    line-height: 1.2;
    padding: 1px 0;
  }
  .food-list-name { color: #222; }
  .food-list-col-title--spacer { visibility: hidden; }
  .food-list-col--empty { min-height: 1px; }
  .food-list-tips {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .food-list-tips p {
    font-size: 0.62rem;
    line-height: 1.4;
    color: #222;
  }
  @media print {
    .print-page--sheet {
      min-height: 7.5in;
      box-sizing: border-box;
      position: relative;
      break-before: page;
      page-break-before: always;
    }
    .print-page--sheet:first-child {
      break-before: auto;
      page-break-before: auto;
    }
    .print-body--foodlist .print-logo { width: 44px; }
    .food-list-col-title { margin-bottom: 6px; }
    .print-page + .print-page,
    .food-list-section + .food-list-section {
      margin-top: 0;
      padding-top: 0;
      border-top: none;
    }
  }
`;

const QA_CONTENT_STYLES = `
  .print-body--bestresults .print-document,
  .print-body--faq .print-document {
    padding: 18px 24px 20px;
  }
  .print-content--qa .print-header {
    gap: 12px;
    margin-bottom: 10px;
    padding-bottom: 8px;
  }
  .print-content--qa .print-logo { width: 44px; }
  .print-content--qa .print-header-brand {
    font-size: 0.56rem;
    margin-bottom: 2px;
  }
  .print-content--qa .print-header-title {
    font-size: 1.2rem;
    margin-bottom: 0;
  }
  .faq-page {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .faq-item { break-inside: avoid; }
  .faq-question {
    font-family: Oswald, system-ui, sans-serif;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: #111;
    line-height: 1.2;
    margin-bottom: 1px;
  }
  .faq-question-num { font-weight: 700; }
  .faq-answer {
    font-size: 0.64rem;
    line-height: 1.4;
    color: #333;
  }
  @media print {
    .print-content--qa .print-header {
      margin-bottom: 6px;
      padding-bottom: 4px;
    }
    .print-content--qa .print-logo { width: 36px; }
    .print-content--qa .print-header-title { font-size: 1.05rem; }
    .faq-page { gap: 3px; }
    .faq-question { font-size: 0.6rem; margin-bottom: 0; }
    .faq-answer { font-size: 0.56rem; line-height: 1.28; }
  }
`;

const CONTENT_STYLES = {
  week: WEEK_CONTENT_STYLES,
  shopping: SHOPPING_CONTENT_STYLES,
  foodlist: FOODLIST_CONTENT_STYLES,
  bestresults: QA_CONTENT_STYLES,
  faq: QA_CONTENT_STYLES,
};

function buildPrintStylesForView(view) {
  const config = PRINT_VIEW_CONFIG[view] || PRINT_VIEW_CONFIG.week;
  const pageRule = `@page { size: ${config.pageSize}; margin: ${config.pageMargin}; }`;
  const contentStyles = CONTENT_STYLES[view] || CONTENT_STYLES.week;
  return `${pageRule}\n${PRINT_SHELL_BASE}\n${contentStyles}`;
}

export {
  buildPrintStylesForView,
};
