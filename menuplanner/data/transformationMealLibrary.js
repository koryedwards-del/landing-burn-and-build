/**
 * 8-Week Transformation — seven meal prep menu items.
 * Standalone from recipeLibrary.js (DIY catalog). Image-first filenames: {id}.jpg
 */

const SEASONING_CLOSER = 'Use salt/peppers, herbs and spices to taste.';

function meal(id, items, { profile = 'Meal prep', caveat, tags } = {}) {
  const body = (caveat ?? '').trim();
  const flavor = body ? `${body} ${SEASONING_CLOSER}` : SEASONING_CLOSER;
  return {
    id,
    name: MEAL_NAMES[id],
    items,
    profile,
    flavor,
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

/** @type {ReadonlyArray<{ id: string, name: string, items: Array<{ slot: string, foodName: string }>, profile?: string, flavor?: string, tags?: string[] }>} */
export const TRANSFORMATION_MEALS = [
  meal('southwest-chicken-bowl', [
    { slot: 'Protein', foodName: 'Chicken breast, no skin' },
    { slot: 'Grains/Starches', foodName: 'Rice, basmati' },
    { slot: 'Grains/Starches', foodName: 'Beans, black' },
    { slot: 'Veggie', foodName: 'Peppers, red bell, cooked' },
    { slot: 'Veggie', foodName: 'Onions, cooked' },
  ], {
    caveat: 'Season chicken with chili powder, cumin, garlic powder, salt, and pepper; grill or pan-sear until done, rest, and slice. Cook rice; warm drained black beans. Sauté pepper strips and onion until crisp-tender. Portion bowls with rice, chicken, beans, and vegetables. Lime and cilantro optional.',
  }),
  meal('steakhouse-sirloin-plate', [
    { slot: 'Protein', foodName: 'Beef, top sirloin' },
    { slot: 'Grains/Starches', foodName: 'Potato, baked (flesh + skin)' },
    { slot: 'Veggie', foodName: 'Snap peas (sugar snap)' },
  ], {
    tags: ['beef', 'starch'],
    caveat: 'Pat sirloin dry; season with garlic powder, onion powder, black pepper, and salt. Grill or pan-sear to your doneness; rest 5–10 minutes, then slice. Bake the potato until tender; split and top with a spoonful of plain Greek yogurt. Steam snap peas until crisp-tender. Garnish with chives or parsley if desired.',
  }),
  meal('garlic-herb-shrimp-stir-fry', [
    { slot: 'Protein', foodName: 'Shrimp, steamed' },
    { slot: 'Grains/Starches', foodName: 'Rice, basmati' },
    { slot: 'Veggie', foodName: 'Broccoli, cooked' },
    { slot: 'Veggie', foodName: 'Mushrooms, white, cooked' },
    { slot: 'Veggie', foodName: 'Peppers, red bell, cooked' },
  ], {
    tags: ['seafood', 'grain'],
    caveat: 'Stir-fry a double batch with garlic, dried herbs, and black pepper — PAM recommended. Cook shrimp with broccoli, mushrooms, and peppers until pink. Portion into containers; cook rice separately and add when you eat.',
  }),
  meal('tex-mex-steak-fajitas', [
    { slot: 'Protein', foodName: 'Beef, eye of round' },
    { slot: 'Grains/Starches', foodName: 'Tortilla, corn (6-inch)' },
    { slot: 'Veggie', foodName: 'Peppers, red bell, cooked' },
    { slot: 'Veggie', foodName: 'Onions, cooked' },
  ], {
    tags: ['beef', 'grain'],
    caveat: 'Slice steak thin; season with cumin, chili powder, garlic, and lime. Sauté pepper strips and onion until tender. Warm tortillas and build fajitas — prep extra filling for multiple meals.',
  }),
  meal('lemon-pepper-cod-dinner', [
    { slot: 'Protein', foodName: 'Cod, Atlantic, baked' },
    { slot: 'Grains/Starches', foodName: 'Rice, basmati' },
    { slot: 'Veggie', foodName: 'Green beans, cooked' },
  ], {
    tags: ['seafood', 'grain'],
    caveat: 'Season cod with lemon pepper. Bake until the fish flakes. Steam green beans; cook rice separately. Portion fish, rice, and beans into meal-prep containers.',
  }),
  meal('turkey-harvest-skillet', [
    { slot: 'Protein', foodName: 'Turkey breast' },
    { slot: 'Grains/Starches', foodName: 'Sweet potato, baked' },
    { slot: 'Veggie', foodName: 'Spinach, cooked' },
    { slot: 'Veggie', foodName: 'Mushrooms, white, cooked' },
  ], {
    tags: ['poultry', 'starch'],
    caveat: 'Dice sweet potato and roast until tender. Sauté turkey with mushrooms until done; fold in spinach until wilted. Portion skillets for the week.',
  }),
  meal('classic-beef-potato-plate', [
    { slot: 'Protein', foodName: 'Beef, ground round' },
    { slot: 'Grains/Starches', foodName: 'Potato, red, boiled' },
    { slot: 'Veggie', foodName: 'Cauliflower, cooked' },
  ], {
    tags: ['beef', 'starch'],
    caveat: 'Form lean ground round into patties and pan-sear until done. Roast baby red potatoes and cauliflower on one tray until tender. Portion patties, potatoes, and cauliflower for reheating.',
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
