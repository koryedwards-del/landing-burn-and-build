/** User-facing food names — print food list, planner picker, grocery labels. */

const DISPLAY_OVERRIDES = {
  Eggs: '2 whites/1 yolk',
  'Egg whites': 'Egg whites (2 large whites)',
};

/**
 * @param {{ name: string, borderline?: boolean }} food
 * @param {{ showBorderline?: boolean }} [opts]
 */
export function foodListLabel(food, { showBorderline = true } = {}) {
  const base = DISPLAY_OVERRIDES[food.name] || food.name;
  if (showBorderline && food.borderline) return `${base}*`;
  return base;
}

export function hasBorderlineFoods(foods) {
  return foods.some((food) => food.borderline);
}

export const BORDERLINE_FOOTNOTE =
  '* On the list at the listed portion, but outside strict Burn Engine serving math (fat, protein, or carb allowance). Servings are still the prescription.';
