/**
 * 8-Week Transformation — curated meal prep cards.
 * Image-first: add template ids here as assets land in menuplanner/assets/meals/.
 */

/** @type {readonly string[]} recipeLibrary.js meal ids, display order */
export const TRANSFORMATION_MEAL_IDS = [
  'shrimp-stir-fry-rice',
];

const TRANSFORMATION_MEAL_ORDER = new Map(
  TRANSFORMATION_MEAL_IDS.map((id, index) => [id, index]),
);

export function isTransformationMeal(mealId) {
  return TRANSFORMATION_MEAL_ORDER.has(mealId);
}

export function transformationMealSortKey(mealId) {
  return TRANSFORMATION_MEAL_ORDER.get(mealId) ?? Number.MAX_SAFE_INTEGER;
}
