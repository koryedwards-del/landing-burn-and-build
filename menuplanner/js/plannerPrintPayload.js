/** Planner print payloads — client builds structured data for server PDF renderers. */

import { formatPrintDateTime, programClientName } from '../../js/programBridgeUi.js';
import { printDocumentTitle } from './printShopConfig.js';
import {
  DAY_SLOTS,
  WEEK_DAYS,
  FOOD_CATEGORIES,
  state,
  categorySelections,
  templateSlots,
  isFatSlot,
  isSplitServingsMakerSlot,
  getFatSelections,
  getSplitGridSelections,
  fmtServings,
  gramWeightLabel,
  iterWeekFoodSelections,
  foodAmountLabel,
  buildShoppingTotals,
  isAssignedMeal,
  mealSlotMeta,
} from './plannerState.js';

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

function mealSlotHasAnyContent(mealSlotId) {
  return WEEK_DAYS.some((day) => mealFoodLinesForPrint(mealSlotId, day.id).length > 0);
}

function weekPlanHasContent() {
  let found = false;
  iterWeekFoodSelections(() => {
    found = true;
  });
  return found;
}

function printMeta() {
  return {
    title: '',
    clientName: programClientName(state.programPackage),
    preparedAt: formatPrintDateTime(new Date()),
  };
}

export function buildWeekPrintPayload() {
  const meta = printMeta();
  meta.title = printDocumentTitle('week', state.programPackage);

  if (!weekPlanHasContent()) {
    return {
      view: 'week',
      ...meta,
      empty: true,
      weekDays: WEEK_DAYS.map((day) => ({ id: day.id, label: day.label })),
      rows: [],
    };
  }

  const rows = DAY_SLOTS.filter((slot) => mealSlotHasAnyContent(slot.id)).map((slot) => {
    const { time, label } = mealSlotPrintParts(slot.id);
    const cells = {};
    WEEK_DAYS.forEach((day) => {
      cells[day.id] = mealFoodLinesForPrint(slot.id, day.id);
    });
    return { id: slot.id, time, label, cells };
  });

  return {
    view: 'week',
    ...meta,
    empty: false,
    weekDays: WEEK_DAYS.map((day) => ({ id: day.id, label: day.label })),
    rows,
  };
}

export function buildShoppingPrintPayload() {
  const meta = printMeta();
  meta.title = printDocumentTitle('shopping', state.programPackage);

  const totals = buildShoppingTotals();
  const categoryOrder = FOOD_CATEGORIES.map((cat) => cat.id);
  const categoryLabels = Object.fromEntries(FOOD_CATEGORIES.map((cat) => [cat.id, cat.label]));

  const groups = [];
  categoryOrder.forEach((categoryId) => {
    const rows = [];
    totals.forEach((servings, foodName) => {
      const food = state.foods.find((item) => item.name === foodName);
      if ((food?.category || 'other') !== categoryId) return;
      rows.push({ foodName, amount: foodAmountLabel(food, servings) });
    });
    rows.sort((a, b) => a.foodName.localeCompare(b.foodName));
    if (rows.length) {
      groups.push({ category: categoryLabels[categoryId], rows });
    }
  });

  return {
    view: 'shopping',
    ...meta,
    empty: groups.length === 0,
    groups,
  };
}

export function buildPlannerPrintPayload(view) {
  if (view === 'week') return buildWeekPrintPayload();
  if (view === 'shopping') return buildShoppingPrintPayload();
  return null;
}
