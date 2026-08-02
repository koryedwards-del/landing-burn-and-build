/**
 * Bodybuilder cutting diet — one-trip grocery staples (curated shopping list).
 * Catalog names must match data/foods.json. Static rows are shop checklist only.
 */

/** Cutting fruit staples — must have PNG in menuplanner/assets/fruits/. */
export const STAPLE_FRUIT_NAMES = [
  'Apples',
  'Bananas',
  'Blueberries',
  'Clementines',
  'Strawberries',
];

/** Breakfast protein — dairy & eggs. */
export const STAPLE_DAIRY_EGG_NAMES = [
  'Egg whites',
  'Eggs',
  'Greek yogurt, nonfat',
  'Cottage cheese, nonfat',
];

/** Lunch/dinner — lean red meat. */
export const STAPLE_RED_MEAT_NAMES = [
  'Beef, top sirloin',
  'Beef, ground round',
  'Beef, eye of round',
];

/** Lunch/dinner — poultry. */
export const STAPLE_WHITE_MEAT_NAMES = [
  'Chicken breast, no skin',
];

/** Lunch/dinner — seafood. */
export const STAPLE_SEAFOOD_NAMES = [
  'Cod, Atlantic, baked',
  'Tilapia, baked',
  'Shrimp, steamed',
  'Tuna, canned in water',
];

/** Grains. */
export const STAPLE_GRAIN_NAMES = [
  'Oats, rolled',
  'Rice, basmati',
  'Rice, jasmine',
  'Bread, whole wheat',
  'Tortilla, whole wheat (6-inch)',
  'Rice cakes, plain',
];

/** Starches. */
export const STAPLE_STARCH_NAMES = [
  'Sweet potato, baked',
  'Potato, baked (flesh + skin)',
  'Beans, black',
];

/** Vegetables. */
export const STAPLE_VEGETABLE_NAMES = [
  'Broccoli, cooked',
  'Green beans, cooked',
  'Spinach, cooked',
  'Peppers, red bell, cooked',
  'Mushrooms, white, cooked',
  'Cauliflower, cooked',
  'Asparagus, cooked',
  'Lettuce, romaine',
];

export const STAPLE_MAIN_PROTEIN_NAMES = [
  ...STAPLE_RED_MEAT_NAMES,
  ...STAPLE_WHITE_MEAT_NAMES,
  ...STAPLE_SEAFOOD_NAMES,
];

export const STAPLE_GS_NAMES = [
  ...STAPLE_GRAIN_NAMES,
  ...STAPLE_STARCH_NAMES,
];

/** All catalog-backed cutting staples (for one-trip shop list). */
export const STAPLE_CATALOG_NAMES = [
  ...STAPLE_DAIRY_EGG_NAMES,
  ...STAPLE_MAIN_PROTEIN_NAMES,
  ...STAPLE_GS_NAMES,
  ...STAPLE_VEGETABLE_NAMES,
];

/**
 * One-trip shop sections — week quantities shown when a staple is on your plan.
 * @type {Array<{ id: string, label: string, catalogNames?: string[], staticItems?: string[] }>}
 */
export const CUTTING_STAPLE_SHOP_SECTIONS = [
  {
    id: 'protein',
    label: 'Protein',
    catalogNames: [
      ...STAPLE_WHITE_MEAT_NAMES,
      ...STAPLE_RED_MEAT_NAMES,
      ...STAPLE_DAIRY_EGG_NAMES,
      ...STAPLE_SEAFOOD_NAMES,
    ],
  },
  {
    id: 'carbs',
    label: 'Carbohydrates',
    catalogNames: STAPLE_GS_NAMES,
  },
  {
    id: 'vegetables',
    label: 'Vegetables',
    catalogNames: STAPLE_VEGETABLE_NAMES,
  },
  {
    id: 'fruit',
    label: 'Fruit',
    catalogNames: STAPLE_FRUIT_NAMES,
  },
  {
    id: 'flavor',
    label: 'Flavor builders',
    staticItems: [
      'Salsa',
      'Mustard',
      'Hot sauce',
      'Low-sodium soy sauce',
      'Lemon / lime',
      'Garlic',
      'Onion',
      'Fresh herbs',
    ],
  },
  {
    id: 'seasonings',
    label: 'Seasonings',
    staticItems: [
      'Salt',
      'Black pepper',
      'Paprika',
      'Chili powder',
      'Cumin',
      'Italian seasoning',
      'Garlic powder',
      'Onion powder',
      'Cinnamon',
    ],
  },
  {
    id: 'pantry',
    label: 'Pantry',
    staticItems: [
      'Cooking spray',
      'Nonstick foil',
      'Coffee',
      'Tea',
      'Zero-calorie beverages',
    ],
  },
];
