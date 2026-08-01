/**
 * 8-Week Transformation — meal inspiration library.
 *
 * Cards are visual ideas, not recipes. items[].foodName links to foods.json;
 * items[].label is the short display name. Amounts come from the user's plan.
 */

export const MEAL_CARD_PLAN_NOTE =
  'Amounts come from your plan — they appear on your weekly grid and grocery list.';

/**
 * @param {string} id
 * @param {string} name
 * @param {Array<{ slot: string, foodName: string, label?: string }>} items
 * @param {{
 *   flavorKit: string,
 *   splash?: string[],
 *   how: string[],
 *   tags?: string[],
 * }} options
 */
export function defineTransformationMeal(id, name, items, {
  flavorKit,
  splash,
  how,
  tags,
} = {}) {
  return {
    id,
    name,
    items,
    flavorKit,
    splash: splash ?? [],
    how: (how ?? []).map((line) => line.trim()).filter(Boolean),
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

/** @type {ReadonlyArray<{ id: string, name: string, items: Array<{ slot: string, foodName: string, label?: string }>, flavorKit: string, splash: string[], how: string[], tags: string[] }>} */
export const TRANSFORMATION_MEALS = [
  defineTransformationMeal(
    'garlic-herb-shrimp-stir-fry',
    'Garlic Herb Shrimp Stir-Fry',
    [
      { slot: 'Protein', foodName: 'Shrimp, steamed', label: 'Shrimp' },
      { slot: 'Grains/Starches', foodName: 'Rice, basmati', label: 'Rice' },
      { slot: 'Veggie', foodName: 'Broccoli, cooked', label: 'Broccoli' },
      { slot: 'Veggie', foodName: 'Peppers, red bell, cooked', label: 'Bell peppers' },
      { slot: 'Veggie', foodName: 'Mushrooms, white, cooked', label: 'Mushrooms' },
    ],
    {
      tags: ['seafood', 'grain'],
      flavorKit: 'iron',
      splash: ['Low-sodium soy sauce'],
      how: [
        'Cook shrimp.',
        'Stir-fry vegetables.',
        'Combine and serve over rice.',
      ],
    },
  ),
];

const mealsById = new Map(TRANSFORMATION_MEALS.map((entry) => [entry.id, entry]));

export function transformationMealById(id) {
  return mealsById.get(id) ?? null;
}

export function transformationMealTemplates() {
  return TRANSFORMATION_MEALS;
}

export const TRANSFORMATION_MEAL_IDS = TRANSFORMATION_MEALS.map((meal) => meal.id);
