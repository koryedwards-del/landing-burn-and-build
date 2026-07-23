import { ASSET_VERSION as FALLBACK_ASSET_VERSION } from '../../js/assetVersion.js';
import { FOR_BEST_RESULTS_PRINT_PAGES } from '../../data/forBestResultsPrintout.js';
import { HANDBOOK_FAQ_PRINT_PAGES } from '../../data/handbookFaqPrintout.js';
import { buildPrintStylesForView } from './plannerPrintStyles.js';
import {
  formatPrintDateTime,
  programClientName,
} from '../../js/programBridgeUi.js';
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
  escapeHtml,
  iterWeekFoodSelections,
  foodAmountLabel,
  buildShoppingTotals,
  persistPlannerToProgram,
  isAssignedMeal,
  mealSlotMeta,
} from './plannerState.js';

function printFoodAmount(foodName, servings) {
  const food = state.foods.find((item) => item.name === foodName);
  if (!food) return `${fmtServings(servings)} servings`;
  return scaledLabel(food, servings);
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

function savedMealFoodLinesForPrint(meal) {
  if (!meal?.items?.length) return [];
  return meal.items.map((item) => ({
    foodName: item.foodName,
    amount: printFoodAmount(item.foodName, item.servings),
  }));
}

function mealFoodLinesForPrint(mealSlotId, weekDay) {
  if (isAssignedMeal(mealSlotId, weekDay)) {
    const meta = mealSlotMeta(mealSlotId, weekDay);
    const meal = state.savedMeals.find((item) => item.id === meta.savedMealId);
    const lines = [];
    if (meta.mealName) {
      lines.push({ foodName: meta.mealName, amount: '', isMealTitle: true });
    }
    if (meal) {
      lines.push(...savedMealFoodLinesForPrint(meal));
    } else {
      lines.push(...categoryFoodLinesForPrint(mealSlotId, weekDay));
    }
    return lines;
  }
  return categoryFoodLinesForPrint(mealSlotId, weekDay);
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

  const name = escapeHtml(programClientName(state.programPackage));

  return `
    <div class="agenda-section">
      <h2 class="agenda-section-title">Weekly Meal Schedule</h2>
      <p class="agenda-section-sub">Burn &amp; Build Diet · Meal schedule for ${name}</p>
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

function buildPrintWatermarkHtml({ repeat = false } = {}) {
  const logoUrl = printLogoUrl();
  const variantClass = repeat
    ? 'assistant-doc-watermark assistant-doc-watermark--repeat'
    : 'assistant-doc-watermark assistant-doc-watermark--page';
  return `
    <div class="${variantClass}" aria-hidden="true">
      <img src="${logoUrl}" alt="" />
    </div>
  `;
}

function buildWeekPlanReportHeaderHtml() {
  const name = escapeHtml(programClientName(state.programPackage));
  const date = escapeHtml(formatPrintDateTime(new Date()));
  const logoUrl = printLogoUrl();
  return `
    <header class="assistant-doc-header assistant-doc-header--report">
      <img class="assistant-logo" src="${logoUrl}" alt="Burn &amp; Build" width="72" height="72" />
      <div class="assistant-doc-titles">
        <p class="assistant-doc-eyebrow">Personalized nutrition plan for</p>
        <h1 class="assistant-doc-name">${name}</h1>
        <p class="assistant-doc-guide">Burn &amp; Build Diet · Week Plan</p>
        <p class="assistant-doc-date">${date}</p>
      </div>
    </header>
  `;
}

function weekPlanHasContent() {
  let found = false;
  iterWeekFoodSelections(() => {
    found = true;
  });
  return found;
}

const PROTEIN_TIPS = [
  'You should eat the protein servings in equal amounts a minimum of three times throughout the day. The Burn & Build Diet food plan suggests a practical way to break down the protein servings. The servings are divided fairly even among breakfast, lunch, and dinner.',
  'The protein group includes meat, fish, poultry, and dairy products. We recommend you eat at least one-third of your daily protein servings from the dairy section. We strongly recommend eating the daily servings to ensure calcium intake.',
  'It is not necessary to use any meat products on this program. If you do not eat meat, you should use egg whites and other dairy products.',
  'Measure your serving size after cooking.',
];

const GRAINS_STARCHES_TIPS = [
  'Your daily grain and starch servings are counted together. The Burn & Build Diet divides them fairly even among breakfast, lunch, and dinner.',
  'Grains include bread, cereal, rice, pasta, and similar foods. Starches include potatoes, corn, peas, beans, and squash.',
  'Choose whole-grain products when possible. Avoid added fats, sugars, and heavy sauces on grain and starch foods.',
  'Measure your serving size after cooking.',
];

const VEGETABLE_TIPS = [
  'Vegetable servings are eaten at dinner on the Burn & Build Diet. Choose a variety of colorful vegetables throughout the week.',
  'Fresh, frozen, and canned vegetables without added fat or sugar all count toward your servings.',
  'Raw or cooked vegetables may be used. One serving of salad greens counts the same as one serving of cooked vegetables.',
  'Measure your serving size after cooking.',
];

const FRUIT_TIPS = [
  'Fruit servings are eaten at snack times on the Burn & Build Diet. Divide your daily fruit servings among your morning, afternoon, and evening snacks.',
  'Fresh, frozen, and canned fruit without added sugar all count toward your servings.',
  'Dried fruit and fruit juice are not included on this food list unless listed separately.',
  'Measure your serving size as indicated on the food list.',
];

function splitFoodsInHalf(foods) {
  const splitAt = Math.ceil(foods.length / 2);
  return [foods.slice(0, splitAt), foods.slice(splitAt)];
}

function foodsByCategory(categoryId) {
  return state.foods
    .filter((food) => food.category === categoryId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function buildFoodListColumn(title, foods, { hideTitle = false } = {}) {
  const titleHtml = title
    ? `<h2 class="food-list-col-title${hideTitle ? ' food-list-col-title--spacer' : ''}"${hideTitle ? ' aria-hidden="true"' : ''}>${escapeHtml(title)}</h2>`
    : '';
  return `
    <div class="food-list-col${hideTitle ? ' food-list-col--continued' : ''}${!foods.length ? ' food-list-col--empty' : ''}">
      ${titleHtml}
      ${foods.length ? `
      <ul class="food-list-items">
        ${foods.map((food) => `
          <li class="food-list-name">${escapeHtml(food.name)}</li>
        `).join('')}
      </ul>
      ` : ''}
    </div>
  `;
}

function buildFoodListTipsColumn(title, tips) {
  return `
    <div class="food-list-col food-list-col--tips">
      <h2 class="food-list-col-title food-list-col-title--tips">${escapeHtml(title)}</h2>
      <div class="food-list-tips">
        ${tips.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
      </div>
    </div>
  `;
}

function buildFoodListRow({
  headerHtml,
  leftTitle,
  leftFoods,
  middleTitle = '',
  middleFoods = [],
  tipsTitle,
  tips,
  hideMiddleTitle = false,
}) {
  return `
    <div class="print-page print-page--sheet food-list-section">
      ${buildPrintWatermarkHtml()}
      ${headerHtml}
      <div class="food-list-columns">
        ${buildFoodListColumn(leftTitle, leftFoods)}
        ${buildFoodListColumn(middleTitle, middleFoods, { hideTitle: hideMiddleTitle })}
        ${buildFoodListTipsColumn(tipsTitle, tips)}
      </div>
    </div>
  `;
}

function buildFoodListContent() {
  const headerHtml = buildAssistantHeaderHtml('Food List', { showMeta: false });
  const [vegetablesLeft, vegetablesRight] = splitFoodsInHalf(foodsByCategory('vegetable'));

  return `
    ${buildFoodListRow({
      headerHtml,
      leftTitle: 'Protein',
      leftFoods: foodsByCategory('protein'),
      middleTitle: 'Dairy',
      middleFoods: foodsByCategory('dairy'),
      tipsTitle: 'Protein Tips',
      tips: PROTEIN_TIPS,
    })}
    ${buildFoodListRow({
      headerHtml,
      leftTitle: 'Grains',
      leftFoods: foodsByCategory('grain'),
      middleTitle: 'Starches',
      middleFoods: foodsByCategory('starch'),
      tipsTitle: 'Grains & Starches Tips',
      tips: GRAINS_STARCHES_TIPS,
    })}
    ${buildFoodListRow({
      headerHtml,
      leftTitle: 'Vegetables',
      leftFoods: vegetablesLeft,
      middleTitle: 'Vegetables',
      middleFoods: vegetablesRight,
      hideMiddleTitle: true,
      tipsTitle: 'Vegetable Tips',
      tips: VEGETABLE_TIPS,
    })}
    ${buildFoodListRow({
      headerHtml,
      leftTitle: 'Fruit',
      leftFoods: foodsByCategory('fruit'),
      tipsTitle: 'Fruit Tips',
      tips: FRUIT_TIPS,
    })}
  `;
}

function buildQaPrintContent(title, pages) {
  const headerHtml = buildAssistantHeaderHtml(title, { showMeta: false });
  return pages.map((page, index) => `
    <section class="faq-page print-page print-page--sheet${index > 0 ? ' faq-page--break' : ''}">
      ${buildPrintWatermarkHtml()}
      ${headerHtml}
      ${page.items.map((item) => `
        <article class="faq-item">
          <h2 class="faq-question">${escapeHtml(item.q)}</h2>
          <p class="faq-answer">${escapeHtml(item.a)}</p>
        </article>
      `).join('')}
    </section>
  `).join('');
}

function buildForBestResultsContent() {
  return buildQaPrintContent('For Best Results', FOR_BEST_RESULTS_PRINT_PAGES);
}

function buildHandbookFaqContent() {
  return buildQaPrintContent('Frequently Asked Questions', HANDBOOK_FAQ_PRINT_PAGES);
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

function buildAssistantHeaderHtml(title, { showMeta = true } = {}) {
  const name = escapeHtml(programClientName(state.programPackage));
  const date = escapeHtml(formatPrintDateTime(new Date()));
  const logoUrl = printLogoUrl();
  return `
    <header class="assistant-doc-header">
      <img class="assistant-logo" src="${logoUrl}" alt="Burn &amp; Build" width="72" height="72" />
      <div class="assistant-doc-titles">
        <p class="assistant-doc-brand">Burn &amp; Build Diet</p>
        <h1 class="assistant-doc-title">${escapeHtml(title)}</h1>
        ${showMeta ? `<p class="assistant-doc-meta">Prepared for ${name} · ${date}</p>` : ''}
      </div>
    </header>
  `;
}

function printDocumentTitle(view) {
  const name = programClientName(state.programPackage);
  const docName = view === 'shopping'
    ? 'Grocery List'
    : view === 'foodlist'
      ? 'Food List'
      : view === 'bestresults'
        ? 'For Best Results'
        : view === 'faq'
          ? 'Frequently Asked Questions'
          : 'Weekly';
  return `B&B- ${docName} - ${name}`;
}

function buildPrintDocumentHtml(view = 'week') {
  const shoppingHtml = buildShoppingListContent();
  const weekHtml = buildWeekAgendaContent();
  const foodListHtml = buildFoodListContent();
  const forBestResultsHtml = buildForBestResultsContent();
  const handbookFaqHtml = buildHandbookFaqContent();
  const weekHeaderHtml = buildWeekPlanReportHeaderHtml();
  const shoppingHeaderHtml = buildAssistantHeaderHtml('Shopping List');
  const weekFooterHtml = `
    <footer class="assistant-doc-footer">
      <span>Burn &amp; Build Diet</span>
      <span>Week Plan · ${escapeHtml(programClientName(state.programPackage))}</span>
    </footer>
  `;
  const documentContent = view === 'shopping'
    ? `
      <section class="assistant-panel print-page print-page--sheet">
        ${buildPrintWatermarkHtml()}
        ${shoppingHeaderHtml}
        ${shoppingHtml}
      </section>
    `
    : view === 'foodlist'
      ? `
      <section class="assistant-panel">
        ${foodListHtml}
      </section>
    `
      : view === 'bestresults'
        ? `
      <section class="assistant-panel">
        ${forBestResultsHtml}
      </section>
    `
      : view === 'faq'
        ? `
      <section class="assistant-panel">
        ${handbookFaqHtml}
      </section>
    `
      : `
      <section class="assistant-panel print-page print-page--flow">
        ${buildPrintWatermarkHtml({ repeat: true })}
        ${weekHeaderHtml}
        ${weekHtml}
        ${weekFooterHtml}
      </section>
    `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(printDocumentTitle(view))}</title>
  <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>${buildPrintStylesForView(view)}</style>
</head>
<body>
  <article class="assistant-document">
    ${documentContent}
  </article>
</body>
</html>`;
}

let printFrame = null;

function triggerFramePrint(frameWin, frameDoc) {
  frameWin.focus();
  try {
    if (frameDoc.execCommand && frameDoc.execCommand('print', false, null)) return;
  } catch (_) {
    /* fall through to window.print */
  }
  frameWin.print();
}

function printPlannerDocument(view) {
  persistPlannerToProgram({ immediate: true });

  // Fresh iframe each print — Safari reuses stale frames and adds a second
  // "This webpage is trying to print" confirmation on repeat attempts.
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
  frameDoc.write(buildPrintDocumentHtml(view));
  frameDoc.close();

  // Must run in the same turn as the button click. Deferred print() loses the
  // user gesture and iOS Safari shows an extra "trying to print" prompt.
  triggerFramePrint(frameWin, frameDoc);
}

function showPlannerToast(message, { variant = 'info', durationMs = 6000 } = {}) {
  const host = document.getElementById('planner-toast-host');
  if (!host) return;

  host.innerHTML = '';

  const toast = document.createElement('p');
  toast.className = `planner-toast planner-toast--${variant}`;
  toast.textContent = message;
  host.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));

  window.setTimeout(() => {
    toast.classList.remove('is-visible');
    window.setTimeout(() => toast.remove(), 320);
  }, durationMs);
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
  document.getElementById('print-shop-open')?.addEventListener('click', openPrintShop);
  initPrintChoiceDialog();
}

export {
  printPlannerDocument,
  initPrintChoiceDialog,
  openPrintShop,
  initPrintShop,
};
