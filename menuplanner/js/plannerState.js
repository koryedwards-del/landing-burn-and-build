import { canonicalFruitName } from '../data/fruitNames.js';
import { generateMealSlots } from '../../js/burnEngine.js';
import {
  attachPlannerStateToPackage,
  flushProgramPersist,
  scheduleProgramPersist,
} from '../../js/menuPlannerState.js';
import { setActiveProgramId } from '../../js/programActive.js';

const SLOT_LABEL_TO_ID = {
  Breakfast: 'breakfast',
  'Morning Snack': 'morning-snack',
  Lunch: 'lunch',
  'Afternoon Snack': 'afternoon-snack',
  Dinner: 'dinner',
  'Evening Snack': 'evening-snack',
};

const FOOD_CATEGORIES = [
  { id: 'protein', label: 'Protein' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'grain', label: 'Grains' },
  { id: 'starch', label: 'Starches' },
  { id: 'vegetable', label: 'Vegetables' },
  { id: 'fruit', label: 'Fruit' },
  { id: 'fat', label: 'Fats' },
  { id: 'sugar', label: 'Sugar' },
  { id: 'alcohol', label: 'Alcohol' },
];

const SLOT_META = {
  protein: { label: 'Protein', categories: ['protein', 'dairy'] },
  gs: { label: 'Grains/Starches', categories: ['grain', 'starch'] },
  vegetable: { label: 'Veggie', categories: ['vegetable'], optional: true },
  fat: { label: 'Fat Points', categories: ['fat', 'sugar', 'alcohol'], optional: true },
  fruit: { label: 'Fruit', categories: ['fruit'] },
};

const FAT_LANE_SLOT_LABELS = {
  fat: 'Fat',
  sugar: 'Sugar',
  alcohol: 'Alcohol',
};

const DAY_SLOTS = [
  { id: 'breakfast', label: 'Breakfast', template: 'meal' },
  { id: 'morning-snack', label: 'Morning Snack', template: 'snack' },
  { id: 'lunch', label: 'Lunch', template: 'meal' },
  { id: 'afternoon-snack', label: 'Afternoon Snack', template: 'snack' },
  { id: 'dinner', label: 'Dinner', template: 'meal' },
  { id: 'evening-snack', label: 'Evening Snack', template: 'snack' },
];

const TEMPLATE_SLOTS = {
  meal: ['protein', 'gs', 'vegetable', 'fat'],
  snack: ['fruit'],
};

const MEAL_MAKER_SLOTS = ['protein', 'gs', 'vegetable'];
const MEAL_REFERENCE_SLOT = 'breakfast';


const FOODS_DATA_VERSION = '2';

const WEEK_DAYS = [
  { id: 'sun', label: 'Sun', fullLabel: 'Sunday' },
  { id: 'mon', label: 'Mon', fullLabel: 'Monday' },
  { id: 'tue', label: 'Tue', fullLabel: 'Tuesday' },
  { id: 'wed', label: 'Wed', fullLabel: 'Wednesday' },
  { id: 'thu', label: 'Thu', fullLabel: 'Thursday' },
  { id: 'fri', label: 'Fri', fullLabel: 'Friday' },
  { id: 'sat', label: 'Sat', fullLabel: 'Saturday' },
];

const WEEK_GRID_MEALS = DAY_SLOTS.map((slot) => slot.id);

const WEEK_MEAL_EMPTY_LABEL = {
  breakfast: 'Breakfast —',
  lunch: 'Lunch —',
  dinner: 'Dinner —',
  'morning-snack': 'Snack',
  'afternoon-snack': 'Snack',
  'evening-snack': 'Snack',
};


function createEmptyMealMakerDraft() {
  return {
    protein: [],
    gs: [],
    vegetable: [],
    fat: [],
  };
}

function normalizeSelectionList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((item) => item?.foodName);
  if (value.foodName) return [value];
  return [];
}

function isSplitServingsMakerSlot(categorySlot) {
  return categorySlot === 'protein' || categorySlot === 'gs' || categorySlot === 'vegetable';
}

function createEmptyDayState() {
  const selections = {};
  const meta = {};
  DAY_SLOTS.forEach((daySlot) => {
    selections[daySlot.id] = {};
    meta[daySlot.id] = { mealName: null, savedMealId: null };
    templateSlots(daySlot.template).forEach((slot) => {
      selections[daySlot.id][slot] = null;
    });
  });
  return { selections, meta };
}

function createFreshWeekPlan() {
  const plan = {};
  WEEK_DAYS.forEach((day) => {
    plan[day.id] = createEmptyDayState();
  });
  return plan;
}

function ensureWeekPlanShape(plan = state.weekPlan) {
  WEEK_DAYS.forEach((day) => {
    if (!plan[day.id]) {
      plan[day.id] = createEmptyDayState();
      return;
    }
    DAY_SLOTS.forEach((daySlot) => {
      if (!plan[day.id].selections[daySlot.id]) {
        plan[day.id].selections[daySlot.id] = {};
      }
      if (!plan[day.id].meta[daySlot.id]) {
        plan[day.id].meta[daySlot.id] = { mealName: null, savedMealId: null };
      }
      templateSlots(daySlot.template).forEach((slot) => {
        if (!(slot in plan[day.id].selections[daySlot.id])) {
          plan[day.id].selections[daySlot.id][slot] = null;
        }
        if (isSplitServingsMakerSlot(slot)) {
          const normalized = normalizeSelectionList(plan[day.id].selections[daySlot.id][slot]);
          plan[day.id].selections[daySlot.id][slot] = normalized.length ? normalized : null;
        }
      });
    });
  });
}

function resetPlannerState() {
  state.weekPlan = createFreshWeekPlan();
  state.savedMeals = [];
  state.activeWeekDay = todayWeekDayId();
  state.mealMakerDraft = createEmptyMealMakerDraft();
  state.makerSourceMealId = null;
  state.activeMakerSlot = null;
  state.activeFoodCategory = null;
  state.weekGridCollapsed = false;
  state.foodPreferences = null;
  state.enableSplitServings = false;
  state.plannerUiVersion = 3;
}

function cloneSavedMeals(meals = []) {
  return meals.map((meal) => ({
    ...meal,
    items: Array.isArray(meal.items) ? meal.items.map((item) => ({ ...item })) : [],
  }));
}

function migrateFoodName(name) {
  return canonicalFruitName(name);
}

function migrateSelectionFoodName(selection) {
  if (!selection || typeof selection !== 'object') return selection;
  if (Array.isArray(selection)) {
    return selection.map((item) => migrateSelectionFoodName(item));
  }
  if (selection.foodName) {
    return { ...selection, foodName: migrateFoodName(selection.foodName) };
  }
  return selection;
}

function migratePlannerFoodNames() {
  WEEK_DAYS.forEach((day) => {
    DAY_SLOTS.forEach((daySlot) => {
      const selections = state.weekPlan[day.id]?.selections?.[daySlot.id];
      if (!selections) return;
      Object.keys(selections).forEach((slotKey) => {
        selections[slotKey] = migrateSelectionFoodName(selections[slotKey]);
      });
    });
  });

  state.savedMeals.forEach((meal) => {
    if (!Array.isArray(meal.items)) return;
    meal.items = meal.items.map((item) => ({
      ...item,
      foodName: migrateFoodName(item.foodName),
    }));
  });

  ['protein', 'gs', 'vegetable', 'fat'].forEach((slot) => {
    state.mealMakerDraft[slot] = migrateSelectionFoodName(state.mealMakerDraft[slot]);
  });
}

function collectPlannerState() {
  return {
    version: 2,
    activeWeekDay: state.activeWeekDay,
    weekPlan: state.weekPlan,
    savedMeals: cloneSavedMeals(state.savedMeals),
    weekGridCollapsed: state.weekGridCollapsed,
    mealMakerDraft: state.mealMakerDraft,
    activeMakerSlot: state.activeMakerSlot,
    plannerEngagementMode: state.plannerEngagementMode,
    foodPreferences: state.foodPreferences,
    enableSplitServings: state.enableSplitServings === true,
    plannerUiVersion: state.plannerUiVersion || 3,
  };
}

function restoreSessionGridUi(sessionUi) {
  if (!sessionUi) return;
  if (sessionUi.activeWeekDay && WEEK_DAYS.some((day) => day.id === sessionUi.activeWeekDay)) {
    state.activeWeekDay = sessionUi.activeWeekDay;
  }
}

function applyPlannerState(saved, { preserveSessionUi = false } = {}) {
  const sessionUi = preserveSessionUi
    ? { activeWeekDay: state.activeWeekDay }
    : null;
  resetPlannerState();
  if (saved && typeof saved === 'object') {
    if (saved.weekPlan && typeof saved.weekPlan === 'object') {
      state.weekPlan = saved.weekPlan;
      ensureWeekPlanShape();
    }
    if (Array.isArray(saved.savedMeals)) {
      state.savedMeals = cloneSavedMeals(saved.savedMeals);
      dedupeSavedMeals();
    }
    if (saved.activeWeekDay && WEEK_DAYS.some((day) => day.id === saved.activeWeekDay)) {
      state.activeWeekDay = saved.activeWeekDay;
    }
    if (saved.weekGridCollapsed === true) {
      state.weekGridCollapsed = true;
    }
    if (saved.mealMakerDraft && typeof saved.mealMakerDraft === 'object') {
      state.mealMakerDraft = {
        ...createEmptyMealMakerDraft(),
        ...saved.mealMakerDraft,
        protein: normalizeSelectionList(saved.mealMakerDraft.protein),
        gs: normalizeSelectionList(saved.mealMakerDraft.gs),
        vegetable: normalizeSelectionList(saved.mealMakerDraft.vegetable),
        fat: Array.isArray(saved.mealMakerDraft.fat) ? saved.mealMakerDraft.fat : [],
      };
      normalizeMealMakerDraft();
    }
    if (saved.activeMakerSlot && MEAL_MAKER_SLOTS.includes(saved.activeMakerSlot)) {
      state.activeMakerSlot = saved.activeMakerSlot;
    }
    if (saved.plannerEngagementMode === 'fast-start' || saved.plannerEngagementMode === 'diy') {
      state.plannerEngagementMode = 'fast-start';
    }
    if (saved.foodPreferences && typeof saved.foodPreferences === 'object') {
      state.foodPreferences = saved.foodPreferences;
    }
    state.enableSplitServings = saved.enableSplitServings === true;
    if (saved.plannerUiVersion) {
      state.plannerUiVersion = saved.plannerUiVersion;
    }
    migratePlannerFoodNames();
  }
  restoreSessionGridUi(sessionUi);
}

function persistPlannerToProgram({ immediate = false } = {}) {
  if (!state.programPackage?.program?.id) return;
  state.programPackage = attachPlannerStateToPackage(state.programPackage, collectPlannerState());
  if (typeof window.__bnbSyncProgramPackage === 'function') {
    window.__bnbSyncProgramPackage(state.programPackage);
  }
  if (immediate) {
    flushProgramPersist(state.programPackage).catch((err) => console.error(err));
    return;
  }
  scheduleProgramPersist(state.programPackage);
}

function todayWeekDayId() {
  return WEEK_DAYS[new Date().getDay()].id;
}


function categorySelections(mealSlotId, weekDay = state.activeWeekDay) {
  return state.weekPlan[weekDay].selections[mealSlotId];
}

function mealSlotMeta(mealSlotId, weekDay = state.activeWeekDay) {
  return state.weekPlan[weekDay].meta[mealSlotId];
}

function templateSlots(template) {
  return TEMPLATE_SLOTS[template];
}

function initMealSlotsFromProgram(pkg) {
  state.mealSlotsById = {};
  if (!pkg?.plan) return;

  let slots = pkg.plan.mealSlots;
  if (!Array.isArray(slots) || !slots.length) {
    const servings = pkg.plan.servings;
    const wake = pkg.intake?.wakeTime || pkg.intake?.defaultWakeTime || '06:00';
    if (!servings) return;
    const [wh, wm] = wake.split(':').map(Number);
    slots = generateMealSlots(wh, wm, servings);
    pkg.plan.mealSlots = slots;
  }

  slots.forEach((slot) => {
    const id = SLOT_LABEL_TO_ID[slot.label];
    if (id) state.mealSlotsById[id] = slot;
  });
}

function fmtServings(n) {
  const value = Number(n);
  if (!Number.isFinite(value)) return '0';
  if (Math.abs(value - Math.round(value)) < 0.05) return String(Math.round(value));
  return value.toFixed(1);
}

function requiredServings(daySlotId, categorySlot) {
  const slot = state.mealSlotsById[daySlotId];
  if (!slot) return 1;
  switch (categorySlot) {
    case 'protein':
      return slot.proteinServings || 1;
    case 'gs':
      return slot.grainStarchServings || 1;
    case 'vegetable':
      return slot.vegetableServings || 1;
    case 'fruit':
      return slot.fruitServings || 1;
    default:
      return 1;
  }
}

function servingHint(daySlotId, categorySlot) {
  const required = requiredServings(daySlotId, categorySlot);
  if (!state.programPackage) return 'Tap or drag food';
  if (required <= 0 && SLOT_META[categorySlot]?.optional) return 'Optional';
  return `${fmtServings(required)} serving${Math.abs(required - 1) < 0.05 ? '' : 's'}`;
}

function savedMealById(id) {
  return state.savedMeals.find((meal) => meal.id === id);
}

/** User-facing food list / picker — counts and servings only (no gram weights). */
function scaledLabel(food, servings) {
  if (food.name === 'Eggs') {
    if (servings === 1) return '2 whites/1 yolk';
    return `${fmtServings(servings)} × 2 whites/1 yolk`;
  }
  if (food.unitsPerServing > 0) {
    const count = Math.ceil(food.unitsPerServing * servings);
    return `${count} ${food.servingDescription}`;
  }
  if (food.servingDescription && !food.gramWeight) {
    if (servings === 1) return food.servingDescription;
    return `${fmtServings(servings)} × ${food.servingDescription}`;
  }
  if (servings === 1) return '1 serving';
  return `${fmtServings(servings)} servings`;
}

/** Weekly meal plan PDF — gram weights where applicable. */
function gramWeightLabel(food, servings) {
  if (food.name === 'Eggs') {
    if (servings === 1) return '2 whites/1 yolk';
    return `${fmtServings(servings)} × 2 whites/1 yolk`;
  }
  if (food.unitsPerServing > 0) {
    const count = Math.ceil(food.unitsPerServing * servings);
    return `${count} ${food.servingDescription}`;
  }
  if (!food.gramWeight && food.servingDescription) {
    if (servings === 1) return food.servingDescription;
    return `${servings} × ${food.servingDescription}`;
  }
  if (food.gramWeight > 0) {
    return `${Math.round(food.gramWeight * servings)} g`;
  }
  if (servings === 1) return '1 serving';
  return `${fmtServings(servings)} servings`;
}

function servingAmountLabel(food, servings) {
  const count = Number(servings);
  if (!food || !Number.isFinite(count)) return '';
  return `${fmtServings(count)} × ${scaledLabel(food, 1)} = ${scaledLabel(food, count)}`;
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slotFoodCategories() {
  if (!state.activeMakerSlot) return ['fruit'];
  return SLOT_META[state.activeMakerSlot].categories;
}

function ensureActiveFoodCategory() {
  const categories = slotFoodCategories();
  if (!categories.length) {
    state.activeFoodCategory = null;
    return;
  }
  if (categories.length === 1) {
    state.activeFoodCategory = categories[0];
    return;
  }
  if (!state.activeFoodCategory || !categories.includes(state.activeFoodCategory)) {
    state.activeFoodCategory = categories[0];
  }
}

function isCategorySlotActive(categorySlot) {
  return state.activeMakerSlot === categorySlot;
}

function makerRequiredServings(categorySlot) {
  return requiredServings(MEAL_REFERENCE_SLOT, categorySlot);
}

function makerServingHint(categorySlot) {
  const required = makerRequiredServings(categorySlot);
  if (!state.programPackage) return 'Tap or drag food';
  if (required <= 0 && SLOT_META[categorySlot]?.optional) return 'Optional';
  return `${fmtServings(required)} serving${Math.abs(required - 1) < 0.05 ? '' : 's'}`;
}

function getMakerFatSelections() {
  return state.mealMakerDraft.fat || [];
}

function setMakerFatSelections(items) {
  state.mealMakerDraft.fat = items.length ? items : [];
}

function normalizeMealMakerDraft(draft = state.mealMakerDraft) {
  if (!draft || typeof draft !== 'object') return;
  draft.protein = normalizeSelectionList(draft.protein);
  draft.gs = normalizeSelectionList(draft.gs);
  draft.vegetable = normalizeSelectionList(draft.vegetable);
  if (!Array.isArray(draft.fat)) draft.fat = [];
}

function getMakerSplitSelections(categorySlot) {
  if (categorySlot === 'protein') return normalizeSelectionList(state.mealMakerDraft.protein);
  if (categorySlot === 'gs') return normalizeSelectionList(state.mealMakerDraft.gs);
  if (categorySlot === 'vegetable') return normalizeSelectionList(state.mealMakerDraft.vegetable);
  return [];
}

function setMakerSplitSelections(categorySlot, items) {
  if (categorySlot === 'protein') {
    state.mealMakerDraft.protein = items;
    return;
  }
  if (categorySlot === 'gs') {
    state.mealMakerDraft.gs = items;
    return;
  }
  if (categorySlot === 'vegetable') {
    state.mealMakerDraft.vegetable = items;
  }
}

function rebalanceMakerSplitServings(categorySlot, items) {
  const total = makerRequiredServings(categorySlot);
  if (!items.length) return [];
  const each = total / items.length;
  return items.map((item) => ({
    foodName: item.foodName,
    servings: each,
  }));
}

function addMakerSplitFood(categorySlot, foodName) {
  const items = rebalanceMakerSplitServings(categorySlot, [
    ...getMakerSplitSelections(categorySlot),
    { foodName, servings: 0 },
  ]);
  setMakerSplitSelections(categorySlot, items);
}

function removeMakerSplitFood(categorySlot, index) {
  const items = getMakerSplitSelections(categorySlot);
  items.splice(index, 1);
  setMakerSplitSelections(categorySlot, rebalanceMakerSplitServings(categorySlot, items));
}

function getSplitGridSelections(mealSlotId, categorySlot, weekDay = state.activeWeekDay) {
  const raw = categorySelections(mealSlotId, weekDay)[categorySlot];
  return normalizeSelectionList(raw);
}

function setSplitGridSelections(mealSlotId, categorySlot, items, weekDay = state.activeWeekDay) {
  categorySelections(mealSlotId, weekDay)[categorySlot] = items.length ? items : null;
}

function clearMealMakerDraft() {
  state.mealMakerDraft = createEmptyMealMakerDraft();
  state.makerSourceMealId = null;
}

function applySavedMealItemsToMakerDraft(meal) {
  if (!meal?.items?.length) return false;

  clearMealMakerDraft();
  const proteinItems = [];
  const gsItems = [];
  const vegetableItems = [];
  const fatItems = [];

  meal.items.forEach((item) => {
    const slotKey = SAVED_MEAL_SLOT_LABELS[item.slot];
    const entry = {
      foodName: item.foodName,
      servings: item.servings,
    };
    if (slotKey === 'fat') fatItems.push(entry);
    else if (slotKey === 'gs') gsItems.push(entry);
    else if (slotKey === 'vegetable') vegetableItems.push(entry);
    else if (slotKey === 'protein') proteinItems.push(entry);
  });

  setMakerSplitSelections('protein', proteinItems);
  setMakerSplitSelections('gs', gsItems);
  setMakerSplitSelections('vegetable', vegetableItems);
  setMakerFatSelections(fatItems);
  state.makerSourceMealId = meal.id;
  return true;
}

function isMealMakerSaveable() {
  return MEAL_MAKER_SLOTS.every((slotKey) => {
    if (SLOT_META[slotKey]?.optional) return true;
    if (isFatSlot(slotKey)) return true;
    if (isSplitServingsMakerSlot(slotKey)) {
      return getMakerSplitSelections(slotKey).length > 0;
    }
    return state.mealMakerDraft[slotKey] != null;
  });
}

function mealMakerToItems() {
  return MEAL_MAKER_SLOTS.flatMap((slotKey) => {
    if (isFatSlot(slotKey)) {
      return getMakerFatSelections().map((selected) => ({
        slot: itemSlotLabel(slotKey, selected.foodName),
        foodName: selected.foodName,
        servings: selected.servings,
      }));
    }
    if (isSplitServingsMakerSlot(slotKey)) {
      return getMakerSplitSelections(slotKey).map((selected) => ({
        slot: itemSlotLabel(slotKey, selected.foodName),
        foodName: selected.foodName,
        servings: selected.servings,
      }));
    }
    const selected = state.mealMakerDraft[slotKey];
    if (!selected) return [];
    return [{
      slot: itemSlotLabel(slotKey, selected.foodName),
      foodName: selected.foodName,
      servings: selected.servings,
    }];
  });
}

function isMealMealSlot(mealSlotId) {
  const daySlot = DAY_SLOTS.find((item) => item.id === mealSlotId);
  return daySlot?.template === 'meal';
}

function isFatSlot(categorySlot) {
  return categorySlot === 'fat';
}

function getFatSelections(mealSlotId, weekDay = state.activeWeekDay) {
  const fat = categorySelections(mealSlotId, weekDay)?.fat;
  if (!fat) return [];
  return Array.isArray(fat) ? fat : [fat];
}

function setFatSelections(mealSlotId, items, weekDay = state.activeWeekDay) {
  categorySelections(mealSlotId, weekDay).fat = items.length ? items : null;
}

function isFruitOnlySnack(mealSlotId, weekDay = state.activeWeekDay) {
  const daySlot = DAY_SLOTS.find((item) => item.id === mealSlotId);
  if (daySlot.template !== 'snack') return false;
  const selections = categorySelections(mealSlotId, weekDay);
  return selections.fruit != null && getFatSelections(mealSlotId, weekDay).length === 0;
}

function acceptsSavedMealDrop(mealSlotId) {
  return isMealMealSlot(mealSlotId);
}

/** Grid shows a meal idea label or saved-meal name. */
function isAssignedMeal(mealSlotId, weekDay = state.activeWeekDay) {
  const meta = mealSlotMeta(mealSlotId, weekDay);
  return !!(meta.savedMealId && meta.mealName);
}

function isSnackMealSlot(mealSlotId) {
  const daySlot = DAY_SLOTS.find((item) => item.id === mealSlotId);
  return daySlot?.template === 'snack';
}

/** Grid shows saved meal name or quick-assigned snack fruit. */
function gridCellHasAssignment(mealSlotId, weekDay = state.activeWeekDay) {
  if (isAssignedMeal(mealSlotId, weekDay)) return true;
  return isFruitOnlySnack(mealSlotId, weekDay);
}

const SAVED_MEAL_SLOT_LABELS = {
  Protein: 'protein',
  'Grains/Starches': 'gs',
  'G / S': 'gs',
  Veggie: 'vegetable',
  'Extra Fat': 'fat',
  Sugar: 'fat',
  Alcohol: 'fat',
  Fruit: 'fruit',
};

/** Scale saved-meal foods to this slot's required servings (user's plan drives amounts). */
function mealItemsScaledToSlot(meal, mealSlotId) {
  if (!meal?.items?.length) return [];

  const groups = { protein: [], gs: [], vegetable: [], fat: [] };
  meal.items.forEach((item) => {
    const slotKey = SAVED_MEAL_SLOT_LABELS[item.slot];
    if (slotKey === 'fat') {
      groups.fat.push({ ...item });
      return;
    }
    if (slotKey && isSplitServingsMakerSlot(slotKey)) {
      groups[slotKey].push({ slot: item.slot, foodName: item.foodName });
    }
  });

  const scaled = [];
  for (const slotKey of ['protein', 'gs', 'vegetable']) {
    const items = groups[slotKey];
    if (!items.length) continue;
    const total = requiredServings(mealSlotId, slotKey);
    if (total <= 0) continue;
    const each = total / items.length;
    items.forEach((item) => {
      scaled.push({ slot: item.slot, foodName: item.foodName, servings: each });
    });
  }
  groups.fat.forEach((item) => scaled.push({ ...item }));
  return scaled;
}

function applyLibraryRecipeToGridCell(weekDay, mealSlotId, recipe) {
  if (!isMealMealSlot(mealSlotId) || !recipe?.id || !recipe?.name) return;

  if (recipe.items?.length) {
    MEAL_MAKER_SLOTS.forEach((slotKey) => {
      categorySelections(mealSlotId, weekDay)[slotKey] = null;
    });
    setFatSelections(mealSlotId, [], weekDay);

    const proteinItems = [];
    const gsItems = [];
    const vegetableItems = [];

    mealItemsScaledToSlot(recipe, mealSlotId).forEach((item) => {
      const slotKey = SAVED_MEAL_SLOT_LABELS[item.slot];
      const entry = { foodName: item.foodName, servings: item.servings };
      if (slotKey === 'gs') gsItems.push(entry);
      else if (slotKey === 'vegetable') vegetableItems.push(entry);
      else if (slotKey === 'protein') proteinItems.push(entry);
    });

    setSplitGridSelections(mealSlotId, 'protein', proteinItems, weekDay);
    setSplitGridSelections(mealSlotId, 'gs', gsItems, weekDay);
    setSplitGridSelections(mealSlotId, 'vegetable', vegetableItems, weekDay);
  }

  mealSlotMeta(mealSlotId, weekDay).mealName = recipe.name;
  mealSlotMeta(mealSlotId, weekDay).savedMealId = recipe.id;
}

function applySavedMealToGridCell(weekDay, mealSlotId, meal) {
  if (!isMealMealSlot(mealSlotId) || !meal?.items?.length) return;

  MEAL_MAKER_SLOTS.forEach((slotKey) => {
    categorySelections(mealSlotId, weekDay)[slotKey] = null;
  });
  setFatSelections(mealSlotId, [], weekDay);

  const proteinItems = [];
  const gsItems = [];
  const vegetableItems = [];
  const fatItems = [];

  mealItemsScaledToSlot(meal, mealSlotId).forEach((item) => {
    const slotKey = SAVED_MEAL_SLOT_LABELS[item.slot];
    const entry = { foodName: item.foodName, servings: item.servings };
    if (slotKey === 'fat') fatItems.push(entry);
    else if (slotKey === 'gs') gsItems.push(entry);
    else if (slotKey === 'vegetable') vegetableItems.push(entry);
    else if (slotKey === 'protein') proteinItems.push(entry);
  });

  setSplitGridSelections(mealSlotId, 'protein', proteinItems, weekDay);
  setSplitGridSelections(mealSlotId, 'gs', gsItems, weekDay);
  setSplitGridSelections(mealSlotId, 'vegetable', vegetableItems, weekDay);
  setFatSelections(mealSlotId, fatItems, weekDay);
  mealSlotMeta(mealSlotId, weekDay).mealName = meal.name;
  mealSlotMeta(mealSlotId, weekDay).savedMealId = meal.id;
}

function savedMealSlotKeys(meal) {
  const keys = new Set();
  meal.items.forEach((item) => {
    const slotKey = SAVED_MEAL_SLOT_LABELS[item.slot];
    if (slotKey) keys.add(slotKey);
  });
  return keys;
}

/** Saved meal must cover every required category for the target meal slot. */
function savedMealFitsMealSlot(meal, mealSlotId) {
  if (!isMealMealSlot(mealSlotId) || !meal?.items?.length) return false;
  const filled = savedMealSlotKeys(meal);
  return MEAL_MAKER_SLOTS.every((slotKey) => {
    if (SLOT_META[slotKey]?.optional) return true;
    if (isFatSlot(slotKey)) return true;
    return filled.has(slotKey);
  });
}

function clearDaySlotMeta(mealSlotId, weekDay = state.activeWeekDay) {
  mealSlotMeta(mealSlotId, weekDay).mealName = null;
  mealSlotMeta(mealSlotId, weekDay).savedMealId = null;
}

function itemSlotLabel(categorySlot, foodName) {
  if (categorySlot !== 'fat') return SLOT_META[categorySlot].label;
  const food = state.foods.find((item) => item.name === foodName);
  return FAT_LANE_SLOT_LABELS[food?.category] || SLOT_META.fat.label;
}

function mealIdFromName(name) {
  let base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'meal';
  let id = base;
  let suffix = 2;
  while (state.savedMeals.some((meal) => meal.id === id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }
  return id;
}

function normalizedMealName(name) {
  return String(name || '').trim().toLowerCase();
}

function findSavedMealByName(name) {
  const key = normalizedMealName(name);
  if (!key) return null;
  return state.savedMeals.find((meal) => normalizedMealName(meal.name) === key) || null;
}

/** One library entry per meal name; remap grid slots from removed duplicates. */
function dedupeSavedMeals() {
  if (!Array.isArray(state.savedMeals) || state.savedMeals.length < 2) return;

  const keptByName = new Map();
  const idRemap = new Map();

  state.savedMeals.forEach((meal) => {
    const key = normalizedMealName(meal.name);
    if (!key) return;
    const kept = keptByName.get(key);
    if (!kept) {
      keptByName.set(key, meal);
      return;
    }
    idRemap.set(meal.id, kept.id);
    kept.pickCount = Math.max(kept.pickCount || 0, meal.pickCount || 0);
    if ((meal.items?.length || 0) > (kept.items?.length || 0)) {
      kept.items = meal.items;
    }
  });

  state.savedMeals = [...keptByName.values()];

  if (!idRemap.size) return;

  WEEK_DAYS.forEach((day) => {
    DAY_SLOTS.forEach((daySlot) => {
      const meta = mealSlotMeta(daySlot.id, day.id);
      const mapped = idRemap.get(meta.savedMealId);
      if (mapped) meta.savedMealId = mapped;
    });
  });
}

function iterWeekFoodSelections(callback) {
  WEEK_DAYS.forEach((day) => {
    DAY_SLOTS.forEach((mealSlot) => {
      templateSlots(mealSlot.template).forEach((categorySlot) => {
        if (isFatSlot(categorySlot)) {
          getFatSelections(mealSlot.id, day.id).forEach((item) => {
            callback({
              weekDay: day.id,
              mealSlotId: mealSlot.id,
              foodName: item.foodName,
              servings: item.servings,
            });
          });
          return;
        }
        if (isSplitServingsMakerSlot(categorySlot)) {
          getSplitGridSelections(mealSlot.id, categorySlot, day.id).forEach((item) => {
            callback({
              weekDay: day.id,
              mealSlotId: mealSlot.id,
              foodName: item.foodName,
              servings: item.servings,
            });
          });
          return;
        }
        const selected = categorySelections(mealSlot.id, day.id)[categorySlot];
        if (selected) {
          callback({
            weekDay: day.id,
            mealSlotId: mealSlot.id,
            foodName: selected.foodName,
            servings: selected.servings,
          });
        }
      });
    });
  });
}

function foodAmountLabel(food, servings) {
  if (!food) return `${servings} servings`;
  const isCountBased = (food.unitsPerServing || 0) > 0;
  if (food.gramWeight || isCountBased) {
    return formatGroceryQuantity({
      foodName: food.name,
      weeklyGrams: (food.gramWeight || 0) * servings,
      weeklyUnits: isCountBased ? food.unitsPerServing * servings : 0,
      isCountBased,
    });
  }
  if (food.servingDescription) {
    if (servings === 1) return food.servingDescription;
    return `${servings} × ${food.servingDescription}`;
  }
  return `${servings} servings`;
}

function buildShoppingTotals() {
  const totals = new Map();
  iterWeekFoodSelections(({ foodName, servings }) => {
    totals.set(foodName, (totals.get(foodName) || 0) + servings);
  });
  return totals;
}

export const state = {
  savedMeals: [],
  weekGridCollapsed: false,
  foods: [],
  programPackage: null,
  mealSlotsById: {},
  mealMakerDraft: createEmptyMealMakerDraft(),
  makerSourceMealId: null,
  activeMakerSlot: null,
  activeFoodCategory: null,
  foodSearchQuery: '',
  weekPlan: {},
  activeWeekDay: null,
  activeGridTarget: null,
  mealSuggestionSorter: 'all',
  /** Always `fast-start` — DIY mode disabled. */
  plannerEngagementMode: 'fast-start',
  foodPreferences: null,
  enableSplitServings: false,
  plannerUiVersion: 3,
};

state.weekPlan = createFreshWeekPlan();
state.activeWeekDay = todayWeekDayId();

export {
  SLOT_LABEL_TO_ID,
  FOOD_CATEGORIES,
  SLOT_META,
  FAT_LANE_SLOT_LABELS,
  DAY_SLOTS,
  TEMPLATE_SLOTS,
  FOODS_DATA_VERSION,
  WEEK_DAYS,
  WEEK_GRID_MEALS,
  WEEK_MEAL_EMPTY_LABEL,
  MEAL_MAKER_SLOTS,
  MEAL_REFERENCE_SLOT,
  createEmptyMealMakerDraft,
  createEmptyDayState,
  createFreshWeekPlan,
  ensureWeekPlanShape,
  resetPlannerState,
  collectPlannerState,
  applyPlannerState,
  persistPlannerToProgram,
  todayWeekDayId,
  categorySelections,
  mealSlotMeta,
  templateSlots,
  initMealSlotsFromProgram,
  fmtServings,
  requiredServings,
  servingHint,
  applyLibraryRecipeToGridCell,
  applySavedMealToGridCell,
  mealItemsScaledToSlot,
  savedMealById,
  scaledLabel,
  gramWeightLabel,
  servingAmountLabel,
  escapeHtml,
  slotFoodCategories,
  ensureActiveFoodCategory,
  isCategorySlotActive,
  makerRequiredServings,
  makerServingHint,
  getMakerFatSelections,
  setMakerFatSelections,
  isSplitServingsMakerSlot,
  normalizeMealMakerDraft,
  getMakerSplitSelections,
  addMakerSplitFood,
  removeMakerSplitFood,
  getSplitGridSelections,
  setSplitGridSelections,
  clearMealMakerDraft,
  applySavedMealItemsToMakerDraft,
  isMealMakerSaveable,
  mealMakerToItems,
  isMealMealSlot,
  isFatSlot,
  getFatSelections,
  setFatSelections,
  isFruitOnlySnack,
  acceptsSavedMealDrop,
  isAssignedMeal,
  isSnackMealSlot,
  gridCellHasAssignment,
  savedMealFitsMealSlot,
  clearDaySlotMeta,
  itemSlotLabel,
  mealIdFromName,
  findSavedMealByName,
  dedupeSavedMeals,
  iterWeekFoodSelections,
  foodAmountLabel,
  buildShoppingTotals,
};
