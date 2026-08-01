/** User-facing food names — print food list, planner picker, grocery labels. */

const DISPLAY_OVERRIDES = {
  'Egg whites': 'Egg whites (2 large whites)',
};

/**
 * Shorter planner grid labels — add entries one by one as needed.
 * Keys must match `name` in data/foods.json exactly.
 * Full catalog names stay on the print food list.
 */
const PLANNER_LABEL_OVERRIDES = {
  'Beef, top sirloin': 'Sirloin',
  'Beef, eye of round': 'Eye of round',
  'Beef, ground round': 'Ground round',
  'Chicken breast, no skin': 'Chicken breast',
  'Cod, Atlantic, baked': 'Atlantic cod',
  'Crab, blue, steamed': 'Blue crab',
  'Flounder, baked': 'Flounder',
  'Haddock, baked': 'Haddock',
  'Halibut, baked': 'Halibut',
  'Lobster, steamed': 'Lobster',
  'Pollock, baked': 'Pollock',
  'Scallops, steamed': 'Scallops',
  'Shrimp, steamed': 'Shrimp',
  'Snapper, baked': 'Snapper',
  'Sole, baked': 'Sole',
  'Tilapia, baked': 'Tilapia',
  'Tuna, canned in water': 'Canned tuna',
  'Tuna, yellowfin': 'Yellowfin',
};

/** @param {{ name: string }} food */
export function foodListLabel(food) {
  return DISPLAY_OVERRIDES[food.name] || food.name;
}

/** @param {{ name: string }} food */
export function foodPlannerLabel(food) {
  if (PLANNER_LABEL_OVERRIDES[food.name]) return PLANNER_LABEL_OVERRIDES[food.name];
  if (DISPLAY_OVERRIDES[food.name]) return DISPLAY_OVERRIDES[food.name];
  return food.name;
}
