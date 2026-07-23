import { ASSET_VERSION as FALLBACK_ASSET_VERSION } from '../../js/assetVersion.js';
import { FOR_BEST_RESULTS_PRINT_PAGES } from '../../data/forBestResultsPrintout.js';
import { HANDBOOK_FAQ_PRINT_PAGES } from '../../data/handbookFaqPrintout.js';
import { buildPrintStylesForView } from './plannerPrintStyles.js';
import {
  PRINT_VIEW_CONFIG,
  printDocumentTitle,
  buildPrintHeaderHtml,
  buildPrintPageShell,
  buildPrintDocumentHtml as buildPrintShellDocumentHtml,
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

function buildViewHeaderHtml(view) {
  const config = PRINT_VIEW_CONFIG[view] || PRINT_VIEW_CONFIG.week;
  return buildPrintHeaderHtml(config.headerVariant, config.headerTitle, printShellContext());
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
  return buildPrintPageShell({
    headerHtml,
    bodyHtml: `
      <div class="food-list-columns">
        ${buildFoodListColumn(leftTitle, leftFoods)}
        ${buildFoodListColumn(middleTitle, middleFoods, { hideTitle: hideMiddleTitle })}
        ${buildFoodListTipsColumn(tipsTitle, tips)}
      </div>
    `,
    sheet: true,
    sectionClass: 'food-list-section',
  });
}

function buildFoodListContent() {
  const headerHtml = buildPrintHeaderHtml('generic', 'Food List', printShellContext());
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

function buildQaPrintContent(title, pages, { numbered = false } = {}) {
  const headerHtml = buildPrintHeaderHtml('generic', title, printShellContext());
  let questionNumber = 0;
  return pages.map((page, index) => {
    const bodyHtml = `
      <div class="faq-page">
        ${page.items.map((item) => {
          questionNumber += 1;
          const questionPrefix = numbered
            ? `<span class="faq-question-num">${questionNumber}.</span> `
            : '';
          return `
            <article class="faq-item">
              <h2 class="faq-question">${questionPrefix}${escapeHtml(item.q)}</h2>
              <p class="faq-answer">${escapeHtml(item.a)}</p>
            </article>
          `;
        }).join('')}
      </div>
    `;
    return buildPrintPageShell({
      headerHtml,
      bodyHtml,
      breakBefore: index > 0,
      sheet: true,
    });
  }).join('');
}

function buildForBestResultsContent() {
  return buildQaPrintContent('For Best Results', FOR_BEST_RESULTS_PRINT_PAGES);
}

function buildHandbookFaqContent() {
  return buildQaPrintContent('Frequently Asked Questions', HANDBOOK_FAQ_PRINT_PAGES, { numbered: true });
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

function buildPrintDocumentHtml(view = 'week') {
  const title = printDocumentTitle(view, state.programPackage);
  const logoUrl = printLogoUrl();
  const styles = buildPrintStylesForView(view);
  const headerHtml = buildViewHeaderHtml(view);

  let bodyHtml = '';
  if (view === 'shopping') {
    bodyHtml = buildPrintPageShell({
      headerHtml,
      bodyHtml: buildShoppingListContent(),
      sheet: true,
    });
  } else if (view === 'foodlist') {
    bodyHtml = buildFoodListContent();
  } else if (view === 'bestresults') {
    bodyHtml = buildForBestResultsContent();
  } else if (view === 'faq') {
    bodyHtml = buildHandbookFaqContent();
  } else {
    bodyHtml = buildPrintPageShell({
      headerHtml,
      bodyHtml: buildWeekAgendaContent(),
    });
  }

  return buildPrintShellDocumentHtml({
    view,
    title,
    logoUrl,
    styles,
    bodyHtml,
  });
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
