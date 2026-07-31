import { ASSET_VERSION as FALLBACK_ASSET_VERSION } from '../../js/assetVersion.js';
import { apiUrl } from '../../js/apiConfig.js';
import { buildPrintStylesForView } from './plannerPrintStyles.js';
import {
  buildPrintDocumentHtml as buildPrintShellDocumentHtml,
  printDocumentTitle,
  buildPrintViewHeaderHtml,
  buildPrintPageShell,
} from './plannerPrintShell.js';
import { programClientName } from '../../js/programBridgeUi.js';
import {
  FOOD_CATEGORIES,
  SLOT_META,
  DAY_SLOTS,
  WEEK_DAYS,
  state,
  categorySelections,
  templateSlots,
  isFatSlot,
  isSplitServingsMakerSlot,
  getFatSelections,
  getSplitGridSelections,
  fmtServings,
  scaledLabel,
  gramWeightLabel,
  escapeHtml,
  iterWeekFoodSelections,
  foodAmountLabel,
  buildShoppingTotals,
  persistPlannerToProgram,
  isAssignedMeal,
  mealSlotMeta,
} from './plannerState.js';

/** Views rendered as real PDFs on Render — grows as each doc is converted. */
const PDF_PRINT_VIEWS = new Set(['faq', 'foodlist', 'bestresults']);

/** In-memory blob cache for static PDFs — avoids repeat network + parse on reopen. */
const pdfBlobCache = new Map();

const PDF_BLOB_CACHE_KEYS = {
  faq: 'faq',
  foodlist: 'foodlist',
  bestresults: 'bestresults:v3',
};

function pdfBlobCacheKey(view) {
  return PDF_BLOB_CACHE_KEYS[view] || view;
}

function isPdfBlob(blob) {
  if (!blob || blob.size < 5) return false;
  return blob.type === 'application/pdf' || blob.type === '';
}

async function readPdfHeader(blob) {
  const header = await blob.slice(0, 5).text();
  return header.startsWith('%PDF-');
}

function printPdfBlobUrl(url) {
  const printWin = window.open(url, '_blank');
  if (!printWin) return false;

  const runPrint = () => {
    try {
      printWin.focus();
      printWin.print();
    } catch (_) {
      /* popup may block print until user focuses */
    }
  };

  printWin.addEventListener('load', runPrint);
  setTimeout(runPrint, 600);
  return true;
}

const PDF_VIEW_TITLES = {
  faq: 'Frequently Asked Questions',
  foodlist: 'Food List',
  bestresults: 'For Best Results',
  week: 'Weekly Meal Plan',
  shopping: 'Grocery List',
};

function pdfFilenameFromTitle(title, view) {
  const base = String(title || PDF_VIEW_TITLES[view] || view)
    .replace(/[^\w\s.-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return `${base || `burn-and-build-${view}`}.pdf`;
}

function printFoodAmount(foodName, servings) {
  const food = state.foods.find((item) => item.name === foodName);
  if (!food) return `${fmtServings(servings)} servings`;
  return gramWeightLabel(food, servings);
}

function mealSlotPrintParts(mealSlotId) {
  const schedule = state.mealSlotsById[mealSlotId];
  const daySlot = DAY_SLOTS.find((item) => item.id === mealSlotId);
  return {
    time: schedule?.time || '',
    label: daySlot?.label || mealSlotId,
  };
}

function categoryFoodLinesForPrint(mealSlotId, weekDay) {
  const daySlot = DAY_SLOTS.find((item) => item.id === mealSlotId);
  if (!daySlot) return [];
  const lines = [];
  templateSlots(daySlot.template).forEach((categorySlot) => {
    if (isFatSlot(categorySlot)) {
      getFatSelections(mealSlotId, weekDay).forEach((item) => {
        lines.push({
          foodName: item.foodName,
          amount: printFoodAmount(item.foodName, item.servings),
        });
      });
      return;
    }
    if (isSplitServingsMakerSlot(categorySlot)) {
      getSplitGridSelections(mealSlotId, categorySlot, weekDay).forEach((item) => {
        lines.push({
          foodName: item.foodName,
          amount: printFoodAmount(item.foodName, item.servings),
        });
      });
      return;
    }
    const selected = categorySelections(mealSlotId, weekDay)[categorySlot];
    if (selected) {
      lines.push({
        foodName: selected.foodName,
        amount: printFoodAmount(selected.foodName, selected.servings),
      });
    }
  });
  return lines;
}

function mealFoodLinesForPrint(mealSlotId, weekDay) {
  const lines = [];
  if (isAssignedMeal(mealSlotId, weekDay)) {
    const meta = mealSlotMeta(mealSlotId, weekDay);
    if (meta.mealName) {
      lines.push({ foodName: meta.mealName, amount: '', isMealTitle: true });
    }
  }
  lines.push(...categoryFoodLinesForPrint(mealSlotId, weekDay));
  return lines;
}

function renderAgendaCell(foodLines) {
  if (!foodLines.length) {
    return '<span class="agenda-cell-empty" aria-hidden="true">—</span>';
  }
  return `
    <ul class="agenda-foods">
      ${foodLines.map((line) => `
        <li${line.isMealTitle ? ' class="agenda-meal-title"' : ''}>
          <span class="agenda-food">${escapeHtml(line.foodName)}</span>
          ${line.amount ? `<span class="agenda-amount">${escapeHtml(line.amount)}</span>` : ''}
        </li>
      `).join('')}
    </ul>
  `;
}

function mealSlotHasAnyContent(mealSlotId) {
  return WEEK_DAYS.some((day) => mealFoodLinesForPrint(mealSlotId, day.id).length > 0);
}

function buildWeekAgendaContent() {
  if (!weekPlanHasContent()) {
    return '<p class="assistant-empty">No meals planned for this week yet. Fill in your menu planner, then open Print Shop again.</p>';
  }

  return `
    <div class="agenda-section">
      <table class="agenda-table">
        <thead>
          <tr>
            <th class="agenda-table-corner" scope="col"><span class="visually-hidden">Meal</span></th>
            ${WEEK_DAYS.map((day) => `
              <th class="agenda-day-head" scope="col">${escapeHtml(day.label)}</th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          ${DAY_SLOTS.map((mealSlot) => {
            if (!mealSlotHasAnyContent(mealSlot.id)) return '';
            const { time, label } = mealSlotPrintParts(mealSlot.id);
            return `
              <tr class="agenda-row">
                <th class="agenda-row-head" scope="row">
                  ${time ? `<span class="agenda-time">${escapeHtml(time)}</span>` : ''}
                  <span class="agenda-meal-label">${escapeHtml(label)}</span>
                </th>
                ${WEEK_DAYS.map((day) => `
                  <td class="agenda-cell">
                    ${renderAgendaCell(mealFoodLinesForPrint(mealSlot.id, day.id))}
                  </td>
                `).join('')}
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

const ASSET_VERSION = new URL(import.meta.url).searchParams.get('v') || FALLBACK_ASSET_VERSION;

function printLogoHref() {
  const url = new URL('/img/brand/bblogo1.png', window.location.origin);
  url.searchParams.set('v', ASSET_VERSION);
  return url.href;
}

function printLogoUrl() {
  return escapeHtml(printLogoHref());
}

function preloadPrintAssets() {
  const img = new Image();
  img.src = printLogoHref();
}

function printShellContext() {
  return {
    logoUrl: printLogoUrl(),
    programPackage: state.programPackage,
  };
}

function weekPlanHasContent() {
  let found = false;
  iterWeekFoodSelections(() => {
    found = true;
  });
  return found;
}

function buildShoppingListContent() {
  const totals = buildShoppingTotals();
  const categoryOrder = FOOD_CATEGORIES.map((cat) => cat.id);
  const categoryLabels = Object.fromEntries(FOOD_CATEGORIES.map((cat) => [cat.id, cat.label]));

  const shoppingRows = [];
  categoryOrder.forEach((categoryId) => {
    const rows = [];
    totals.forEach((servings, foodName) => {
      const food = state.foods.find((item) => item.name === foodName);
      if ((food?.category || 'other') !== categoryId) return;
      rows.push({ foodName, amount: foodAmountLabel(food, servings) });
    });
    rows.sort((a, b) => a.foodName.localeCompare(b.foodName));
    if (rows.length) {
      shoppingRows.push({ category: categoryLabels[categoryId], rows });
    }
  });

  if (!shoppingRows.length) {
    return '<p class="assistant-empty">No ingredients in this week\'s plan yet.</p>';
  }

  return shoppingRows.map((group) => `
    <section class="assistant-section">
      <h2>${escapeHtml(group.category)}</h2>
      <ul class="assistant-list">
        ${group.rows.map((row) => `
          <li>
            <label class="assistant-row">
              <input type="checkbox" class="assistant-check" />
              <span class="assistant-food">${escapeHtml(row.foodName)}</span>
            </label>
            <span class="assistant-amount">${escapeHtml(row.amount)}</span>
          </li>
        `).join('')}
      </ul>
    </section>
  `).join('');
}

const PRINT_BODY_BUILDERS = {
  week: buildWeekAgendaContent,
  shopping: buildShoppingListContent,
};

function buildPrintDocumentHtml(view = 'week') {
  const title = printDocumentTitle(view, state.programPackage);
  const styles = buildPrintStylesForView(view);
  const buildBody = PRINT_BODY_BUILDERS[view] || PRINT_BODY_BUILDERS.week;

  const bodyHtml = buildPrintPageShell({
    headerHtml: buildPrintViewHeaderHtml(view, printShellContext()),
    bodyHtml: buildBody(),
  });

  return buildPrintShellDocumentHtml({
    view,
    title,
    logoHref: printLogoHref(),
    styles,
    bodyHtml,
  });
}

let printFrame = null;

function triggerDocumentPrint(targetWin, targetDoc) {
  targetWin.focus();
  try {
    if (targetDoc.execCommand && targetDoc.execCommand('print', false, null)) return;
  } catch (_) {
    /* fall through to window.print */
  }
  targetWin.print();
}

function printViaIframe(html) {
  printFrame?.remove();
  printFrame = document.createElement('iframe');
  printFrame.setAttribute('aria-hidden', 'true');
  printFrame.title = 'Print';
  Object.assign(printFrame.style, {
    position: 'fixed',
    width: '0',
    height: '0',
    border: '0',
    visibility: 'hidden',
  });
  document.body.appendChild(printFrame);

  const frameWin = printFrame.contentWindow;
  const frameDoc = frameWin.document;
  frameDoc.open();
  frameDoc.write(html);
  frameDoc.close();
  triggerDocumentPrint(frameWin, frameDoc);
}

async function openPdfDocument(view) {
  const dialog = document.getElementById('pdf-view-dialog');
  const titleEl = document.getElementById('pdf-view-title');
  const frame = document.getElementById('pdf-view-frame');
  const printBtn = document.getElementById('pdf-view-print');
  const closeBtn = document.getElementById('pdf-view-close');
  const errorEl = document.getElementById('pdf-view-error');

  if (!dialog || !frame || !printBtn) {
    const viewerUrl = new URL('../../program-report/pdf-view.html', import.meta.url);
    viewerUrl.searchParams.set('view', view);
    window.open(viewerUrl.href, '_blank');
    return;
  }

  if (titleEl) {
    titleEl.textContent = PDF_VIEW_TITLES[view] || 'Document';
  }

  const docTitle = printDocumentTitle(view, state.programPackage);
  dialog.dataset.priorPageTitle = document.title;
  document.title = docTitle;
  frame.title = docTitle;

  printBtn.disabled = true;
  errorEl.hidden = true;
  errorEl.textContent = '';
  frame.removeAttribute('src');
  delete frame.dataset.pdfBlobUrl;

  dialog.showModal();

  function showPdfBlob(blob) {
    const pdfBlobUrl = URL.createObjectURL(blob);
    frame.dataset.pdfBlobUrl = pdfBlobUrl;
    frame.dataset.filename = pdfFilenameFromTitle(docTitle, view);
    frame.src = `${pdfBlobUrl}#toolbar=0&navpanes=0`;
    printBtn.disabled = false;
  }

  const cacheKey = pdfBlobCacheKey(view);
  const cachedBlob = pdfBlobCache.get(cacheKey);
  if (cachedBlob) {
    showPdfBlob(cachedBlob);
    return;
  }

  try {
    const res = await fetch(apiUrl(
      `/api/print/pdf?view=${encodeURIComponent(view)}&title=${encodeURIComponent(docTitle)}`,
    ));
    if (!res.ok) {
      let message = 'Could not generate PDF.';
      try {
        const body = await res.json();
        if (body?.message) message = body.message;
      } catch (_) {
        /* ignore */
      }
      errorEl.textContent = message;
      errorEl.hidden = false;
      return;
    }

    const blob = await res.blob();
    if (!isPdfBlob(blob) || !(await readPdfHeader(blob))) {
      errorEl.textContent = 'Could not load PDF.';
      errorEl.hidden = false;
      return;
    }

    pdfBlobCache.set(cacheKey, blob);
    showPdfBlob(blob);
  } catch (err) {
    errorEl.textContent = err.message || 'Could not load PDF.';
    errorEl.hidden = false;
  }
}

function initPdfViewDialog() {
  const dialog = document.getElementById('pdf-view-dialog');
  const frame = document.getElementById('pdf-view-frame');
  const printBtn = document.getElementById('pdf-view-print');
  const closeBtn = document.getElementById('pdf-view-close');
  if (!dialog || !frame || !printBtn) return;

  printBtn.addEventListener('click', () => {
    const pdfBlobUrl = frame.dataset.pdfBlobUrl;
    if (pdfBlobUrl && printPdfBlobUrl(pdfBlobUrl)) return;

    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } catch (_) {
      /* keep viewer open */
    }
  });

  closeBtn?.addEventListener('click', () => dialog.close());

  dialog.addEventListener('close', () => {
    const pdfBlobUrl = frame.dataset.pdfBlobUrl;
    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    delete frame.dataset.pdfBlobUrl;
    delete frame.dataset.filename;
    frame.removeAttribute('src');
    printBtn.disabled = true;
    if (dialog.dataset.priorPageTitle) {
      document.title = dialog.dataset.priorPageTitle;
      delete dialog.dataset.priorPageTitle;
    }
  });
}

function printPlannerDocument(view) {
  persistPlannerToProgram({ immediate: true });

  if (PDF_PRINT_VIEWS.has(view)) {
    openPdfDocument(view);
    return;
  }

  printViaIframe(buildPrintDocumentHtml(view));
}

function initPrintChoiceDialog() {
  const dialog = document.getElementById('print-choice-dialog');
  if (!dialog) return;

  dialog.querySelector('#print-choice-cancel')?.addEventListener('click', () => {
    dialog.close();
  });

  dialog.querySelectorAll('[data-print-view]').forEach((button) => {
    button.addEventListener('click', () => {
      printPlannerDocument(button.dataset.printView);
      dialog.close();
    });
  });
}

function openPrintShop() {
  const dialog = document.getElementById('print-choice-dialog');
  if (dialog) {
    dialog.showModal();
    return;
  }
  printPlannerDocument('week');
}

function initPrintShop() {
  preloadPrintAssets();
  initPdfViewDialog();
  document.getElementById('print-shop-open')?.addEventListener('click', openPrintShop);
  initPrintChoiceDialog();
}

export {
  printPlannerDocument,
  initPrintChoiceDialog,
  openPrintShop,
  initPrintShop,
};
