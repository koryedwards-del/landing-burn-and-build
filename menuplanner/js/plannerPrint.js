import { ASSET_VERSION as FALLBACK_ASSET_VERSION } from '../../js/assetVersion.js';
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

function printLogoUrl() {
  const url = new URL('/img/brand/bblogo1.png', window.location.origin);
  url.searchParams.set('v', ASSET_VERSION);
  return escapeHtml(url.href);
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

function foodsByCategory(categoryId) {
  return state.foods
    .filter((food) => food.category === categoryId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function buildFoodListColumn(title, foods) {
  return `
    <div class="food-list-col">
      <h2 class="food-list-col-title">${escapeHtml(title)}</h2>
      <ul class="food-list-items">
        ${foods.map((food) => `
          <li>
            <span class="food-list-name">${escapeHtml(food.name)}</span>
            <span class="food-list-serving">${escapeHtml(scaledLabel(food, 1))}</span>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

function buildProteinTipsColumn() {
  const logoUrl = printLogoUrl();
  return `
    <div class="food-list-col food-list-col--tips">
      <div class="food-list-watermark" aria-hidden="true">
        <img src="${logoUrl}" alt="" />
      </div>
      <h2 class="food-list-col-title food-list-col-title--tips">Protein Tips</h2>
      <div class="food-list-tips">
        ${PROTEIN_TIPS.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
      </div>
    </div>
  `;
}

function buildFoodListContent() {
  const proteinFoods = foodsByCategory('protein');
  const dairyFoods = foodsByCategory('dairy');

  return `
    <div class="food-list-columns">
      ${buildFoodListColumn('Protein', proteinFoods)}
      ${buildFoodListColumn('Dairy', dairyFoods)}
      ${buildProteinTipsColumn()}
    </div>
  `;
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

function buildAssistantHeaderHtml(title) {
  const name = escapeHtml(programClientName(state.programPackage));
  const date = escapeHtml(formatPrintDateTime(new Date()));
  const logoUrl = printLogoUrl();
  return `
    <header class="assistant-doc-header">
      <img class="assistant-logo" src="${logoUrl}" alt="Burn &amp; Build" width="72" height="72" />
      <div class="assistant-doc-titles">
        <p class="assistant-doc-brand">Burn &amp; Build Diet</p>
        <h1 class="assistant-doc-title">${escapeHtml(title)}</h1>
        <p class="assistant-doc-meta">Prepared for ${name} · ${date}</p>
      </div>
    </header>
  `;
}

function printDocumentTitle(view) {
  const name = programClientName(state.programPackage);
  if (view === 'shopping') {
    return `Burn & Build — Grocery List — ${name}`;
  }
  if (view === 'foodlist') {
    return `Burn & Build — Food List — ${name}`;
  }
  return `Burn & Build — Weekly — ${name}`;
}

function buildPrintDocumentHtml(view = 'week') {
  const shoppingHtml = buildShoppingListContent();
  const weekHtml = buildWeekAgendaContent();
  const foodListHtml = buildFoodListContent();
  const weekHeaderHtml = buildWeekPlanReportHeaderHtml();
  const shoppingHeaderHtml = buildAssistantHeaderHtml('Shopping List');
  const foodListHeaderHtml = buildAssistantHeaderHtml('Food List');
  const weekFooterHtml = `
    <footer class="assistant-doc-footer">
      <span>Burn &amp; Build Diet</span>
      <span>Week Plan · ${escapeHtml(programClientName(state.programPackage))}</span>
    </footer>
  `;
  const bodyClass = view === 'shopping'
    ? 'view-shopping'
    : view === 'foodlist'
      ? 'view-foodlist'
      : 'view-week';
  const documentContent = view === 'shopping'
    ? `
      <section class="assistant-panel">
        ${shoppingHeaderHtml}
        ${shoppingHtml}
      </section>
    `
    : view === 'foodlist'
      ? `
      <section class="assistant-panel">
        ${foodListHeaderHtml}
        ${foodListHtml}
      </section>
    `
      : `
      <section class="assistant-panel">
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
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page portrait-page { size: portrait; margin: 0.5in; }
    @page landscape-page { size: landscape; margin: 0.35in; }
    @page foodlist-page { size: landscape; margin: 0.25in; }
    body {
      font-family: "Open Sans", system-ui, sans-serif;
      background: #ececec;
      color: #111111;
      margin: 0;
    }
    body.view-shopping {
      page: portrait-page;
    }
    body.view-week {
      page: landscape-page;
    }
    body.view-foodlist {
      page: foodlist-page;
    }
    .assistant-document {
      background: #ffffff;
      color: #111111;
      margin: 0 auto;
      padding: 36px 44px 52px;
    }
    body.view-shopping .assistant-document {
      max-width: 540px;
    }
    body.view-week .assistant-document {
      max-width: none;
    }
    body.view-foodlist .assistant-document {
      max-width: none;
      padding: 18px 24px 16px;
    }
    body.view-foodlist .assistant-doc-header {
      margin-bottom: 10px;
      padding-bottom: 8px;
      gap: 14px;
    }
    body.view-foodlist .assistant-logo {
      width: 48px;
    }
    body.view-foodlist .assistant-doc-brand {
      font-size: 0.58rem;
      margin-bottom: 2px;
    }
    body.view-foodlist .assistant-doc-title {
      font-size: 1.35rem;
      margin-bottom: 2px;
    }
    body.view-foodlist .assistant-doc-meta {
      font-size: 0.68rem;
    }
    .assistant-doc-header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 28px;
      padding-bottom: 22px;
      border-bottom: 1px solid #e8e8e8;
    }
    .assistant-doc-header--report {
      align-items: flex-start;
      margin-bottom: 24px;
    }
    .assistant-logo {
      display: block;
      width: 72px;
      height: auto;
      flex-shrink: 0;
    }
    .assistant-doc-titles {
      text-align: left;
    }
    .assistant-doc-eyebrow {
      font-family: Oswald, system-ui, sans-serif;
      font-size: 0.62rem;
      font-weight: 600;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      color: #888;
      margin-bottom: 6px;
    }
    .assistant-doc-name {
      font-family: Oswald, system-ui, sans-serif;
      font-size: 2.15rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      color: #111;
      line-height: 1.05;
      margin-bottom: 8px;
    }
    .assistant-doc-guide {
      font-family: Oswald, system-ui, sans-serif;
      font-size: 0.82rem;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #444;
      margin-bottom: 4px;
    }
    .assistant-doc-date {
      font-size: 0.8rem;
      color: #666;
    }
    .assistant-doc-brand {
      font-family: Oswald, system-ui, sans-serif;
      font-size: 0.68rem;
      font-weight: 600;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: #888;
      margin-bottom: 4px;
    }
    .assistant-doc-title {
      font-family: Oswald, system-ui, sans-serif;
      font-size: 2rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #111;
      line-height: 1.05;
      margin-bottom: 8px;
    }
    .assistant-doc-meta {
      font-size: 0.82rem;
      color: #666;
      letter-spacing: 0.01em;
    }
    .assistant-doc-footer {
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
    .assistant-empty { color: #666; font-size: 0.9rem; }
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
    .agenda-food {
      font-weight: 400;
      color: #222;
    }
    .agenda-meal-title .agenda-food {
      font-weight: 700;
      color: #111;
    }
    .agenda-amount {
      font-weight: 700;
      font-size: 0.62rem;
      color: #111;
      text-align: right;
      flex-shrink: 0;
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
    .food-list-col:first-child {
      border-left: none;
      padding-left: 0;
    }
    .food-list-col:last-child {
      padding-right: 0;
    }
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
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 6px;
      font-size: 0.56rem;
      line-height: 1.2;
      padding: 1px 0;
      border-bottom: 1px solid #eee;
    }
    .food-list-name {
      flex: 1;
      min-width: 0;
    }
    .food-list-serving {
      flex-shrink: 0;
      font-weight: 600;
      color: #333;
      text-align: right;
    }
    .food-list-col--tips {
      min-height: 100%;
    }
    .food-list-watermark {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      overflow: hidden;
    }
    .food-list-watermark img {
      width: 180px;
      height: auto;
      opacity: 0.06;
    }
    .food-list-tips {
      position: relative;
      z-index: 1;
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
      body { background: #fff; }
      .assistant-document {
        padding: 0;
        margin: 0;
        max-width: none;
      }
      .assistant-doc-header {
        margin-bottom: 20px;
        padding-bottom: 16px;
      }
      .assistant-logo {
        width: 64px;
      }
      .assistant-doc-name {
        font-size: 1.85rem;
      }
      body.view-foodlist .assistant-doc-header {
        margin-bottom: 8px;
        padding-bottom: 6px;
      }
      body.view-foodlist .assistant-logo {
        width: 44px;
      }
      .food-list-col-title {
        margin-bottom: 6px;
      }
      .agenda-row-head,
      .agenda-cell {
        padding-top: 22px;
        padding-bottom: 22px;
      }
    }
  </style>
</head>
<body class="${bodyClass}">
  <article class="assistant-document">
    ${documentContent}
  </article>
</body>
</html>`;
}

let printFrame = null;

function printPlannerDocument(view) {
  persistPlannerToProgram({ immediate: true });

  if (!printFrame) {
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
  }

  const frameWin = printFrame.contentWindow;
  const frameDoc = frameWin.document;
  frameDoc.open();
  frameDoc.write(buildPrintDocumentHtml(view));
  frameDoc.close();

  const triggerPrint = () => {
    frameWin.focus();
    frameWin.print();
  };

  const waitForImages = () => {
    const images = Array.from(frameDoc.images || []);
    if (!images.length) {
      triggerPrint();
      return;
    }
    let pending = images.length;
    const done = () => {
      pending -= 1;
      if (pending <= 0) triggerPrint();
    };
    images.forEach((img) => {
      if (img.complete) done();
      else {
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      }
    });
  };

  frameWin.requestAnimationFrame(() => {
    window.setTimeout(waitForImages, 100);
  });
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
  document.getElementById('print-shop-open')?.addEventListener('click', openPrintShop);
  initPrintChoiceDialog();
}

export {
  printPlannerDocument,
  initPrintChoiceDialog,
  openPrintShop,
  initPrintShop,
};
