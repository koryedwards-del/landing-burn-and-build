/**
 * Default menu planner starter — meal and food choices from the 7/15/26 reference plan.
 * Serving amounts always scale to the current user's program (requiredServings per slot).
 */

import {
  WEEK_DAYS,
  DAY_SLOTS,
  applyPlannerState,
  applySavedMealItemsToMakerDraft,
  applySavedMealToGridCell,
  categorySelections,
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
    applySavedMealToGridCell(day.id, 'breakfast', byId['power-breakfast']);
    applySavedMealToGridCell(day.id, 'lunch', byId['power-lunch']);
    applySavedMealToGridCell(day.id, 'dinner', byId['power-dinner-salad']);

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

/** True when the planner has no saved meals and no week-grid assignments yet. */
export function plannerWorkspaceNeedsStarter() {
  if (Array.isArray(state.savedMeals) && state.savedMeals.length > 0) return false;
  return !weekPlanHasAssignments(state.weekPlan);
}

/** Mutates planner state — call only when meal slots are initialized. */
export function seedDefaultPlannerTemplate() {
  if (!state.mealSlotsById || !Object.keys(state.mealSlotsById).length) return false;

  const savedMeals = buildDefaultSavedMeals();
  state.savedMeals = savedMeals;
  fillDefaultWeekGrid(savedMeals);
  state.activeWeekDay = todayWeekDayId();

  const sampleMeal = savedMeals.find((meal) => meal.id === 'power-breakfast');
  if (sampleMeal) {
    applySavedMealItemsToMakerDraft(sampleMeal);
    state.activeMakerSlot = 'protein';
  }

  return true;
}

/** Restore saved planner state; seed sample week when empty (first visit). */
export function applyPlannerStateWithDefaults(saved, options = {}) {
  applyPlannerState(saved, options);
  if (!plannerWorkspaceNeedsStarter()) return false;
  return seedDefaultPlannerTemplate();
}
