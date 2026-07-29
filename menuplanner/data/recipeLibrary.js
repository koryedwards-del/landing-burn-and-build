/** Simple meal cards for Page 4 — protein + G/S (+ veg at dinner), scaled to the user's plan. */

export const MEAL_SLOT_COLUMNS = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
];

/**
 * @typedef {{ slot: 'Protein' | 'Grains/Starches' | 'Veggie', foodName: string }} MealItem
 * @typedef {{ id: string, name: string, items: MealItem[], caveats?: string }} MealCard
 */

/** @type {Readonly<Record<string, ReadonlyArray<MealCard>>>} */
export const MEALS_BY_SLOT = {
  breakfast: [
    {
      id: 'power-breakfast',
      name: 'Power Breakfast',
      items: [
        { slot: 'Protein', foodName: 'Beef, eye of round' },
        { slot: 'Grains/Starches', foodName: 'Tortilla, corn (6-inch)' },
      ],
      caveats: 'Pepper, garlic powder, hot sauce. Seasonings do not replace beef or tortilla.',
    },
    {
      id: 'egg-whites-oats',
      name: 'Egg Whites & Oats',
      items: [
        { slot: 'Protein', foodName: 'Egg whites' },
        { slot: 'Grains/Starches', foodName: 'Oats, rolled' },
      ],
      caveats: 'Cinnamon or sweetener is fine. Skip butter unless you count fat points.',
    },
    {
      id: 'turkey-wrap-breakfast',
      name: 'Turkey Wrap',
      items: [
        { slot: 'Protein', foodName: 'Turkey breast' },
        { slot: 'Grains/Starches', foodName: 'Tortilla, corn (6-inch)' },
      ],
    },
    {
      id: 'cottage-cheese-eggs',
      name: 'Cottage Cheese & Eggs',
      items: [
        { slot: 'Protein', foodName: 'Cottage cheese, 2% fat' },
        { slot: 'Protein', foodName: 'Egg whites' },
      ],
    },
    {
      id: 'yogurt-oats',
      name: 'Yogurt & Oats',
      items: [
        { slot: 'Protein', foodName: 'Yogurt, plain, nonfat' },
        { slot: 'Grains/Starches', foodName: 'Oats, rolled' },
      ],
    },
    {
      id: 'breakfast-burrito',
      name: 'Lean Breakfast Burrito',
      items: [
        { slot: 'Protein', foodName: 'Beef, 95% lean ground' },
        { slot: 'Grains/Starches', foodName: 'Tortilla, corn (6-inch)' },
      ],
    },
  ],
  lunch: [
    {
      id: 'power-lunch',
      name: 'Power Lunch',
      items: [
        { slot: 'Protein', foodName: 'Beef, eye of round' },
        { slot: 'Grains/Starches', foodName: 'Tortilla, corn (6-inch)' },
      ],
    },
    {
      id: 'chicken-rice-bowl',
      name: 'Chicken & Rice Bowl',
      items: [
        { slot: 'Protein', foodName: 'Chicken breast, no skin' },
        { slot: 'Grains/Starches', foodName: 'Rice, basmati' },
      ],
      caveats: 'Salt, pepper, Mrs. Dash, lemon. Do not swap extra rice for the chicken serving.',
    },
    {
      id: 'tuna-rice',
      name: 'Tuna & Rice',
      items: [
        { slot: 'Protein', foodName: 'Tuna, canned in water' },
        { slot: 'Grains/Starches', foodName: 'Rice, white' },
      ],
      caveats: 'Mustard, lemon, or hot sauce. Mayo counts toward fat points if you use it.',
    },
    {
      id: 'turkey-wrap-lunch',
      name: 'Turkey Wrap',
      items: [
        { slot: 'Protein', foodName: 'Turkey breast' },
        { slot: 'Grains/Starches', foodName: 'Tortilla, corn (6-inch)' },
      ],
    },
    {
      id: 'sirloin-potato-lunch',
      name: 'Sirloin & Potato',
      items: [
        { slot: 'Protein', foodName: 'Beef, top sirloin' },
        { slot: 'Grains/Starches', foodName: 'Potato, baked (flesh + skin)' },
      ],
    },
    {
      id: 'lean-burger',
      name: 'Lean Burger Plate',
      items: [
        { slot: 'Protein', foodName: 'Beef, 95% lean ground' },
        { slot: 'Grains/Starches', foodName: 'Tortilla, corn (6-inch)' },
      ],
    },
  ],
  dinner: [
    {
      id: 'eye-round-potato-broccoli',
      name: 'Eye of Round, Potato & Broccoli',
      items: [
        { slot: 'Protein', foodName: 'Beef, eye of round' },
        { slot: 'Grains/Starches', foodName: 'Potato, baked (flesh + skin)' },
        { slot: 'Veggie', foodName: 'Broccoli, cooked' },
      ],
      caveats: 'Simple plate — potato is your G/S, broccoli is your dinner vegetable.',
    },
    {
      id: 'power-dinner-salad',
      name: 'Power Dinner w/ Salad',
      items: [
        { slot: 'Protein', foodName: 'Beef, eye of round' },
        { slot: 'Grains/Starches', foodName: 'Tortilla, corn (6-inch)' },
        { slot: 'Veggie', foodName: 'Peppers, red bell, cooked' },
      ],
    },
    {
      id: 'chicken-potato-broccoli',
      name: 'Chicken, Potato & Broccoli',
      items: [
        { slot: 'Protein', foodName: 'Chicken breast, no skin' },
        { slot: 'Grains/Starches', foodName: 'Potato, baked (flesh + skin)' },
        { slot: 'Veggie', foodName: 'Broccoli, cooked' },
      ],
    },
    {
      id: 'fish-potato-broccoli',
      name: 'Fish, Potato & Broccoli',
      items: [
        { slot: 'Protein', foodName: 'Cod, Atlantic, baked' },
        { slot: 'Grains/Starches', foodName: 'Potato, boiled' },
        { slot: 'Veggie', foodName: 'Broccoli, cooked' },
      ],
      caveats: 'Lemon, pepper, parsley. Light spray oil only — heavy oil uses fat points.',
    },
    {
      id: 'beef-fajita-plate',
      name: 'Beef Fajita Plate',
      items: [
        { slot: 'Protein', foodName: 'Beef, top sirloin' },
        { slot: 'Grains/Starches', foodName: 'Tortilla, corn (6-inch)' },
        { slot: 'Veggie', foodName: 'Peppers, red bell, cooked' },
      ],
      caveats: 'Lime, cumin, salsa. Not restaurant fajitas — no extra tortillas, sour cream, or cheese unless counted.',
    },
    {
      id: 'chicken-rice-broccoli',
      name: 'Chicken, Rice & Broccoli',
      items: [
        { slot: 'Protein', foodName: 'Chicken breast, no skin' },
        { slot: 'Grains/Starches', foodName: 'Rice, basmati' },
        { slot: 'Veggie', foodName: 'Broccoli, cooked' },
      ],
    },
  ],
};

export const RECIPE_LIBRARY = Object.entries(MEALS_BY_SLOT).flatMap(([mealSlot, meals]) =>
  meals.map((meal) => ({ ...meal, mealSlot })),
);

const mealsById = new Map(RECIPE_LIBRARY.map((meal) => [meal.id, meal]));

export function recipeById(id) {
  return mealsById.get(id) ?? null;
}

export function libraryRecipeFitsMealSlot(meal, mealSlotId) {
  return meal?.mealSlot === mealSlotId;
}

export function recipesForMealSlot(mealSlotId) {
  return MEALS_BY_SLOT[mealSlotId] ?? [];
}
