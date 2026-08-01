/**
 * Default menu planner starter — reactive week from catalog + day-level fruit rotation.
 */

import {
  applyPlannerState,
  state,
  todayWeekDayId,
  WEEK_DAYS,
} from './plannerState.js';
import {
  generateReactiveWeek,
  reactiveWeekHasAssignments,
  sanitizeWeekFruits,
  sanitizeWeekMealLanes,
  SNACK_SLOT_IDS,
} from './mealPlanGenerator.js';

const REACTIVE_PLANNER_UI_VERSION = 3;

function selectionListFromPlan(weekPlan, weekDay, mealSlotId, lane) {
  const raw = weekPlan?.[weekDay]?.selections?.[mealSlotId]?.[lane];
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((item) => item?.foodName);
  if (raw.foodName) return [raw];
  return [];
}

export function weekPlanHasAssignments(weekPlan) {
  if (!weekPlan || typeof weekPlan !== 'object') return false;
  return WEEK_DAYS.some((day) => {
    const hasFruit = SNACK_SLOT_IDS.some((slotId) => weekPlan[day.id]?.selections?.[slotId]?.fruit?.foodName);
    if (hasFruit) return true;
    return ['breakfast', 'lunch', 'dinner'].some((mealSlotId) => (
      ['protein', 'gs', 'vegetable'].some((lane) => selectionListFromPlan(weekPlan, day.id, mealSlotId, lane).length > 0)
    ));
  });
}

/** True when the planner has no week-grid assignments yet. */
export function plannerWorkspaceNeedsStarter() {
  return !reactiveWeekHasAssignments();
}

function needsReactiveMigration(saved) {
  if (!saved || typeof saved !== 'object') return true;
  return !saved.plannerUiVersion || saved.plannerUiVersion < REACTIVE_PLANNER_UI_VERSION;
}

/** Mutates planner state — call only when meal slots are initialized. */
export function seedDefaultPlannerTemplate() {
  if (!state.mealSlotsById || !Object.keys(state.mealSlotsById).length) return false;

  state.savedMeals = [];
  generateReactiveWeek();
  state.activeWeekDay = todayWeekDayId();
  state.plannerUiVersion = REACTIVE_PLANNER_UI_VERSION;
  return true;
}

/** Restore saved planner state; seed generated week when empty (first visit). */
export function applyPlannerStateWithDefaults(saved, options = {}) {
  applyPlannerState(saved, options);
  if (needsReactiveMigration(saved)) {
    return seedDefaultPlannerTemplate();
  }
  sanitizeWeekFruits();
  sanitizeWeekMealLanes();
  if (!plannerWorkspaceNeedsStarter()) return false;
  return seedDefaultPlannerTemplate();
}
