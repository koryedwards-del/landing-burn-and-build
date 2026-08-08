/** Seminar page 5 — Servings grid printout. */

/**
 * Split a daily total into whole-number servings across meal/snack slots.
 * For 3 slots (breakfast/lunch/dinner or 3 snacks), extras go to lunch then dinner —
 * not breakfast (e.g. 10 across 3 meals → 3, 4, 3).
 */
export function distributeWholeServings(total, slotCount) {
  const daily = Math.round(Number(total));
  const slots = Number(slotCount);
  if (!Number.isFinite(daily) || daily <= 0 || !Number.isFinite(slots) || slots <= 0) {
    return Array(Math.max(0, slots)).fill(0);
  }
  const base = Math.floor(daily / slots);
  const remainder = daily - base * slots;
  const parts = Array(slots).fill(base);
  if (slots === 3) {
    if (remainder >= 1) parts[1] += 1;
    if (remainder >= 2) parts[2] += 1;
    return parts;
  }
  for (let i = slots - 1; remainder > 0 && i >= 0; i -= 1) {
    parts[i] += 1;
    remainder -= 1;
  }
  return parts;
}

function cellFromWhole(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '';
  return String(Math.round(n));
}

const SLOT_COLUMNS = [
  { key: 'breakfast', label: 'Breakfast', slotLabel: 'Breakfast' },
  { key: 'snack1', label: 'Snack', slotLabel: 'Morning Snack' },
  { key: 'lunch', label: 'Lunch', slotLabel: 'Lunch' },
  { key: 'snack2', label: 'Snack', slotLabel: 'Afternoon Snack' },
  { key: 'dinner', label: 'Dinner', slotLabel: 'Dinner' },
  { key: 'snack3', label: 'Snack', slotLabel: 'Evening Snack' },
];

export function formatServingCell(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '';
  if (Math.abs(n - Math.round(n)) < 0.05) return String(Math.round(n));
  return n.toFixed(1);
}

export function servingsGridRows(pkg) {
  const servings = pkg?.plan?.servings;
  if (!servings) return [];

  const [proteinBreakfast, proteinLunch, proteinDinner] = distributeWholeServings(servings.protein, 3);
  const [grainBreakfast, grainLunch, grainDinner] = distributeWholeServings(servings.grainsStarches, 3);
  const [fruitSnack1, fruitSnack2, fruitSnack3] = distributeWholeServings(servings.fruits, 3);

  return [
    {
      label: 'Protein',
      daily: formatServingCell(servings.protein),
      breakfast: cellFromWhole(proteinBreakfast),
      snack1: '',
      lunch: cellFromWhole(proteinLunch),
      snack2: '',
      dinner: cellFromWhole(proteinDinner),
      snack3: '',
    },
    {
      label: 'Grains/Starches',
      daily: formatServingCell(servings.grainsStarches),
      breakfast: cellFromWhole(grainBreakfast),
      snack1: '',
      lunch: cellFromWhole(grainLunch),
      snack2: '',
      dinner: cellFromWhole(grainDinner),
      snack3: '',
    },
    {
      label: 'Veggies',
      daily: formatServingCell(servings.vegetables),
      breakfast: '',
      snack1: '',
      lunch: '',
      snack2: '',
      dinner: '',
      snack3: '',
    },
    {
      label: 'Fruits',
      daily: formatServingCell(servings.fruits),
      breakfast: '',
      snack1: cellFromWhole(fruitSnack1),
      lunch: '',
      snack2: cellFromWhole(fruitSnack2),
      dinner: '',
      snack3: cellFromWhole(fruitSnack3),
    },
  ];
}

export function extraFatLines(pkg) {
  const servings = pkg?.plan?.servings;
  if (!servings) return [];
  return [
    {
      value: formatServingCell(servings.fatMaintain),
      note: 'To maintain your current fat %',
    },
    {
      value: formatServingCell(servings.fatReduce ?? 0) || '0',
      note: 'To reduce your current fat %',
    },
  ];
}

export { SLOT_COLUMNS };
