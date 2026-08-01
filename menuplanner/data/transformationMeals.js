/**
 * 8-Week Transformation — curated meal prep card order.
 * Meal definitions live in transformationMealLibrary.js.
 */

import {
  TRANSFORMATION_MEAL_IDS,
  transformationMealById,
} from './transformationMealLibrary.js';

export { TRANSFORMATION_MEAL_IDS, transformationMealById };

const TRANSFORMATION_MEAL_ORDER = new Map(
  TRANSFORMATION_MEAL_IDS.map((id, index) => [id, index]),
);

export function isTransformationMeal(mealId) {
  return TRANSFORMATION_MEAL_ORDER.has(mealId);
}

export function transformationMealSortKey(mealId) {
  return TRANSFORMATION_MEAL_ORDER.get(mealId) ?? Number.MAX_SAFE_INTEGER;
}
