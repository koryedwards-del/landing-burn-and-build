/**
 * 8-Week Transformation — meal prep catalog.
 *
 * Fresh start: no meals yet. Add entries to TRANSFORMATION_MEALS as they are defined.
 *
 * Meal card elements:
 *   1. Photo        — menuplanner/assets/meals/{id}.jpg
 *   2. Name         — menu title
 *   3. Plan foods   — items[] from foods.json (counted on the plan)
 *   4. Flavor kit   — one dry kit id (fire | iron | green | earth)
 *   5. Splash       — optional liquid accents while cooking (not counted)
 *   6. Prep         — technique only
 */

/**
 * @param {string} id
 * @param {string} name
 * @param {Array<{ slot: string, foodName: string }>} items
 * @param {{
 *   flavorKit: string,
 *   splash?: string[],
 *   prep: string,
 *   tags?: string[],
 * }} options
 */
export function defineTransformationMeal(id, name, items, {
  flavorKit,
  splash,
  prep,
  tags,
} = {}) {
  return {
    id,
    name,
    items,
    flavorKit,
    splash: splash ?? [],
    prep: prep.trim(),
    tags: tags ?? inferMealTags(items),
  };
}

function inferMealTags(items) {
  const tags = new Set();
  items.forEach((item) => {
    const name = item.foodName.toLowerCase();
    if (item.slot === 'Protein') {
      if (name.startsWith('beef')) tags.add('beef');
      else if (name.startsWith('chicken') || name.startsWith('turkey')) tags.add('poultry');
      else if (name.startsWith('shrimp') || name.startsWith('cod')) tags.add('seafood');
    }
    if (item.slot === 'Grains/Starches') {
      if (name.includes('rice') || name.includes('tortilla')) tags.add('grain');
      if (name.includes('bean') || name.includes('potato') || name.includes('sweet potato')) tags.add('starch');
    }
  });
  return [...tags];
}

/** @type {ReadonlyArray<{ id: string, name: string, items: Array<{ slot: string, foodName: string }>, flavorKit: string, splash: string[], prep: string, tags: string[] }>} */
export const TRANSFORMATION_MEALS = [];

const mealsById = new Map(TRANSFORMATION_MEALS.map((entry) => [entry.id, entry]));

export function transformationMealById(id) {
  return mealsById.get(id) ?? null;
}

export function transformationMealTemplates() {
  return TRANSFORMATION_MEALS;
}

export const TRANSFORMATION_MEAL_IDS = TRANSFORMATION_MEALS.map((meal) => meal.id);
