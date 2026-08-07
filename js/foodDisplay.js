/** User-facing food names — print food list, planner picker, grocery labels. */

const DISPLAY_OVERRIDES = {};

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
  'Greek yogurt, nonfat': 'Greek yogurt',
  'Cottage cheese, nonfat': 'Cottage cheese',
  'Eggs': 'Whole eggs',
  'Oats, rolled': 'Oats',
  'Rice, basmati': 'Basmati rice',
  'Rice, jasmine': 'Jasmine rice',
  'Bread, whole wheat': 'Whole wheat bread',
  'Tortilla, whole wheat (6-inch)': 'Whole wheat tortilla',
  'Rice cakes, plain': 'Rice cakes',
  'Sweet potato, baked': 'Sweet potato',
  'Potato, baked (flesh + skin)': 'Russet potato',
  'Beans, black': 'Black beans',
  'Cod, Atlantic, baked': 'Cod',
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
