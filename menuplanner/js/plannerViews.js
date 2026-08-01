import {
  FOOD_CATEGORIES,
  SLOT_META,
  FAT_LANE_SLOT_LABELS,
  DAY_SLOTS,
  WEEK_DAYS,
  WEEK_GRID_MEALS,
  WEEK_MEAL_EMPTY_LABEL,
  MEAL_MAKER_SLOTS,
  state,
  categorySelections,
  mealSlotMeta,
  templateSlots,
  fmtServings,
  requiredServings,
  scaledLabel,
  servingAmountLabel,
  escapeHtml,
  slotFoodCategories,
  ensureActiveFoodCategory,
  isCategorySlotActive,
  isFatSlot,
  getFatSelections,
  setFatSelections,
  getMakerFatSelections,
  setMakerFatSelections,
  isSplitServingsMakerSlot,
  getMakerSplitSelections,
  addMakerSplitFood,
  removeMakerSplitFood,
  setSplitGridSelections,
  isFruitOnlySnack,
  isAssignedMeal,
  isSnackMealSlot,
  isMealMealSlot,
  gridCellHasAssignment,
  savedMealFitsMealSlot,
  applyLibraryRecipeToGridCell,
  applySavedMealToGridCell,
  mealItemsScaledToSlot,
  clearDaySlotMeta,
  clearMealMakerDraft,
  applySavedMealItemsToMakerDraft,
  savedMealById,
  isMealMakerSaveable,
  mealMakerToItems,
  makerRequiredServings,
  makerServingHint,
  mealIdFromName,
  findSavedMealByName,
  dedupeSavedMeals,
  persistPlannerToProgram,
  createEmptyDayState,
} from './plannerState.js';
import { ASSET_VERSION as FALLBACK_ASSET_VERSION } from '../../js/assetVersion.js';
import { foodListLabel } from '../../js/foodDisplay.js';
import { canonicalFruitName } from '../data/fruitNames.js';

const PLANNER_V = new URL(import.meta.url).searchParams.get('v') || FALLBACK_ASSET_VERSION;
const {
  allMealTemplates,
  libraryRecipeFitsMealSlot,
  mealMatchesSorter,
  MEAL_SORTER_PILLS,
  recipeById,
} = await import(`../data/recipeLibrary.js?v=${PLANNER_V}`);
const { recipeImageUrl, recipeImageFallbackUrl } = await import(`../data/recipeImages.js?v=${PLANNER_V}`);
const { fruitImageUrl } = await import(`../data/fruitImages.js?v=${PLANNER_V}`);
const {
  isFastStartFruit,
  fastStartFruitSortKey,
} = await import(`../data/fastStartFruits.js?v=${PLANNER_V}`);

const PLANNER_MODE_TITLES = {
  'fast-start': 'Fast Start Menu Planner',
  diy: 'Do-It-Yourself Menu Planner',
};

function normalizePlannerEngagementMode(mode) {
  return mode === 'diy' ? 'diy' : 'fast-start';
}

function syncPlannerEngagementUi() {
  const mode = normalizePlannerEngagementMode(state.plannerEngagementMode);
  state.plannerEngagementMode = mode;

  const page = document.getElementById('planner-page');
  if (page) {
    page.classList.toggle('planner-page--fast-start', mode === 'fast-start');
    page.classList.toggle('planner-page--diy', mode === 'diy');
  }

  const title = document.getElementById('planner-page-title');
  if (title) title.textContent = PLANNER_MODE_TITLES[mode];

  const navBtn = document.querySelector('[data-nav-page="3"]');
  if (navBtn) {
    navBtn.textContent = '4. Menu planner';
  }

  document.querySelectorAll('[data-planner-mode]').forEach((btn) => {
    const active = btn.dataset.plannerMode === mode;
    btn.classList.toggle('planner-mode-toggle__btn--active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function setPlannerEngagementMode(mode) {
  const next = normalizePlannerEngagementMode(mode);
  if (state.plannerEngagementMode === next) {
    syncPlannerEngagementUi();
    return;
  }
  state.plannerEngagementMode = next;
  syncPlannerEngagementUi();
  renderPlannerMeta();
  renderFruitList();
  persistPlannerToProgram();
}

function initPlannerEngagementToggle() {
  document.querySelectorAll('[data-planner-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setPlannerEngagementMode(btn.dataset.plannerMode);
    });
  });
  syncPlannerEngagementUi();
}

function renderPlannerMeta() {
  syncPlannerEngagementUi();

  const meta = document.getElementById('planner-servings');
  if (!meta) return;

  if (!state.programPackage?.intake) {
    meta.hidden = true;
    meta.textContent = '';
    return;
  }

  const servings = state.programPackage.plan?.servings;
  const parts = servings
    ? [
      `Protein ${fmtServings(servings.protein)}`,
      `G/S ${fmtServings(servings.grainsStarches)}`,
      `Fruit ${fmtServings(servings.fruits)}`,
      `Veg ${fmtServings(servings.vegetables)}`,
    ]
    : [];
  if (servings && state.plannerEngagementMode !== 'fast-start') {
    parts.push(`Fat pts ${fmtServings(servings.fatMaintain)}`);
  }
  const servingsLine = parts.length ? parts.join(', ') : '';

  if (!servingsLine) {
    meta.hidden = true;
    meta.textContent = '';
    return;
  }

  meta.textContent = servingsLine;
  meta.hidden = false;
}

function refreshFoodsPanel() {
  renderFoodFilterLabel();
  renderFoodFilters();
  renderFoodStack();
}

function refreshPlannerAfterMenuChange() {
  renderWeekGrid();
  renderRecipeCards();
  renderMealMaker();
  refreshFoodsPanel();
  persistPlannerToProgram();
}

function saveMealFromMaker(name) {
  const trimmed = name.trim();
  if (!trimmed || !isMealMakerSaveable()) return;

  const items = mealMakerToItems();
  let meal = findSavedMealByName(trimmed);

  if (meal) {
    meal.name = trimmed;
    meal.items = items;
    meal.pickCount = (meal.pickCount || 0) + 1;
  } else {
    meal = {
      id: mealIdFromName(trimmed),
      name: trimmed,
      pickCount: 1,
      items,
    };
    state.savedMeals.push(meal);
  }

  dedupeSavedMeals();
  clearMealMakerDraft();
  state.makerSourceMealId = null;
  state.activeMakerSlot = null;
  state.activeFoodCategory = null;
  renderMealMaker();
  renderSavedMeals();
  renderRecipeCards();
  refreshFoodsPanel();
  persistPlannerToProgram();
}

function openSaveMealDialog() {
  const dialog = document.getElementById('save-meal-dialog');
  const input = document.getElementById('save-meal-name');
  if (!dialog || !input || !isMealMakerSaveable()) return;
  const sourceMeal = state.makerSourceMealId ? savedMealById(state.makerSourceMealId) : null;
  input.value = sourceMeal?.name || '';
  dialog.showModal();
  input.focus();
  input.select();
}

function updateSaveMealTrigger() {
  const button = document.getElementById('save-meal-open');
  if (!button) return;
  button.disabled = !isMealMakerSaveable();
}

function renderMakerSplitItemCard({ item, index, categorySlot }) {
  const food = state.foods.find((entry) => entry.name === item.foodName);
  const detail = food ? servingAmountLabel(food, item.servings) : '';

  return `
    <div class="fat-points__item">
      <button
        type="button"
        class="fat-points__remove"
        data-maker-split-remove
        data-split-category="${categorySlot}"
        data-split-index="${index}"
        aria-label="Remove ${escapeHtml(item.foodName)}"
      >×</button>
      <p class="card__title">${escapeHtml(item.foodName)}</p>
      ${detail ? `<p class="card__detail">${detail}</p>` : ''}
    </div>
  `;
}

function renderMakerSplitLane(categorySlot) {
  const meta = SLOT_META[categorySlot];
  const active = isCategorySlotActive(categorySlot);
  const items = getMakerSplitSelections(categorySlot);
  const optionalTag = meta.optional ? ' <span class="card__slot-optional">(optional)</span>' : '';

  if (!items.length) {
    return `
      <button
        type="button"
        class="card card--slot card--empty${meta.optional ? ' card--slot-optional' : ''}${active ? ' card--slot-active' : ''}"
        data-maker-category
        data-category-slot="${categorySlot}"
      >
        <span class="card__slot-label">${meta.label}${optionalTag}</span>
        <span class="card__slot-hint">${makerServingHint(categorySlot)}</span>
      </button>
    `;
  }

  const stackHtml = items
    .map((item, index) => renderMakerSplitItemCard({ item, index, categorySlot }))
    .join('');

  return `
    <div
      class="fat-points-lane card card--slot card--filled${meta.optional ? ' card--slot-optional' : ''}${active ? ' card--slot-active' : ''}"
      data-maker-category
      data-category-slot="${categorySlot}"
    >
      <span class="card__slot-label">${meta.label}${optionalTag}</span>
      <div class="fat-points-lane__stack">
        ${stackHtml}
        <div class="fat-points__add">
          <span class="card__slot-hint">Tap or drag to add another</span>
        </div>
      </div>
    </div>
  `;
}

function renderMakerFatItemCard({ item, index }) {
  const food = state.foods.find((entry) => entry.name === item.foodName);
  const categoryLabel = FAT_LANE_SLOT_LABELS[food?.category];
  const detail = food ? servingAmountLabel(food, item.servings) : '';
  const typeTag = categoryLabel
    ? `<span class="fat-points__type">${categoryLabel}</span>`
    : '';

  return `
    <div class="fat-points__item">
      <button
        type="button"
        class="fat-points__remove"
        data-maker-fat-remove
        data-fat-index="${index}"
        aria-label="Remove ${escapeHtml(item.foodName)}"
      >×</button>
      ${typeTag}
      <p class="card__title">${escapeHtml(item.foodName)}</p>
      ${detail ? `<p class="card__detail">${detail}</p>` : ''}
    </div>
  `;
}

function renderMakerFatPointsLane() {
  const meta = SLOT_META.fat;
  const active = isCategorySlotActive('fat');
  const items = getMakerFatSelections();
  const optionalTag = ' <span class="card__slot-optional">(optional)</span>';

  if (!items.length) {
    return `
      <button
        type="button"
        class="card card--slot card--empty card--slot-optional${active ? ' card--slot-active' : ''}"
        data-maker-category
        data-category-slot="fat"
      >
        <span class="card__slot-label">${meta.label}${optionalTag}</span>
        <span class="card__slot-hint">${makerServingHint('fat')}</span>
      </button>
    `;
  }

  const stackHtml = items
    .map((item, index) => renderMakerFatItemCard({ item, index }))
    .join('');

  return `
    <div
      class="fat-points-lane card card--slot card--filled card--slot-optional${active ? ' card--slot-active' : ''}"
      data-maker-category
      data-category-slot="fat"
    >
      <span class="card__slot-label">${meta.label}${optionalTag}</span>
      <div class="fat-points-lane__stack">
        ${stackHtml}
        <div class="fat-points__add">
          <span class="card__slot-hint">Drag to add another</span>
        </div>
      </div>
    </div>
  `;
}

function renderMakerCategorySlot(categorySlot) {
  if (isFatSlot(categorySlot)) {
    return renderMakerFatPointsLane();
  }

  if (isSplitServingsMakerSlot(categorySlot)) {
    return renderMakerSplitLane(categorySlot);
  }

  const meta = SLOT_META[categorySlot];
  const active = isCategorySlotActive(categorySlot);
  const optionalTag = meta.optional ? ' <span class="card__slot-optional">(optional)</span>' : '';
  const selected = state.mealMakerDraft[categorySlot];

  if (selected) {
    const food = state.foods.find((item) => item.name === selected.foodName);
    const detail = food ? servingAmountLabel(food, selected.servings) : '';
    return `
      <button
        type="button"
        class="card card--slot card--filled${active ? ' card--slot-active' : ''}"
        data-maker-category
        data-category-slot="${categorySlot}"
      >
        <span class="card__slot-label">${meta.label}${optionalTag}</span>
        <p class="card__title">${escapeHtml(selected.foodName)}</p>
        ${detail ? `<p class="card__detail">${detail}</p>` : ''}
      </button>
    `;
  }

  return `
    <button
      type="button"
      class="card card--slot card--empty${meta.optional ? ' card--slot-optional' : ''}${active ? ' card--slot-active' : ''}"
      data-maker-category
      data-category-slot="${categorySlot}"
    >
      <span class="card__slot-label">${meta.label}${optionalTag}</span>
      <span class="card__slot-hint">${makerServingHint(categorySlot)}</span>
    </button>
  `;
}

function renderMealMaker() {
  const container = document.getElementById('meal-maker');
  if (!container) return;

  const slotsHtml = MEAL_MAKER_SLOTS.map((categorySlot) => renderMakerCategorySlot(categorySlot)).join('');
  container.innerHTML = slotsHtml;

  container.querySelectorAll('[data-maker-category]').forEach((button) => {
    button.addEventListener('click', (event) => {
      if (event.target.closest('[data-maker-fat-remove], [data-maker-split-remove]')) return;
      state.activeMakerSlot = button.dataset.categorySlot;
      state.activeFoodCategory = null;
      ensureActiveFoodCategory();
      renderMealMaker();
      renderSavedMeals();
      refreshFoodsPanel();
    });
  });

  container.querySelectorAll('[data-maker-fat-remove]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      removeMakerFatPoint(Number(button.dataset.fatIndex));
    });
  });

  container.querySelectorAll('[data-maker-split-remove]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      removeMakerSplitFood(button.dataset.splitCategory, Number(button.dataset.splitIndex));
      renderMealMaker();
    });
  });

  updateSaveMealTrigger();
}

function clearMealMaker() {
  clearMealMakerDraft();
  state.activeMakerSlot = null;
  state.activeFoodCategory = null;
  renderMealMaker();
  renderSavedMeals();
  refreshFoodsPanel();
}

function loadSavedMealIntoMaker(mealId) {
  const meal = state.savedMeals.find((item) => item.id === mealId);
  if (!meal || !applySavedMealItemsToMakerDraft(meal)) return;

  state.activeMakerSlot = null;
  state.activeFoodCategory = null;
  renderMealMaker();
  renderSavedMeals();
  refreshFoodsPanel();
  persistPlannerToProgram();
}

function clearWeekMenu() {
  WEEK_DAYS.forEach((day) => {
    state.weekPlan[day.id] = createEmptyDayState();
  });
  state.activeMakerSlot = null;
  state.activeFoodCategory = null;
  refreshPlannerAfterMenuChange();
}

function initClearMealMaker() {
  document.getElementById('clear-meal-maker')?.addEventListener('click', clearMealMaker);
}

function initClearWeekMenu() {
  const grid = document.getElementById('week-grid');
  if (!grid || grid.dataset.clearWeekInit) return;
  grid.dataset.clearWeekInit = '1';
  grid.addEventListener('click', (event) => {
    if (event.target.closest('#clear-week-menu')) {
      clearWeekMenu();
    }
  });
}

function setWeekGridCollapsed(collapsed, { persist = true } = {}) {
  state.weekGridCollapsed = collapsed;
  const panel = document.getElementById('week-panel');
  const title = document.getElementById('week-grid-toggle');
  if (panel) {
    panel.classList.toggle('is-collapsed', collapsed);
  }
  if (title) {
    title.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    title.setAttribute('aria-label', collapsed ? 'Show week grid' : 'Hide week grid');
  }
  if (persist) persistPlannerToProgram();
}

function initWeekGridCollapse() {
  const panel = document.getElementById('week-panel');
  const grid = document.getElementById('week-grid');
  if (!panel || !grid || panel.dataset.weekCollapseInit) return;
  panel.dataset.weekCollapseInit = '1';
  setWeekGridCollapsed(state.weekGridCollapsed, { persist: false });
  grid.addEventListener('click', (event) => {
    if (state.weekGridCollapsed) {
      setWeekGridCollapsed(false);
      return;
    }
    if (event.target.closest('[data-meal-slot], .week-matrix__day[data-week-day-select], #clear-week-menu')) {
      return;
    }
    setWeekGridCollapsed(true);
  });
}

let weekGridLabelProbe = null;

function weekGridLabelReferenceCell() {
  return document.querySelector('#week-grid-matrix .week-matrix__cell.mini-card[data-meal-slot="breakfast"]')
    || document.querySelector('#week-grid-matrix .week-matrix__cell.mini-card[data-meal-slot]');
}

function ensureWeekGridLabelProbe() {
  if (!weekGridLabelProbe) {
    weekGridLabelProbe = document.createElement('div');
    weekGridLabelProbe.className = 'mini-card week-matrix__cell';
    weekGridLabelProbe.setAttribute('aria-hidden', 'true');
    Object.assign(weekGridLabelProbe.style, {
      position: 'absolute',
      left: '-9999px',
      top: '0',
      visibility: 'hidden',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      display: 'block',
    });
    document.body.appendChild(weekGridLabelProbe);
  }
  return weekGridLabelProbe;
}

function syncWeekGridLabelProbeStyles() {
  const probe = ensureWeekGridLabelProbe();
  const refCell = weekGridLabelReferenceCell();
  if (!refCell) return;
  const style = getComputedStyle(refCell);
  probe.style.font = style.font;
  probe.style.letterSpacing = style.letterSpacing;
  probe.style.textTransform = style.textTransform;
  probe.style.boxSizing = style.boxSizing;
  probe.style.padding = style.padding;
  probe.style.border = style.border;
}

function weekGridLabelMaxWidth() {
  const cell = weekGridLabelReferenceCell();
  if (!cell) return null;
  return cell.getBoundingClientRect().width;
}

function weekGridLabelFits(text, maxWidth) {
  syncWeekGridLabelProbeStyles();
  const probe = ensureWeekGridLabelProbe();
  probe.style.width = `${maxWidth}px`;
  probe.textContent = text;
  return probe.scrollWidth <= probe.clientWidth;
}

function fitWeekGridLabel(text) {
  const raw = String(text ?? '').trim();
  if (!raw) return '';

  const maxWidth = weekGridLabelMaxWidth();
  if (maxWidth == null || maxWidth <= 0) return raw;
  if (weekGridLabelFits(raw, maxWidth)) return raw;

  let lo = 0;
  let hi = raw.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (weekGridLabelFits(raw.slice(0, mid), maxWidth)) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }

  const fitted = raw.slice(0, lo).trimEnd();
  if (fitted) return fitted;
  return raw.charAt(0);
}

function setActiveGridTarget(weekDay, mealSlotId) {
  state.activeGridTarget = { weekDay, mealSlotId };
  state.activeWeekDay = weekDay;
  updatePickerHints();
  renderWeekGrid();
}

function gridTargetLabel(target) {
  const day = WEEK_DAYS.find((item) => item.id === target.weekDay);
  const slot = DAY_SLOTS.find((item) => item.id === target.mealSlotId);
  return `${day?.label ?? target.weekDay} · ${slot?.label ?? target.mealSlotId}`;
}

function updatePickerHints() {
  clearPanelHintNotice('recipes-panel-hint');
  clearPanelHintNotice('fruits-panel-hint');

  const recipeHint = document.getElementById('recipes-panel-hint');
  const fruitHint = document.getElementById('fruits-panel-hint');
  const target = state.activeGridTarget;

  if (recipeHint) {
    recipeHint.innerHTML = target && isMealMealSlot(target.mealSlotId)
      ? `<strong>${escapeHtml(gridTargetLabel(target))}</strong> selected — tap a meal below`
      : 'Tap a day/meal cell, then tap a meal below to update the grid.';
  }

  if (fruitHint) {
    fruitHint.innerHTML = target && isSnackMealSlot(target.mealSlotId)
      ? `<strong>${escapeHtml(gridTargetLabel(target))}</strong> selected — tap a fruit below`
      : 'Tap a snack cell, then tap a fruit below to update the grid.';
  }
}

const PANEL_HINT_NOTICE_MS = 5000;
const panelHintNoticeTimers = {
  'recipes-panel-hint': null,
  'fruits-panel-hint': null,
};

function clearPanelHintNotice(hintId) {
  if (panelHintNoticeTimers[hintId]) {
    window.clearTimeout(panelHintNoticeTimers[hintId]);
    panelHintNoticeTimers[hintId] = null;
  }
  const el = document.getElementById(hintId);
  if (el) {
    el.classList.remove('recipes-panel__hint--notice', 'fruits-panel__hint--notice');
  }
}

function showPanelHintNotice(hintId, message) {
  clearPanelHintNotice(hintId);
  const el = document.getElementById(hintId);
  if (!el) return;

  el.textContent = message;
  el.classList.add(
    hintId === 'recipes-panel-hint' ? 'recipes-panel__hint--notice' : 'fruits-panel__hint--notice',
  );

  panelHintNoticeTimers[hintId] = window.setTimeout(() => {
    panelHintNoticeTimers[hintId] = null;
    el.classList.remove('recipes-panel__hint--notice', 'fruits-panel__hint--notice');
    updatePickerHints();
  }, PANEL_HINT_NOTICE_MS);
}

function applyMealIdeaFromCard(meal) {
  const target = state.activeGridTarget;
  if (!target || !isMealMealSlot(target.mealSlotId)) return;
  if (!libraryRecipeFitsMealSlot(meal, target.mealSlotId)) return;

  applyLibraryRecipeToMealSlot(target.weekDay, target.mealSlotId, meal);
  showPanelHintNotice('recipes-panel-hint', `${gridTargetLabel(target)} → ${meal.name}`);
}

function applyFruitFromRow(foodName) {
  const target = state.activeGridTarget;
  if (!target || !isSnackMealSlot(target.mealSlotId)) return;

  applyFruitToSnackCell(target.weekDay, target.mealSlotId, foodName);
  showPanelHintNotice('fruits-panel-hint', `${gridTargetLabel(target)} → ${foodName}`);
}

/** Reserved — meal/fruit feedback UI removed; stub keeps callers safe until rebuilt. */
function showPlannerToast() {}

function weekMealLabel(weekDay, mealSlotId) {
  const meta = mealSlotMeta(mealSlotId, weekDay);
  if (isAssignedMeal(mealSlotId, weekDay)) {
    const fullText = meta.mealName;
    const text = fitWeekGridLabel(fullText);
    return { text, fullText, empty: false };
  }

  if (isFruitOnlySnack(mealSlotId, weekDay)) {
    const fruitName = categorySelections(mealSlotId, weekDay).fruit.foodName;
    const text = fitWeekGridLabel(fruitName);
    return { text, fullText: fruitName, empty: false };
  }

  return { text: WEEK_MEAL_EMPTY_LABEL[mealSlotId], empty: true };
}

function findFruitByName(foodName) {
  const canonical = canonicalFruitName(foodName);
  return state.foods.find(
    (item) => item.category === 'fruit'
      && (item.name === foodName || canonicalFruitName(item.name) === canonical),
  );
}

function applyFruitToSnackCell(weekDay, mealSlotId, foodName) {
  if (!isSnackMealSlot(mealSlotId)) return;
  const food = findFruitByName(foodName);
  if (!food) return;

  templateSlots('snack').forEach((slotKey) => {
    categorySelections(mealSlotId, weekDay)[slotKey] = null;
  });
  setFatSelections(mealSlotId, [], weekDay);
  clearDaySlotMeta(mealSlotId, weekDay);
  categorySelections(mealSlotId, weekDay).fruit = {
    foodName: canonicalFruitName(food.name),
    servings: requiredServings(mealSlotId, 'fruit'),
  };
  renderWeekGrid();
  persistPlannerToProgram();
}

function weekGridColumnLabel(mealSlotId) {
  const slot = DAY_SLOTS.find((item) => item.id === mealSlotId);
  if (!slot) return mealSlotId;
  if (slot.template === 'snack') return 'Snack';
  return slot.label;
}

function renderWeekGrid() {
  const container = document.getElementById('week-grid-matrix');
  if (!container) return;
  const headCells = WEEK_GRID_MEALS.map((mealSlotId) => `
    <div class="week-matrix__col-head">${escapeHtml(weekGridColumnLabel(mealSlotId))}</div>
  `).join('');

  const bodyRows = WEEK_DAYS.map((day) => {
    const active = day.id === state.activeWeekDay;
    const dayCell = `
      <div
        class="week-matrix__day${active ? ' week-matrix__day--active' : ''}"
        data-week-day-select
        data-week-day="${day.id}"
      >${escapeHtml(day.label)}</div>
    `;
    const mealCells = WEEK_GRID_MEALS.map((mealSlotId) => {
      const { text, fullText, empty } = weekMealLabel(day.id, mealSlotId);
      const isTarget = state.activeGridTarget
        && state.activeGridTarget.weekDay === day.id
        && state.activeGridTarget.mealSlotId === mealSlotId;
      const tooltip = !empty && fullText && fullText !== text ? fullText : text;
      const titleAttr = empty ? '' : ` title="${escapeHtml(tooltip)}"`;
      return `
        <button
          type="button"
          class="mini-card week-matrix__cell${empty ? ' mini-card--empty' : ''}${isTarget ? ' mini-card--target' : ''}"
          data-week-meal-drop
          ${titleAttr}
          data-week-day="${day.id}"
          data-meal-slot="${mealSlotId}"
        >${escapeHtml(text)}</button>
      `;
    }).join('');
    return dayCell + mealCells;
  }).join('');

  container.innerHTML = `
    <div class="week-matrix" role="grid" aria-label="Week">
      <div class="week-matrix__corner">
        <button type="button" class="day-col__clear week-matrix__clear" id="clear-week-menu">Clear Week</button>
      </div>
      ${headCells}
      ${bodyRows}
    </div>
  `;
}

function setActiveWeekDay(weekDay) {
  if (weekDay === state.activeWeekDay) return;
  state.activeWeekDay = weekDay;
  renderWeekGrid();
  renderSavedMeals();
  refreshFoodsPanel();
  persistPlannerToProgram();
}

function initWeekGrid() {
  const panel = document.getElementById('week-panel');
  const grid = document.getElementById('week-grid');
  if (!panel || !grid || panel.dataset.weekInit) return;
  panel.dataset.weekInit = '1';

  panel.addEventListener('click', (event) => {
    if (event.target.closest('#clear-week-menu')) return;
    const mealCell = event.target.closest('[data-week-meal-drop]');
    if (mealCell) {
      setActiveGridTarget(mealCell.dataset.weekDay, mealCell.dataset.mealSlot);
      return;
    }
    const dayCell = event.target.closest('.week-matrix__day[data-week-day-select]');
    if (dayCell) {
      setActiveWeekDay(dayCell.dataset.weekDay);
    }
  });

  grid.addEventListener('click', (event) => {
    const mealCell = event.target.closest('[data-week-meal-drop]');
    if (!mealCell) return;
    setActiveGridTarget(mealCell.dataset.weekDay, mealCell.dataset.mealSlot);
  });

  grid.addEventListener('dragover', (event) => {
    const cell = event.target.closest('[data-week-meal-drop]');
    if (!cell) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    cell.classList.add('drop-zone--over');
  });

  grid.addEventListener('dragleave', (event) => {
    const cell = event.target.closest('[data-week-meal-drop]');
    if (cell) cell.classList.remove('drop-zone--over');
  });

  grid.addEventListener('drop', (event) => {
    const cell = event.target.closest('[data-week-meal-drop]');
    if (!cell) return;
    event.preventDefault();
    cell.classList.remove('drop-zone--over');

    const foodName = event.dataTransfer.getData('application/x-food-name');
    if (foodName) {
      if (!isSnackMealSlot(cell.dataset.mealSlot)) {
        showPlannerToast('Drag fruit onto snack slots only.', { variant: 'error' });
        return;
      }
      const food = state.foods.find((item) => item.name === foodName);
      if (!food || food.category !== 'fruit') {
        showPlannerToast('Only fruit can be dropped on snack slots.', { variant: 'error' });
        return;
      }
      applyFruitToSnackCell(cell.dataset.weekDay, cell.dataset.mealSlot, foodName);
      setActiveWeekDay(cell.dataset.weekDay);
      return;
    }

    const mealId = event.dataTransfer.getData('application/x-meal-id');
    if (!mealId) return;

    const meal = state.savedMeals.find((item) => item.id === mealId);
    if (!meal) return;

    if (!isMealMealSlot(cell.dataset.mealSlot)) {
      showPlannerToast('Drag saved meals onto breakfast, lunch, or dinner only.', { variant: 'error' });
      return;
    }

    if (!savedMealFitsMealSlot(meal, cell.dataset.mealSlot)) {
      showPlannerToast('That saved meal is not complete.', { variant: 'error' });
      return;
    }

    applySavedMealToMealSlot(cell.dataset.weekDay, cell.dataset.mealSlot, meal);
    setActiveWeekDay(cell.dataset.weekDay);
  });
}

function foodsForActiveBrowse() {
  const categories = slotFoodCategories();
  if (!categories.length) return [];
  ensureActiveFoodCategory();
  const filterCategories = categories.length > 1
    ? [state.activeFoodCategory]
    : categories;
  const query = state.foodSearchQuery.trim().toLowerCase();
  return state.foods
    .filter((food) => filterCategories.includes(food.category))
    .filter((food) => !query || food.name.toLowerCase().includes(query))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function syncFoodSearchField() {
  const input = document.getElementById('food-search');
  if (!input) return;
  input.hidden = false;
  if (input.value !== state.foodSearchQuery) {
    input.value = state.foodSearchQuery;
  }
}

function mealDragHtml(meal) {
  return `<p class="card__title">${escapeHtml(meal.name)}</p>`;
}

function foodByName(name) {
  return state.foods.find((item) => item.name === name);
}

function renderMealIdeaCard(meal) {
  const linesHtml = (meal.items || []).map((item) => `
      <div class="recipe-card__line">${escapeHtml(item.foodName)}</div>
    `).join('');

  const caveatText = meal.flavor || meal.caveats;
  const profileHtml = meal.profile
    ? `<p class="recipe-card__profile">${escapeHtml(meal.profile)}</p>`
    : '';
  const caveatHtml = caveatText
    ? `<p class="recipe-card__caveat-text">${escapeHtml(caveatText)}</p>`
    : '';

  const imgUrl = recipeImageUrl(meal.id, PLANNER_V);
  const fallbackUrl = recipeImageFallbackUrl(PLANNER_V);

  return `
    <article class="recipe-card">
      <button
        type="button"
        class="recipe-card__pick"
        data-meal-idea-id="${escapeHtml(meal.id)}"
      >
        <div class="recipe-card__col recipe-card__col--plate">
          <img
            class="recipe-card__img"
            src="${escapeHtml(imgUrl)}"
            alt=""
            loading="lazy"
            decoding="async"
            onerror="this.onerror=null;this.src='${escapeHtml(fallbackUrl)}'"
          />
        </div>
        <div class="recipe-card__content">
          <div class="recipe-card__head">
            <div class="recipe-card__col recipe-card__col--title">
              <p class="recipe-card__name">${escapeHtml(meal.name)}</p>
              ${profileHtml}
            </div>
            <div class="recipe-card__col recipe-card__col--foods">
              ${linesHtml ? `<div class="recipe-card__core">${linesHtml}</div>` : ''}
            </div>
          </div>
          ${caveatHtml ? `<div class="recipe-card__caveat">${caveatHtml}</div>` : ''}
        </div>
      </button>
    </article>
  `;
}

function renderMealSorter() {
  const container = document.getElementById('meal-sorter');
  if (!container) return;

  container.innerHTML = MEAL_SORTER_PILLS.map((pill) => {
    const active = state.mealSuggestionSorter === pill.id ? ' meal-sorter__pill--active' : '';
    return `
      <button
        type="button"
        class="meal-sorter__pill${active}"
        data-meal-sorter="${escapeHtml(pill.id)}"
      >${escapeHtml(pill.label)}</button>
    `;
  }).join('');
}

function renderRecipeCards() {
  const container = document.getElementById('recipe-cards');
  if (!container) return;

  const meals = allMealTemplates().filter((meal) => mealMatchesSorter(meal, state.mealSuggestionSorter));
  container.className = 'recipe-cards';
  container.innerHTML = meals.length
    ? meals.map((meal) => renderMealIdeaCard(meal)).join('')
    : `<p class="recipe-cards__empty">${escapeHtml(
      state.mealSuggestionSorter === 'all'
        ? 'No ideas yet'
        : `No ${MEAL_SORTER_PILLS.find((p) => p.id === state.mealSuggestionSorter)?.label ?? ''} ideas yet`,
    )}</p>`;
}

function renderFruitList() {
  const container = document.getElementById('fruit-list');
  if (!container) return;

  const snackServings = requiredServings('morning-snack', 'fruit');
  let fruits = state.foods.filter((food) => food.category === 'fruit');
  if (state.plannerEngagementMode === 'fast-start') {
    fruits = fruits.filter((food) => isFastStartFruit(food.name));
    fruits.sort((a, b) => fastStartFruitSortKey(a.name) - fastStartFruitSortKey(b.name));
  } else {
    fruits.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (!fruits.length) {
    container.innerHTML = '<p class="fruit-list__empty">Fruit list loading…</p>';
    return;
  }

  container.innerHTML = fruits.map((food) => {
    const fruitName = canonicalFruitName(food.name);
    const imgUrl = fruitImageUrl(fruitName, PLANNER_V);
    const imgHtml = imgUrl
      ? `<img class="fruit-row__img" src="${escapeHtml(imgUrl)}" alt="" loading="lazy" decoding="async" />`
      : '';
    return `
      <button type="button" class="fruit-row" data-fruit-name="${escapeHtml(fruitName)}">
        <span class="fruit-row__lead">
          ${imgHtml}
          <span class="fruit-row__name">${escapeHtml(fruitName)}</span>
        </span>
      </button>
    `;
  }).join('');
}

function initFruitPicker() {
  const container = document.getElementById('fruit-list');
  if (!container || container.dataset.fruitPickerInit) return;
  container.dataset.fruitPickerInit = '1';

  container.addEventListener('click', (event) => {
    const row = event.target.closest('[data-fruit-name]');
    if (!row) return;
    applyFruitFromRow(row.dataset.fruitName);
  });
}

function initMealSorter() {
  const container = document.getElementById('meal-sorter');
  if (!container || container.dataset.mealSorterInit) return;
  container.dataset.mealSorterInit = '1';

  container.addEventListener('click', (event) => {
    const pill = event.target.closest('[data-meal-sorter]');
    if (!pill) return;
    state.mealSuggestionSorter = pill.dataset.mealSorter;
    renderMealSorter();
    renderRecipeCards();
  });
}

function initRecipePicker() {
  const container = document.getElementById('recipe-cards');
  if (!container || container.dataset.recipePickerInit) return;
  container.dataset.recipePickerInit = '1';

  container.addEventListener('click', (event) => {
    const card = event.target.closest('[data-meal-idea-id]');
    if (!card) return;
    const meal = recipeById(card.dataset.mealIdeaId);
    if (!meal) return;
    applyMealIdeaFromCard(meal);
  });
}

function renderSavedMealCard(meal) {
  const loaded = state.makerSourceMealId === meal.id ? ' saved-meal__apply--ready' : '';
  return `
    <article class="saved-meal card card--meal" data-meal-id="${meal.id}">
      <button
        type="button"
        class="saved-meal__apply${loaded}"
        draggable="true"
        data-meal-source
        data-meal-id="${meal.id}"
      >${escapeHtml(meal.name)}</button>
      <button
        type="button"
        class="saved-meal__delete"
        data-meal-delete="${meal.id}"
        aria-label="Delete ${escapeHtml(meal.name)}"
      >×</button>
    </article>
  `;
}

function savedMealsByPopularity() {
  return [...state.savedMeals].sort((a, b) => b.pickCount - a.pickCount);
}

function deleteSavedMeal(mealId) {
  const index = state.savedMeals.findIndex((meal) => meal.id === mealId);
  if (index === -1) return;

  state.savedMeals.splice(index, 1);

  if (state.makerSourceMealId === mealId) {
    clearMealMakerDraft();
    state.activeMakerSlot = null;
  }

  WEEK_DAYS.forEach((weekDay) => {
    DAY_SLOTS.forEach((daySlot) => {
      if (mealSlotMeta(daySlot.id, weekDay).savedMealId === mealId) {
        mealSlotMeta(daySlot.id, weekDay).mealName = null;
        mealSlotMeta(daySlot.id, weekDay).savedMealId = null;
      }
    });
  });

  renderSavedMeals();
  renderRecipeCards();
  renderMealMaker();
  renderWeekGrid();
  persistPlannerToProgram();
}

function renderSavedMeals() {
  const container = document.getElementById('saved-meals');
  if (!container) return;
  const meals = savedMealsByPopularity();
  const browseHint = meals.length
    ? (state.makerSourceMealId
      ? '<p class="saved-meals__browse-hint">Editing in meal maker — save when ready</p>'
      : '<p class="saved-meals__browse-hint">Tap to edit · Drag onto grid to fill</p>')
    : '';
  const emptyHint = '<p class="saved-meals__hint">Build a meal in the maker and save it here. Tap to edit or drag onto the grid.</p>';
  container.innerHTML = browseHint + (meals.length
    ? meals.map((meal) => renderSavedMealCard(meal)).join('')
    : emptyHint);

  initMealDragDrop();
}

function initSavedMealsPanel() {
  const container = document.getElementById('saved-meals');
  if (!container || container.dataset.savedMealsInit) return;
  container.dataset.savedMealsInit = '1';

  container.addEventListener('click', (event) => {
    const deleteBtn = event.target.closest('[data-meal-delete]');
    if (deleteBtn) {
      event.preventDefault();
      event.stopPropagation();
      deleteSavedMeal(deleteBtn.getAttribute('data-meal-delete'));
      return;
    }

    const applyBtn = event.target.closest('[data-meal-source]');
    if (!applyBtn || event.target.closest('[data-meal-delete]')) return;
    if (applyBtn.dataset.mealWasDragged === '1') return;
    loadSavedMealIntoMaker(applyBtn.getAttribute('data-meal-id'));
  });
}

function renderFoodFilterLabel() {
  const label = document.getElementById('food-filter-label');
  if (!label) return;
  if (!state.activeMakerSlot) {
    label.textContent = 'Snacks · drag fruit onto grid';
    label.hidden = false;
    syncFoodSearchField();
    return;
  }
  const slot = SLOT_META[state.activeMakerSlot];
  const servings = makerRequiredServings(state.activeMakerSlot);
  const servingNote = state.programPackage && !isFatSlot(state.activeMakerSlot)
    ? ` · ${fmtServings(servings)} serving${Math.abs(servings - 1) < 0.05 ? '' : 's'}`
    : '';
  label.textContent = `Meal maker · ${slot.label}${servingNote}`;
  label.hidden = false;
  syncFoodSearchField();
}

function renderFoodFilters() {
  const container = document.getElementById('food-filters');
  const categories = slotFoodCategories();

  if (!categories.length) {
    container.innerHTML = '';
    return;
  }

  ensureActiveFoodCategory();
  const multiCategory = categories.length > 1;

  container.innerHTML = FOOD_CATEGORIES
    .filter((cat) => categories.includes(cat.id))
    .map((cat) => {
      const active = cat.id === state.activeFoodCategory;
      if (!multiCategory) {
        return `<span class="food-filter food-filter--active">${cat.label}</span>`;
      }
      return `
        <button
          type="button"
          class="food-filter${active ? ' food-filter--active' : ''}"
          data-food-category="${cat.id}"
        >${cat.label}</button>
      `;
    })
    .join('');

  container.querySelectorAll('[data-food-category]').forEach((button) => {
    button.addEventListener('click', () => {
      state.activeFoodCategory = button.dataset.foodCategory;
      renderFoodFilters();
      renderFoodStack();
    });
  });
}

function foodCardDetail(food) {
  if (!state.activeMakerSlot) {
    const servings = requiredServings('morning-snack', 'fruit');
    if (!state.programPackage || Math.abs(servings - 1) < 0.05) {
      return scaledLabel(food, 1);
    }
    return servingAmountLabel(food, servings);
  }
  if (isFatSlot(state.activeMakerSlot)) {
    return scaledLabel(food, 1);
  }
  let servings = makerRequiredServings(state.activeMakerSlot);
  if (isSplitServingsMakerSlot(state.activeMakerSlot)) {
    servings = servings / (getMakerSplitSelections(state.activeMakerSlot).length + 1);
  }
  if (!state.programPackage || Math.abs(servings - 1) < 0.05) {
    return scaledLabel(food, 1);
  }
  return servingAmountLabel(food, servings);
}

function renderFoodStack() {
  const container = document.getElementById('food-stack');
  if (!container) return;
  const list = foodsForActiveBrowse();
  const dragHint = !state.activeMakerSlot
    ? '<p class="food-stack__hint">Drag fruit onto snack slots in the grid.</p>'
    : '';

  if (!list.length) {
    const hint = state.foodSearchQuery.trim()
      ? 'No foods match your search.'
      : 'No foods in this category.';
    container.innerHTML = dragHint + `<p class="food-stack__hint">${hint}</p>`;
    return;
  }

  container.innerHTML = dragHint + list.map((food) => `
    <div
      class="card card--food"
      draggable="true"
      data-food-name="${food.name.replace(/"/g, '&quot;')}"
    >
      <p class="card__title">${escapeHtml(foodListLabel(food))}</p>
      <p class="card__detail">${foodCardDetail(food)}</p>
    </div>
  `).join('');

  initFoodStackInteractions();
}

function addFoodToMaker(foodName) {
  if (!state.activeMakerSlot) return;
  fillMakerSlot(state.activeMakerSlot, foodName);
}

function initFoodStackInteractions() {
  document.querySelectorAll('[data-food-name]').forEach((card) => {
    if (card.dataset.foodBound) return;
    card.dataset.foodBound = '1';

    let dragged = false;

    card.addEventListener('dragstart', (event) => {
      dragged = true;
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('application/x-food-name', card.dataset.foodName);
      card.classList.add('card--dragging');
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('card--dragging');
      window.setTimeout(() => {
        dragged = false;
      }, 0);
    });

    card.addEventListener('click', () => {
      if (dragged) return;
      if (!state.activeMakerSlot) return;
      addFoodToMaker(card.dataset.foodName);
    });
  });
}

function fillMakerSlot(categorySlot, foodName) {
  if (isFatSlot(categorySlot)) {
    setMakerFatSelections([
      ...getMakerFatSelections(),
      { foodName, servings: 1 },
    ]);
  } else if (isSplitServingsMakerSlot(categorySlot)) {
    addMakerSplitFood(categorySlot, foodName);
  } else {
    state.mealMakerDraft[categorySlot] = {
      foodName,
      servings: makerRequiredServings(categorySlot),
    };
  }
  renderMealMaker();
}

function removeMakerFatPoint(index) {
  const items = getMakerFatSelections();
  items.splice(index, 1);
  setMakerFatSelections(items);
  renderMealMaker();
}

function applyLibraryRecipeToMealSlot(weekDay, mealSlotId, recipe) {
  if (!libraryRecipeFitsMealSlot(recipe, mealSlotId)) return;

  applyLibraryRecipeToGridCell(weekDay, mealSlotId, recipe);
  renderWeekGrid();
  persistPlannerToProgram();
}

function applySavedMealToMealSlot(weekDay, mealSlotId, meal, { trackPick = true } = {}) {
  if (!savedMealFitsMealSlot(meal, mealSlotId)) return;

  applySavedMealToGridCell(weekDay, mealSlotId, meal);
  if (trackPick) meal.pickCount += 1;
  renderWeekGrid();
  renderSavedMeals();
  renderRecipeCards();
  persistPlannerToProgram();
}

function initFoodDropTargets() {
  const maker = document.getElementById('meal-maker');
  if (!maker || maker.dataset.dropInit) return;
  maker.dataset.dropInit = '1';

  maker.addEventListener('dragover', (event) => {
    const slot = event.target.closest('[data-maker-category]');
    if (!slot || !state.activeMakerSlot) return;
    if (state.activeMakerSlot !== slot.dataset.categorySlot) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    slot.classList.add('drop-zone--over');
  });

  maker.addEventListener('dragleave', (event) => {
    const slot = event.target.closest('[data-maker-category]');
    if (slot) slot.classList.remove('drop-zone--over');
  });

  maker.addEventListener('drop', (event) => {
    const slot = event.target.closest('[data-maker-category]');
    if (!slot) return;
    event.preventDefault();
    slot.classList.remove('drop-zone--over');
    const foodName = event.dataTransfer.getData('application/x-food-name');
    if (!foodName) return;
    state.activeMakerSlot = slot.dataset.categorySlot;
    state.activeFoodCategory = null;
    ensureActiveFoodCategory();
    fillMakerSlot(slot.dataset.categorySlot, foodName);
    refreshFoodsPanel();
  });
}

function initMealDragDrop() {
  document.querySelectorAll('[data-meal-source]').forEach((card) => {
    if (card.dataset.mealDragBound) return;
    card.dataset.mealDragBound = '1';

    card.addEventListener('dragstart', (event) => {
      const meal = state.savedMeals.find((item) => item.id === card.dataset.mealId);
      if (!meal) return;
      card.dataset.mealWasDragged = '1';
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('application/x-meal-html', mealDragHtml(meal));
      event.dataTransfer.setData('application/x-meal-id', meal.id);
      card.classList.add('card--dragging');
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('card--dragging');
      window.setTimeout(() => {
        delete card.dataset.mealWasDragged;
      }, 0);
    });
  });
}

function initSaveMealDialog() {
  const dialog = document.getElementById('save-meal-dialog');
  const form = document.getElementById('save-meal-form');
  const input = document.getElementById('save-meal-name');
  const cancel = document.getElementById('save-meal-cancel');
  const open = document.getElementById('save-meal-open');
  if (!dialog || !form || !input || !cancel || dialog.dataset.saveMealInit) return;
  dialog.dataset.saveMealInit = '1';

  open?.addEventListener('click', () => {
    if (!isMealMakerSaveable()) return;
    openSaveMealDialog();
  });

  cancel.addEventListener('click', () => {
    dialog.close();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      if (!isMealMakerSaveable()) return;
      saveMealFromMaker(input.value);
    } catch (err) {
      console.error('Save meal failed:', err);
      showPlannerToast('Could not save meal. Try again.', { variant: 'error' });
    } finally {
      dialog.close();
    }
  });
}

function renderPlannerWorkspace() {
  syncPlannerEngagementUi();
  setWeekGridCollapsed(state.weekGridCollapsed, { persist: false });
  try {
    renderWeekGrid();
  } catch (err) {
    console.error('Week grid failed to render:', err);
  }
  try {
    renderMealSorter();
    renderRecipeCards();
  } catch (err) {
    console.error('Meal suggestions failed to render:', err);
  }
  try {
    renderFruitList();
  } catch (err) {
    console.error('Fruit list failed to render:', err);
  }
  updatePickerHints();
  try {
    renderMealMaker();
  } catch (err) {
    console.error('Meal maker failed to render:', err);
  }
  try {
    renderSavedMeals();
  } catch (err) {
    console.error('Saved meals failed to render:', err);
  }
  try {
    refreshFoodsPanel();
  } catch (err) {
    console.error('Foods panel failed to render:', err);
  }
}

function initFoodSearch() {
  const input = document.getElementById('food-search');
  if (!input) return;
  input.addEventListener('input', () => {
    state.foodSearchQuery = input.value;
    renderFoodStack();
  });
}

export {
  renderPlannerMeta,
  renderPlannerWorkspace,
  initWeekGrid,
  initWeekGridCollapse,
  initSaveMealDialog,
  initClearMealMaker,
  initClearWeekMenu,
  initSavedMealsPanel,
  initFoodSearch,
  initFoodDropTargets,
  initRecipePicker,
  initMealSorter,
  initFruitPicker,
  initPlannerEngagementToggle,
  setWeekGridCollapsed,
  showPlannerToast,
};
