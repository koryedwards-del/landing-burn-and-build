/** KWarner locked preview — Welcome page HTML (PDF page 1). */

import { escapeHtml, formatProgramDateOrdinal, programClientName } from './programBridgeUi.js';
import { KWARNER_WELCOME_COPY } from './kwarnerLockedCopy.js';

const KWARNER_WELCOME_SECTIONS = [
  ['Lean Body Analysis', 'leanBodyAnalysis'],
  ['Food Plan', 'foodPlan'],
  ['Servings', 'servings'],
  ['Food List', 'foodList'],
  ['What to Print', 'whatToPrint'],
  ['Frequently Asked Questions', 'faq'],
];

export function kwarnerWelcomePrintHtml(pkg) {
  const copy = KWARNER_WELCOME_COPY;
  const name = String(programClientName(pkg) || 'You').trim();
  const date = formatProgramDateOrdinal(
    pkg?.program?.issuedAt || pkg?.program?.foodPlanCreatedDate,
  );
  const introHtml = copy.intro.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('');
  const sectionsHtml = KWARNER_WELCOME_SECTIONS
    .filter(([, key]) => copy[key])
    .map(([title, key]) => `
      <section class="print-welcome__section">
        <h2 class="print-welcome__section-title">${escapeHtml(title)}</h2>
        <p class="print-welcome__section-body">${escapeHtml(copy[key])}</p>
      </section>
    `).join('');

  return `
    <article class="print-template print-template--welcome r-doc">
      <header class="print-template__frame-header">
        <img class="print-template__logo" src="../img/brand/bblogo1.png" alt="" width="68" height="68" />
        <div class="print-template__personalization-row">
          <span>Personalized exclusively for: ${escapeHtml(name)}</span>
          <span>On: ${escapeHtml(date)}</span>
        </div>
      </header>
      <hr class="print-template__gold-rule" />
      <h1 class="print-template__page-title">Welcome</h1>
      <div class="print-welcome__intro">${introHtml}</div>
      ${sectionsHtml}
      <footer class="print-template__footer">
        253-988-6946 · www.burnandbuilddiet.com · support@burnandbuilddiet.com
        <span class="print-template__footer-page">Page 1 of 12</span>
      </footer>
    </article>
  `;
}
