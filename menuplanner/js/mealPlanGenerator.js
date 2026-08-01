/**
 * Reactive meal plan generator — fill week from catalog, swap lanes, learn preferences.
 */

import { canonicalFruitName } from '../data/fruitNames.js';
import {
  FAST_START_FRUIT_NAMES,
  fastStartNameListForLane,
  isFastStartFruit,
  isFastStartLaneFood,
} from '../data/fastStartFoods.js';
import {
  WEEK_DAYS,
  clearDaySlotMeta,
  getSplitGridSelections,
  requiredServings,
  setFatSelections,
  setSplitGridSelections,
  state,
} from './plannerState.js';

export const REACTIVE_MEAL_SLOTS = ['breakfast', 'lunch', 'dinner'];
export const SNACK_SLOT_IDS = ['morning-snack', 'afternoon-snack', 'evening-snack'];

const MEAL_LANES = ['protein', 'gs', 'vegetable'];

const DEFAULT_STARTER_FOODS = {
  protein: 'Chicken breast, no skin',
  gs: 'Rice, basmati',
  vegetable: 'Broccoli, cooked',
};

export function shortFoodName(fullName) {
  if (!fullName) return '';
  const base = String(fullName).split(',')[0].trim();
  return base || fullName;
}

export function createEmptyFoodPreferences() {
  return {
    protein: {},
    gs: {},
    vegetable: {},
    fruit: {},
  };
}

export function ensureFoodPreferences() {
  if (!state.foodPreferences || typeof state.foodPreferences !== 'object') {
    state.foodPreferences = createEmptyFoodPreferences();
  }
  MEAL_LANES.concat(['fruit']).forEach((lane) => {
    if (!state.foodPreferences[lane] || typeof state.foodPreferences[lane] !== 'object') {
      state.foodPreferences[lane] = {};
    }
  });
  return state.foodPreferences;
}

function foodsInCategories(categories) {
  return (state.foods || []).filter((food) => categories.includes(food.category));
}

/** Fast Start pool for a lane — top-ranked bodybuilding staples (~10 max). */
function fastStartCandidates(lane, mealSlotId = null) {
  const names = fastStartNameListForLane(lane, mealSlotId);
  if (!names.length) return [];

  if (lane === 'fruit') {
    const byCanonical = new Map(
      foodsInCategories(['fruit']).map((food) => [canonicalFruitName(food.name), food]),
    );
    return names.map((name) => byCanonical.get(name)).filter(Boolean);
  }

  const byName = new Map((state.foods || []).map((food) => [food.name, food]));
  return names.map((name) => byName.get(name)).filter(Boolean);
}

function scoreFood(foodName, lane, prefs) {
  return prefs[lane]?.[foodName] || 0;
}

function bumpPreference(lane, foodName, delta) {
  if (!foodName) return;
  const prefs = ensureFoodPreferences();
  prefs[lane][foodName] = (prefs[lane][foodName] || 0) + delta;
}

export function recordLaneReject(lane, oldFoodName, newFoodName) {
  if (oldFoodName && oldFoodName !== newFoodName) {
    bumpPreference(lane, oldFoodName, -1);
  }
  if (newFoodName) {
    bumpPreference(lane, newFoodName, 1);
  }
}

export function recordFruitReject(oldFoodName, newFoodName) {
  recordLaneReject('fruit', oldFoodName, newFoodName);
}

function fastStartFallbackName(lane, mealSlotId, blocked) {
  const names = fastStartNameListForLane(lane, mealSlotId);
  return names.find((name) => !blocked.has(name)) || names[0] || DEFAULT_STARTER_FOODS[lane] || null;
}

function pickFoodName(lane, { exclude = [], mealSlotId = null } = {}) {
  const candidates = fastStartCandidates(lane, mealSlotId);
  const prefs = ensureFoodPreferences();
  const blocked = new Set(
    exclude.filter(Boolean).map((name) => (lane === 'fruit' ? canonicalFruitName(name) : name)),
  );
  const pool = candidates.filter((food) => {
    const name = lane === 'fruit' ? canonicalFruitName(food.name) : food.name;
    return !blocked.has(name);
  });
  const list = pool.length ? pool : candidates;
  if (!list.length) {
    return fastStartFallbackName(lane, mealSlotId, blocked);
  }

  const ranked = list
    .map((food) => ({
      name: food.name,
      score: scoreFood(food.name, lane, prefs) + Math.random() * 0.75,
    }))
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.name || list[0].name;
}

export function assignMealLane(weekDay, mealSlotId, lane, foodName) {
  if (!foodName) return;
  const servings = mealLaneServings(mealSlotId, lane);
  if (servings <= 0) {
    setSplitGridSelections(mealSlotId, lane, [], weekDay);
    return;
  }
  setSplitGridSelections(mealSlotId, lane, [{ foodName, servings }], weekDay);
  clearDaySlotMeta(mealSlotId, weekDay);
  setFatSelections(mealSlotId, [], weekDay);
}

export function getMealLaneFood(weekDay, mealSlotId, lane) {
  const items = getSplitGridSelections(mealSlotId, lane, weekDay);
  return items[0]?.foodName || null;
}

export function mealSummaryLabel(weekDay, mealSlotId) {
  const parts = [];
  const protein = getMealLaneFood(weekDay, mealSlotId, 'protein');
  const gs = getMealLaneFood(weekDay, mealSlotId, 'gs');
  const vegetable = getMealLaneFood(weekDay, mealSlotId, 'vegetable');
  if (protein) parts.push(shortFoodName(protein));
  if (gs) parts.push(shortFoodName(gs));
  if (mealLaneHasServings(mealSlotId, 'vegetable') && vegetable) {
    parts.push(shortFoodName(vegetable));
  }
  return parts.join(' + ') || '—';
}

export function swapMealLane(weekDay, mealSlotId, lane) {
  const current = getMealLaneFood(weekDay, mealSlotId, lane);
  const next = pickFoodName(lane, { exclude: [current], mealSlotId });
  if (!next) return current;
  recordLaneReject(lane, current, next);
  assignMealLane(weekDay, mealSlotId, lane, next);
  return next;
}

export function assignDayFruit(weekDay, foodName) {
  if (!foodName) return;
  const canonical = canonicalFruitName(foodName);
  SNACK_SLOT_IDS.forEach((mealSlotId) => {
    setFatSelections(mealSlotId, [], weekDay);
    clearDaySlotMeta(mealSlotId, weekDay);
    setSplitGridSelections(mealSlotId, 'protein', [], weekDay);
    setSplitGridSelections(mealSlotId, 'gs', [], weekDay);
    setSplitGridSelections(mealSlotId, 'vegetable', [], weekDay);
    state.weekPlan[weekDay].selections[mealSlotId].fruit = {
      foodName: canonical,
      servings: requiredServings(mealSlotId, 'fruit'),
    };
  });
}

export function getDayFruitName(weekDay) {
  const fruit = state.weekPlan[weekDay]?.selections?.[SNACK_SLOT_IDS[0]]?.fruit;
  return fruit?.foodName ? canonicalFruitName(fruit.foodName) : null;
}

export function dayFruitSummaryLabel(weekDay) {
  const name = getDayFruitName(weekDay);
  if (!name) return '—';
  return `${shortFoodName(name)} × 3`;
}

export function swapDayFruit(weekDay) {
  const current = getDayFruitName(weekDay);
  const exclude = current ? [current] : [];
  const next = pickFoodName('fruit', { exclude });
  if (!next) return current;
  recordFruitReject(current, next);
  assignDayFruit(weekDay, next);
  return next;
}

/** Replace saved foods outside the Fast Start lists on load. */
export function sanitizeWeekPlan() {
  WEEK_DAYS.forEach((day, index) => {
    const fruit = getDayFruitName(day.id);
    if (fruit && !isFastStartFruit(fruit)) {
      const fruitName = FAST_START_FRUIT_NAMES[index % FAST_START_FRUIT_NAMES.length]
        || FAST_START_FRUIT_NAMES[0];
      assignDayFruit(day.id, fruitName);
    }

    REACTIVE_MEAL_SLOTS.forEach((mealSlotId) => {
      MEAL_LANES.forEach((lane) => {
        if (!mealLaneHasServings(mealSlotId, lane)) return;
        const current = getMealLaneFood(day.id, mealSlotId, lane);
        if (current && !isFastStartLaneFood(lane, current, mealSlotId)) {
          assignMealLane(day.id, mealSlotId, lane, pickFoodName(lane, { mealSlotId }));
        }
      });
    });
  });
}

function fillMealSlot(weekDay, mealSlotId) {
  MEAL_LANES.forEach((lane) => {
    if (mealLaneServings(mealSlotId, lane) <= 0) {
      setSplitGridSelections(mealSlotId, lane, [], weekDay);
      return;
    }
    assignMealLane(weekDay, mealSlotId, lane, pickFoodName(lane, { mealSlotId }));
  });
}

export function generateReactiveWeek() {
  ensureFoodPreferences();
  WEEK_DAYS.forEach((day, index) => {
    REACTIVE_MEAL_SLOTS.forEach((mealSlotId) => {
      fillMealSlot(day.id, mealSlotId);
    });
    const fruitName = FAST_START_FRUIT_NAMES[index % FAST_START_FRUIT_NAMES.length] || FAST_START_FRUIT_NAMES[0];
    assignDayFruit(day.id, fruitName);
  });
}

export function reactiveWeekHasAssignments() {
  return WEEK_DAYS.some((day) => {
    if (getDayFruitName(day.id)) return true;
    return REACTIVE_MEAL_SLOTS.some((mealSlotId) => (
      MEAL_LANES.some((lane) => getSplitGridSelections(mealSlotId, lane, day.id).length > 0)
    ));
  });
}

export function mealLaneServings(mealSlotId, lane) {
  const slot = state.mealSlotsById[mealSlotId];
  if (!slot) return 0;
  if (lane === 'protein') return Number(slot.proteinServings) || 0;
  if (lane === 'gs') return Number(slot.grainStarchServings) || 0;
  if (lane === 'vegetable') return Number(slot.vegetableServings) || 0;
  return 0;
}

export function mealLaneHasServings(mealSlotId, lane) {
  return mealLaneServings(mealSlotId, lane) > 0;
}
