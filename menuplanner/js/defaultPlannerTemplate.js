/**
 * Default menu planner starter — Kristi-style Power meals + week grid.
 * Reference servings: 15 protein / 15 G&S / 4 fruit / 1 veg daily (7/15/26).
 * Meal items scale to each program's meal-slot requirements.
 */

import {
  WEEK_DAYS,
  DAY_SLOTS,
  applyPlannerState,
  categorySelections,
  mealSlotMeta,
  setSplitGridSelections,
  setFatSelections,
  clearDaySlotMeta,
  requiredServings,
  todayWeekDayId,
  state,
} from './plannerState.js';

const FOODS = {
  protein: 'Beef, eye of round',
  grainStarch: 'Tortilla, corn (6-inch)',
  vegetable: 'Peppers, red bell, cooked',
  fajitaProtein: 'Chicken breast, no skin',
  stripProtein: 'Beef, top sirloin',
};

const SNACK_FRUITS = {
  morning: 'Apple',
  morningFriday: 'Apricots',
  afternoon: 'Banana',
  evening: 'Grapes',
};

function mealItem(slot, foodName, servings) {
  return { slot, foodName, servings };
}

function powerMealItems(mealSlotId, { includeVegetable = false } = {}) {
  const items = [
    mealItem('Protein', FOODS.protein, requiredServings(mealSlotId, 'protein')),
    mealItem('Grains/Starches', FOODS.grainStarch, requiredServings(mealSlotId, 'gs')),
  ];
  if (includeVegetable) {
    items.push(mealItem('Veggie', FOODS.vegetable, requiredServings(mealSlotId, 'vegetable')));
  }
  return items;
}

function fajitaMealItems(mealSlotId, proteinFood) {
  return [
    mealItem('Protein', proteinFood, requiredServings(mealSlotId, 'protein')),
    mealItem('Grains/Starches', FOODS.grainStarch, requiredServings(mealSlotId, 'gs')),
    mealItem('Veggie', FOODS.vegetable, requiredServings(mealSlotId, 'vegetable')),
  ];
}

function buildDefaultSavedMeals() {
  return [
    {
      id: 'power-breakfast',
      name: 'Power Breakfast',
      pickCount: 7,
      items: powerMealItems('breakfast'),
    },
    {
      id: 'power-lunch',
      name: 'Power Lunch',
      pickCount: 7,
      items: powerMealItems('lunch'),
    },
    {
      id: 'power-dinner-salad',
      name: 'Power Dinner w/ salad',
      pickCount: 7,
      items: powerMealItems('dinner', { includeVegetable: true }),
    },
    {
      id: 'power-dinner',
      name: 'Power Dinner',
      pickCount: 0,
      items: powerMealItems('dinner'),
    },
    {
      id: 'fajitas',
      name: 'Fajitas',
      pickCount: 0,
      items: fajitaMealItems('dinner', FOODS.fajitaProtein),
    },
    {
      id: 'beef-strip-fajitas',
      name: 'Beef Strip Fajitas',
      pickCount: 0,
      items: fajitaMealItems('dinner', FOODS.stripProtein),
    },
  ];
}

function assignSavedMealToCell(weekDay, mealSlotId, meal) {
  const labelToSlot = {
    Protein: 'protein',
    'Grains/Starches': 'gs',
    'G / S': 'gs',
    Veggie: 'vegetable',
  };

  const proteinItems = [];
  const gsItems = [];
  const vegetableItems = [];

  meal.items.forEach((item) => {
    const slotKey = labelToSlot[item.slot];
    const entry = { foodName: item.foodName, servings: item.servings };
    if (slotKey === 'gs') gsItems.push(entry);
    else if (slotKey === 'vegetable') vegetableItems.push(entry);
    else if (slotKey === 'protein') proteinItems.push(entry);
  });

  setSplitGridSelections(mealSlotId, 'protein', proteinItems, weekDay);
  setSplitGridSelections(mealSlotId, 'gs', gsItems, weekDay);
  setSplitGridSelections(mealSlotId, 'vegetable', vegetableItems, weekDay);
  setFatSelections(mealSlotId, [], weekDay);
  mealSlotMeta(mealSlotId, weekDay).mealName = meal.name;
  mealSlotMeta(mealSlotId, weekDay).savedMealId = meal.id;
}

function assignFruitSnack(weekDay, mealSlotId, foodName) {
  categorySelections(mealSlotId, weekDay).fruit = {
    foodName,
    servings: requiredServings(mealSlotId, 'fruit'),
  };
  setFatSelections(mealSlotId, [], weekDay);
  clearDaySlotMeta(mealSlotId, weekDay);
}

function fillDefaultWeekGrid(savedMeals) {
  const byId = Object.fromEntries(savedMeals.map((meal) => [meal.id, meal]));

  WEEK_DAYS.forEach((day) => {
    assignSavedMealToCell(day.id, 'breakfast', byId['power-breakfast']);
    assignSavedMealToCell(day.id, 'lunch', byId['power-lunch']);
    assignSavedMealToCell(day.id, 'dinner', byId['power-dinner-salad']);

    const morningFruit = day.id === 'fri' ? SNACK_FRUITS.morningFriday : SNACK_FRUITS.morning;
    assignFruitSnack(day.id, 'morning-snack', morningFruit);
    assignFruitSnack(day.id, 'afternoon-snack', SNACK_FRUITS.afternoon);
    assignFruitSnack(day.id, 'evening-snack', SNACK_FRUITS.evening);
  });
}

export function weekPlanHasAssignments(weekPlan) {
  if (!weekPlan || typeof weekPlan !== 'object') return false;
  return WEEK_DAYS.some((day) => DAY_SLOTS.some((slot) => {
    const meta = weekPlan[day.id]?.meta?.[slot.id];
    if (meta?.savedMealId || meta?.mealName) return true;
    const fruit = weekPlan[day.id]?.selections?.[slot.id]?.fruit;
    return Boolean(fruit?.foodName);
  }));
}

export function plannerStateIsEmpty(saved) {
  if (!saved || typeof saved !== 'object') return true;
  if (Array.isArray(saved.savedMeals) && saved.savedMeals.length > 0) return false;
  if (weekPlanHasAssignments(saved.weekPlan)) return false;
  return true;
}

/** Mutates planner state — call only when meal slots are initialized. */
export function seedDefaultPlannerTemplate() {
  if (!state.mealSlotsById || !Object.keys(state.mealSlotsById).length) return false;

  const savedMeals = buildDefaultSavedMeals();
  state.savedMeals = savedMeals;
  fillDefaultWeekGrid(savedMeals);
  state.activeWeekDay = todayWeekDayId();
  return true;
}

/** Restore saved planner state; seed Power-meal template when empty. */
export function applyPlannerStateWithDefaults(saved, options = {}) {
  applyPlannerState(saved, options);
  if (!plannerStateIsEmpty(saved)) return false;
  return seedDefaultPlannerTemplate();
}
