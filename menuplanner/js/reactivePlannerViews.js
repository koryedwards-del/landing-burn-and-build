/**
 * Reactive menu planner UI — B/L/D/S grid, lane swap, slide-over grocery.
 */

import { foodListLabel } from '../../js/foodDisplay.js';
import {
  FOOD_CATEGORIES,
  WEEK_DAYS,
  buildShoppingTotals,
  escapeHtml,
  fmtServings,
  persistPlannerToProgram,
  state,
} from './plannerState.js';
import {
  REACTIVE_MEAL_SLOTS,
  dayFruitSummaryLabel,
  generateReactiveWeek,
  getMealLaneFood,
  mealLaneHasServings,
  shortFoodName,
  swapDayFruit,
  swapMealLane,
} from './mealPlanGenerator.js';

const MEAL_SLOT_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

let groceryOpen = false;

function showToast(message, { variant = 'info', durationMs = 5000 } = {}) {
  let root = document.getElementById('planner-toast-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'planner-toast-root';
    root.className = 'planner-toast-root';
    document.body.appendChild(root);
  }
  const el = document.createElement('div');
  el.className = `planner-toast planner-toast--${variant}`;
  el.textContent = message;
  root.appendChild(el);
  window.setTimeout(() => el.remove(), durationMs);
}

function groceryCategoryId(foodName) {
  const food = state.foods.find((item) => item.name === foodName);
  return food?.category || 'other';
}

function groceryCategoryLabel(categoryId) {
  const match = FOOD_CATEGORIES.find((item) => item.id === categoryId);
  return match?.label || categoryId;
}

function renderGroceryList() {
  const container = document.getElementById('grocery-list');
  if (!container) return;

  const totals = buildShoppingTotals();
  if (!totals.size) {
    container.innerHTML = '<p class="grocery-drawer__empty">Your grocery list fills in as meals are assigned.</p>';
    return;
  }

  const groups = new Map();
  totals.forEach((servings, foodName) => {
    const categoryId = groceryCategoryId(foodName);
    if (!groups.has(categoryId)) groups.set(categoryId, []);
    const food = state.foods.find((item) => item.name === foodName);
    groups.get(categoryId).push({
      foodName,
      label: food ? foodListLabel(food) : foodName,
      servings,
    });
  });

  const categoryOrder = FOOD_CATEGORIES.map((item) => item.id);
  const sections = [...groups.entries()]
    .sort((a, b) => categoryOrder.indexOf(a[0]) - categoryOrder.indexOf(b[0]))
    .map(([categoryId, items]) => {
      const lines = items
        .sort((a, b) => a.label.localeCompare(b.label))
        .map((item) => `
          <li class="grocery-drawer__item">
            <span class="grocery-drawer__food">${escapeHtml(item.label)}</span>
            <span class="grocery-drawer__qty">${escapeHtml(fmtServings(item.servings))} srv</span>
          </li>
        `)
        .join('');
      return `
        <section class="grocery-drawer__section">
          <h3 class="grocery-drawer__section-title">${escapeHtml(groceryCategoryLabel(categoryId))}</h3>
          <ul class="grocery-drawer__items">${lines}</ul>
        </section>
      `;
    })
    .join('');

  container.innerHTML = sections;
  updateGroceryToggleBadge(totals.size);
}

function updateGroceryToggleBadge(count) {
  const toggle = document.getElementById('grocery-toggle');
  if (!toggle) return;
  toggle.textContent = count ? `Grocery (${count})` : 'Grocery';
}

function setGroceryOpen(open) {
  groceryOpen = open;
  const drawer = document.getElementById('grocery-drawer');
  if (!drawer) return;
  drawer.classList.toggle('is-open', open);
  drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
  document.getElementById('grocery-toggle')?.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open) renderGroceryList();
}

const LANE_SWAP_LABELS = {
  protein: 'Swap',
  gs: 'Swap',
  vegetable: 'Swap',
};

function renderLaneRow(weekDay, mealSlotId, lane) {
  if (!mealLaneHasServings(mealSlotId, lane)) return '';
  const foodName = getMealLaneFood(weekDay, mealSlotId, lane);
  const label = foodName ? shortFoodName(foodName) : '—';
  return `
    <div class="reactive-lane">
      <span class="reactive-lane__food">${escapeHtml(label)}</span>
      <button
        type="button"
        class="reactive-cell__swap"
        data-swap-lane="${lane}"
        data-week-day="${weekDay}"
        data-meal-slot="${mealSlotId}"
      >${LANE_SWAP_LABELS[lane]}</button>
    </div>
  `;
}

function renderMealCell(weekDay, mealSlotId) {
  const lanes = ['protein', 'gs', 'vegetable']
    .map((lane) => renderLaneRow(weekDay, mealSlotId, lane))
    .filter(Boolean)
    .join('');

  return `
    <article class="reactive-cell reactive-cell--meal">
      ${lanes || '<div class="reactive-lane"><span class="reactive-lane__food">—</span></div>'}
    </article>
  `;
}

function renderSnackCell(weekDay) {
  const summary = dayFruitSummaryLabel(weekDay);
  return `
    <article class="reactive-cell reactive-cell--snack">
      <div class="reactive-lane">
        <span class="reactive-lane__food">${escapeHtml(summary)}</span>
        <button type="button" class="reactive-cell__swap" data-swap-fruit data-week-day="${weekDay}">Swap</button>
      </div>
    </article>
  `;
}

export function renderReactiveWeekGrid() {
  const container = document.getElementById('week-grid-matrix');
  if (!container) return;

  const head = `
    <div class="reactive-grid__head reactive-grid__head--day">Day</div>
    <div class="reactive-grid__head">Breakfast</div>
    <div class="reactive-grid__head">Lunch</div>
    <div class="reactive-grid__head">Dinner</div>
    <div class="reactive-grid__head">Snacks</div>
  `;

  const rows = WEEK_DAYS.map((day) => `
    <div class="reactive-grid__day">${escapeHtml(day.label)}</div>
    ${REACTIVE_MEAL_SLOTS.map((mealSlotId) => renderMealCell(day.id, mealSlotId)).join('')}
    ${renderSnackCell(day.id)}
  `).join('');

  container.innerHTML = `
    <div class="reactive-grid" role="grid" aria-label="Weekly meal plan">
      ${head}
      ${rows}
    </div>
    <p class="reactive-grid__tip">Don&rsquo;t like something? Swap protein, g/s, or fruit. Your grocery list updates automatically.</p>
  `;

  renderGroceryList();
}

export function renderReactivePlanner() {
  renderReactiveWeekGrid();
}

function handleSwapClick(event) {
  const fruitBtn = event.target.closest('[data-swap-fruit]');
  if (fruitBtn) {
    const weekDay = fruitBtn.dataset.weekDay;
    const next = swapDayFruit(weekDay);
    renderReactiveWeekGrid();
    persistPlannerToProgram();
    if (next) showToast(`Snacks → ${next} × 3`);
    return;
  }

  const laneBtn = event.target.closest('[data-swap-lane]');
  if (!laneBtn) return;
  const { weekDay, mealSlot, swapLane: lane } = laneBtn.dataset;
  if (!weekDay || !mealSlot || !lane) return;
  const next = swapMealLane(weekDay, mealSlot, lane);
  renderReactiveWeekGrid();
  persistPlannerToProgram();
  if (next) {
    const slotLabel = MEAL_SLOT_LABELS[mealSlot] || mealSlot;
    showToast(`${slotLabel}: new ${lane} → ${next.split(',')[0].trim()}`);
  }
}

function handleRegenerateWeek() {
  generateReactiveWeek();
  renderReactiveWeekGrid();
  persistPlannerToProgram({ immediate: true });
  showToast('Week regenerated from your plan servings.', { durationMs: 7000 });
}

export function initReactivePlanner() {
  const grid = document.getElementById('week-grid');
  if (grid && !grid.dataset.reactiveInit) {
    grid.dataset.reactiveInit = '1';
    grid.addEventListener('click', handleSwapClick);
  }

  const regenerate = document.getElementById('regenerate-week');
  if (regenerate && !regenerate.dataset.reactiveInit) {
    regenerate.dataset.reactiveInit = '1';
    regenerate.addEventListener('click', handleRegenerateWeek);
  }

  const groceryToggle = document.getElementById('grocery-toggle');
  const groceryDrawer = document.getElementById('grocery-drawer');
  if (groceryToggle && !groceryToggle.dataset.reactiveInit) {
    groceryToggle.dataset.reactiveInit = '1';
    groceryToggle.addEventListener('click', () => setGroceryOpen(!groceryOpen));
  }
  if (groceryDrawer && !groceryDrawer.dataset.reactiveInit) {
    groceryDrawer.dataset.reactiveInit = '1';
    groceryDrawer.addEventListener('click', (event) => {
      if (event.target.closest('.grocery-drawer__panel')) return;
      setGroceryOpen(false);
    });
    groceryDrawer.querySelector('.grocery-drawer__close')?.addEventListener('click', () => setGroceryOpen(false));
  }

  const page = document.getElementById('planner-page');
  if (page) {
    page.classList.add('planner-page--reactive');
    page.classList.remove('planner-page--fast-start');
  }

  const title = document.getElementById('planner-page-title');
  if (title) title.textContent = 'Weekly Menu Planner';

  renderReactivePlanner();
}

export { showToast as showReactiveToast };
