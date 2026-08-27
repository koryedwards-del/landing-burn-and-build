/** Sample Day Menu — fill-in meal worksheet for sample diet PDF (page 7). */

import { SLOT_COLUMNS } from './servingsPrintout.js';

/** Category rows per meal slot — top-to-bottom worksheet layout. */
const MEAL_CATEGORY_ROWS = Object.freeze({
  breakfast: ['Proteins', 'Grains/Starches'],
  snack1: ['Fruits'],
  lunch: ['Proteins', 'Grains/Starches'],
  snack2: ['Fruits'],
  dinner: ['Proteins', 'Grains/Starches', 'Veggies'],
});

export function buildSampleDayMenuSections() {
  return SLOT_COLUMNS
    .filter((slot) => MEAL_CATEGORY_ROWS[slot.key])
    .map((slot) => ({
      title: slot.slotLabel,
      rows: MEAL_CATEGORY_ROWS[slot.key].map((label) => ({ label })),
    }));
}
