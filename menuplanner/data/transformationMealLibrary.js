/**
 * 8-Week Transformation — meal prep catalog.
 *
 * Fresh start: no meals yet. Add entries to TRANSFORMATION_MEALS as they are defined.
 * Each meal: plan foods (items), one flavorKit, optional finish[], prep steps, optional planNote.
 * Image: menuplanner/assets/meals/{id}.jpg
 */

/**
 * @param {string} id
 * @param {string} name
 * @param {Array<{ slot: string, foodName: string }>} items
 * @param {{
 *   flavorKit: string,
 *   finish?: string[],
 *   prep: string,
 *   planNote?: string,
 *   tags?: string[],
 * }} options
 */
export function defineTransformationMeal(id, name, items, {
  flavorKit,
  finish,
  prep,
  planNote,
  tags,
} = {}) {
  return {
    id,
    name,
    items,
    flavorKit,
    finish: finish ?? [],
    prep: prep.trim(),
    planNote: planNote?.trim() ?? '',
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

/** @type {ReadonlyArray<{ id: string, name: string, items: Array<{ slot: string, foodName: string }>, flavorKit: string, finish: string[], prep: string, planNote: string, tags: string[] }>} */
export const TRANSFORMATION_MEALS = [];

const mealsById = new Map(TRANSFORMATION_MEALS.map((entry) => [entry.id, entry]));

export function transformationMealById(id) {
  return mealsById.get(id) ?? null;
}

export function transformationMealTemplates() {
  return TRANSFORMATION_MEALS;
}

export const TRANSFORMATION_MEAL_IDS = TRANSFORMATION_MEALS.map((meal) => meal.id);
