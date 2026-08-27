/** Sample Day Menu — fill-in meal worksheet for sample diet PDF (page 7). */

export const SAMPLE_DAY_MENU_FRUIT_SNACK_LABEL = 'Fruit Snack';

function mainMealSection(title, rowLabels) {
  return {
    title,
    rows: rowLabels.map((label) => ({ label })),
  };
}

function fruitSnackSection() {
  return {
    title: null,
    rows: [{ label: SAMPLE_DAY_MENU_FRUIT_SNACK_LABEL }],
  };
}

/** Top-to-bottom: main meals with a fruit snack row after breakfast, lunch, and dinner. */
export function buildSampleDayMenuSections() {
  return [
    mainMealSection('Breakfast', ['Proteins', 'Grains/Starches']),
    fruitSnackSection(),
    mainMealSection('Lunch', ['Proteins', 'Grains/Starches']),
    fruitSnackSection(),
    mainMealSection('Dinner', ['Proteins', 'Grains/Starches', 'Veggies']),
    fruitSnackSection(),
  ];
}
