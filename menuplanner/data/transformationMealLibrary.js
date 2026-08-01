/**
 * 8-Week Transformation — seven meal prep menu items.
 * Plan foods in items[]; flavor kit + prep technique on each card.
 * Image filenames: {id}.jpg
 */

/** @type {Readonly<Record<string, string>>} */
const MEAL_NAMES = {
  'southwest-chicken-bowl': 'Southwest Chicken Bowl',
  'steakhouse-sirloin-plate': 'Steakhouse Sirloin Plate',
  'garlic-herb-shrimp-stir-fry': 'Garlic Herb Shrimp Stir-Fry',
  'tex-mex-steak-fajitas': 'Tex-Mex Steak Fajitas',
  'lemon-pepper-cod-dinner': 'Lemon Pepper Cod Dinner',
  'turkey-harvest-skillet': 'Turkey Harvest Skillet',
  'classic-beef-potato-plate': 'Classic Beef & Potato Plate',
};

/**
 * @param {string} id
 * @param {Array<{ slot: string, foodName: string }>} items
 * @param {{
 *   flavorKit: string,
 *   finish?: string[],
 *   prep: string,
 *   planNote?: string,
 *   tags?: string[],
 * }} options
 */
function meal(id, items, { flavorKit, finish, prep, planNote, tags } = {}) {
  return {
    id,
    name: MEAL_NAMES[id],
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
export const TRANSFORMATION_MEALS = [
  meal('southwest-chicken-bowl', [
    { slot: 'Protein', foodName: 'Chicken breast, no skin' },
    { slot: 'Grains/Starches', foodName: 'Rice, basmati' },
    { slot: 'Grains/Starches', foodName: 'Beans, black' },
    { slot: 'Veggie', foodName: 'Peppers, red bell, cooked' },
    { slot: 'Veggie', foodName: 'Onions, cooked' },
  ], {
    flavorKit: 'fire',
    finish: ['Lime', 'Cilantro'],
    prep: 'Grill or pan-sear chicken; cook rice; warm drained black beans. Sauté pepper strips and onion until crisp-tender. Portion bowls with rice, chicken, beans, and vegetables.',
  }),
  meal('steakhouse-sirloin-plate', [
    { slot: 'Protein', foodName: 'Beef, top sirloin' },
    { slot: 'Grains/Starches', foodName: 'Potato, baked (flesh + skin)' },
    { slot: 'Veggie', foodName: 'Snap peas (sugar snap)' },
  ], {
    tags: ['beef', 'starch'],
    flavorKit: 'iron',
    finish: ['Chives', 'Parsley'],
    prep: 'Grill or pan-sear sirloin to your doneness; rest 5–10 minutes, then slice. Bake the potato until tender; steam snap peas until crisp-tender.',
    planNote: 'A spoonful of plain Greek yogurt on the potato is fine — it counts toward your plan when used in meaningful amounts.',
  }),
  meal('garlic-herb-shrimp-stir-fry', [
    { slot: 'Protein', foodName: 'Shrimp, steamed' },
    { slot: 'Grains/Starches', foodName: 'Rice, basmati' },
    { slot: 'Veggie', foodName: 'Broccoli, cooked' },
    { slot: 'Veggie', foodName: 'Mushrooms, white, cooked' },
    { slot: 'Veggie', foodName: 'Peppers, red bell, cooked' },
  ], {
    tags: ['seafood', 'grain'],
    flavorKit: 'green',
    finish: ['Green onion'],
    prep: 'Stir-fry shrimp until pink; set aside. Stir-fry broccoli, peppers, and mushrooms until crisp-tender; return shrimp. Serve over basmati rice.',
    planNote: 'Use a small amount of oil for the wok. Low-sodium soy sauce in normal cooking amounts is fine.',
  }),
  meal('tex-mex-steak-fajitas', [
    { slot: 'Protein', foodName: 'Beef, eye of round' },
    { slot: 'Grains/Starches', foodName: 'Tortilla, corn (6-inch)' },
    { slot: 'Veggie', foodName: 'Peppers, red bell, cooked' },
    { slot: 'Veggie', foodName: 'Onions, cooked' },
  ], {
    tags: ['beef', 'grain'],
    flavorKit: 'fire',
    finish: ['Lime'],
    prep: 'Slice steak thin; sauté with pepper strips and onion until tender. Warm tortillas and build fajitas. Prep extra filling for multiple meals.',
  }),
  meal('lemon-pepper-cod-dinner', [
    { slot: 'Protein', foodName: 'Cod, Atlantic, baked' },
    { slot: 'Grains/Starches', foodName: 'Rice, basmati' },
    { slot: 'Veggie', foodName: 'Green beans, cooked' },
  ], {
    tags: ['seafood', 'grain'],
    flavorKit: 'green',
    prep: 'Bake cod until it flakes. Steam green beans; cook rice separately. Portion fish, rice, and beans into meal-prep containers.',
  }),
  meal('turkey-harvest-skillet', [
    { slot: 'Protein', foodName: 'Turkey breast' },
    { slot: 'Grains/Starches', foodName: 'Sweet potato, baked' },
    { slot: 'Veggie', foodName: 'Spinach, cooked' },
    { slot: 'Veggie', foodName: 'Mushrooms, white, cooked' },
  ], {
    tags: ['poultry', 'starch'],
    flavorKit: 'earth',
    prep: 'Roast diced sweet potato until tender. Sauté turkey with mushrooms until done; fold in spinach until wilted. Portion skillets for the week.',
  }),
  meal('classic-beef-potato-plate', [
    { slot: 'Protein', foodName: 'Beef, ground round' },
    { slot: 'Grains/Starches', foodName: 'Potato, red, boiled' },
    { slot: 'Veggie', foodName: 'Cauliflower, cooked' },
  ], {
    tags: ['beef', 'starch'],
    flavorKit: 'iron',
    prep: 'Form lean ground round into patties and pan-sear until done. Roast potatoes and cauliflower on one tray until tender. Portion for reheating.',
  }),
];

const mealsById = new Map(TRANSFORMATION_MEALS.map((entry) => [entry.id, entry]));

export function transformationMealById(id) {
  return mealsById.get(id) ?? null;
}

export function transformationMealTemplates() {
  return TRANSFORMATION_MEALS;
}

export const TRANSFORMATION_MEAL_IDS = TRANSFORMATION_MEALS.map((meal) => meal.id);
