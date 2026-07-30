/** User-facing food names — print food list, planner picker, grocery labels. */

const DISPLAY_OVERRIDES = {
  'Egg whites': 'Egg whites (2 large whites)',
};

/** @param {{ name: string }} food */
export function foodListLabel(food) {
  return DISPLAY_OVERRIDES[food.name] || food.name;
}
