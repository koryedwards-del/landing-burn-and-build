/** Food List — fixed 4-page pagination (portrait, column grid + tips Q&A). */
export const FOOD_LIST_PRINT_PAGES = [
  {
    page: 1,
    columns: [
      { kind: 'foods', category: 'protein', title: 'Protein' },
      { kind: 'foods', category: 'dairy', title: 'Dairy' },
      { kind: 'tips', title: 'Protein Tips', qaKey: 'protein' },
    ],
  },
  {
    page: 2,
    columns: [
      { kind: 'foods', category: 'grain', title: 'Grains' },
      { kind: 'foods', category: 'starch', title: 'Starches' },
      { kind: 'tips', title: 'Grains & Starches Tips', qaKey: 'grainsStarches' },
    ],
  },
  {
    page: 3,
    columns: [
      { kind: 'foods', category: 'vegetable', title: 'Vegetables', split: 'first' },
      { kind: 'foods', category: 'vegetable', title: 'Vegetables', split: 'second', hideTitle: true },
      { kind: 'tips', title: 'Vegetable Tips', qaKey: 'vegetable' },
    ],
  },
  {
    page: 4,
    columnCount: 2,
    columns: [
      { kind: 'foods', category: 'fruit', title: 'Fruit' },
      { kind: 'tips', title: 'Fruit Tips', qaKey: 'fruit' },
    ],
  },
];
