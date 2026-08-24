/**
 * Burn Engine per-serving macro targets — derived from computeServingsPhase loops in burnEngine.js.
 * Scripts and audits import this module; agents use `.cursor/rules/burn-engine-servings.mdc`.
 */

import {
  FAT_SERVING_CALORIES,
  SERVING_CARB_CAL,
  SERVING_FAT_CAL,
  SERVING_PROTEIN_CAL,
} from './burnEngine.js';

export {
  FAT_SERVING_CALORIES,
  SERVING_CARB_CAL,
  SERVING_FAT_CAL,
  SERVING_PROTEIN_CAL,
};

/** Carb macro grams from engine TC loop calorie weight (÷4). */
export function macroCarbsFromCal(calories) {
  return calories / 4;
}

/** Baked-in fat grams from engine TF loop calorie weight (÷9). */
export function macroFatFromCal(calories) {
  return calories / 9;
}

/** Round to two decimals for stable audit labels on small fat limits. */
function round2(x) {
  return Math.round(Number(x) * 100) / 100;
}

/**
 * Per-slot macro targets for food-list gram sizing.
 * Values are computed from burnEngine.js loop constants — do not hardcode elsewhere.
 */
export const BURN_ENGINE_SLOT_TARGETS = Object.freeze({
  P1: Object.freeze({
    slot: 'P1',
    proteinG: macroCarbsFromCal(SERVING_PROTEIN_CAL),
    carbsG: null,
    fatLimitG: macroFatFromCal(SERVING_FAT_CAL.protein),
    gramNumerator: macroCarbsFromCal(SERVING_PROTEIN_CAL) * 100,
  }),
  D1: Object.freeze({
    slot: 'D1',
    proteinG: macroCarbsFromCal(SERVING_PROTEIN_CAL),
    carbsG: macroCarbsFromCal(SERVING_CARB_CAL.dairy),
    fatLimitG: round2(macroFatFromCal(SERVING_FAT_CAL.dairy)),
    gramNumerator: null,
  }),
  G1: Object.freeze({
    slot: 'G1',
    proteinG: null,
    carbsG: macroCarbsFromCal(SERVING_CARB_CAL.grainStarch),
    fatLimitG: macroFatFromCal(SERVING_FAT_CAL.grain),
    gramNumerator: macroCarbsFromCal(SERVING_CARB_CAL.grainStarch) * 100,
  }),
  S2: Object.freeze({
    slot: 'S2',
    proteinG: null,
    carbsG: macroCarbsFromCal(SERVING_CARB_CAL.grainStarch),
    fatLimitG: round2(macroFatFromCal(SERVING_FAT_CAL.starchFruit)),
    gramNumerator: macroCarbsFromCal(SERVING_CARB_CAL.grainStarch) * 100,
  }),
  VE: Object.freeze({
    slot: 'VE',
    proteinG: null,
    carbsG: macroCarbsFromCal(SERVING_CARB_CAL.vegetable),
    /** Catalog portion ceiling (USDA); engine baked-in fat ≈ macroFatFromCal(SERVING_FAT_CAL.vegetable). */
    fatLimitG: 3,
    gramNumerator: macroCarbsFromCal(SERVING_CARB_CAL.vegetable) * 100,
  }),
  FQ: Object.freeze({
    slot: 'FQ',
    proteinG: null,
    carbsG: macroCarbsFromCal(SERVING_CARB_CAL.fruit),
    fatLimitG: round2(macroFatFromCal(SERVING_FAT_CAL.starchFruit)),
    gramNumerator: macroCarbsFromCal(SERVING_CARB_CAL.fruit) * 100,
    minServings: 3,
  }),
  FT: Object.freeze({
    slot: 'FT',
    proteinG: null,
    carbsG: null,
    fatLimitG: round2(FAT_SERVING_CALORIES / 9),
    gramNumerator: null,
  }),
});

/** Gram weight for one serving from carbs per 100g (grain, starch, vegetable, fruit). */
export function gramsForCarbServing(carbsPer100g, slot) {
  const target = BURN_ENGINE_SLOT_TARGETS[slot];
  if (!target?.gramNumerator) throw new Error(`No carb gram formula for slot ${slot}`);
  return Math.round(target.gramNumerator / carbsPer100g);
}

/** Gram weight for one protein serving from protein per 100g (P1). */
export function gramsForProteinServing(proteinPer100g) {
  return Math.round(BURN_ENGINE_SLOT_TARGETS.P1.gramNumerator / proteinPer100g);
}
