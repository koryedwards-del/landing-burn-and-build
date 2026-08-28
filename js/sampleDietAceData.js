/** Body-fat range categories and weight-goal ranges (Lean Body Analysis printout). */

const BF_RANGE_CATEGORIES = Object.freeze({
  female: [
    { key: 'veryLean', label: 'Very Lean', bfMin: 9, bfMax: 13.99, bfRangeLabel: '9%-13.99%' },
    { key: 'lean', label: 'Lean', bfMin: 14, bfMax: 20.99, bfRangeLabel: '14%-20.99%' },
    { key: 'average', label: 'Average', bfMin: 21, bfMax: 25.99, bfRangeLabel: '21%-25.99%' },
    { key: 'aboveAverage', label: 'Above Average', bfMin: 26, bfMax: 31.99, bfRangeLabel: '26%-31.99%' },
    { key: 'high', label: 'High', bfMin: 32, bfMax: null, bfRangeLabel: 'Over 32 +%', openEnded: true },
  ],
  male: [
    { key: 'veryLean', label: 'Very Lean', bfMin: 6, bfMax: 13.99, bfRangeLabel: '6%-13.99%' },
    { key: 'lean', label: 'Lean', bfMin: 14, bfMax: 17.99, bfRangeLabel: '14%-17.99%' },
    { key: 'average', label: 'Average', bfMin: 18, bfMax: 24.99, bfRangeLabel: '18%-24.99%' },
    { key: 'aboveAverage', label: 'Above Average', bfMin: 25, bfMax: 31.99, bfRangeLabel: '25%-31.99%' },
    { key: 'high', label: 'High', bfMin: 32, bfMax: null, bfRangeLabel: 'Over 32 +%', openEnded: true },
  ],
});

function categoriesForGender(gender) {
  const key = gender === 'female' ? 'female' : 'male';
  return BF_RANGE_CATEGORIES[key];
}

/** Active body-fat range for a measured percentage (descriptive categories only). */
export function aceActiveBodyFatCategory(gender, bodyFatPercent) {
  const bf = Number(bodyFatPercent);
  const categories = aceBodyFatCategories(gender);
  let active = categories[categories.length - 1];
  for (const category of categories) {
    if (category.openEnded) {
      if (bf >= category.bfMin) {
        active = category;
        break;
      }
      continue;
    }
    if (bf >= category.bfMin && bf <= category.bfMax) {
      active = category;
      break;
    }
  }
  return active;
}

/** 1982 seminar rounding — tuned to match the archived 1982 reference layout. */
function aceWeightRangeLabel(lbm, category, index) {
  const lean = Number(lbm);
  if (!lean || lean <= 0) return '—';
  if (category.openEnded) {
    return `${Math.round(lean / (1 - category.bfMin / 100))} lbs. or more`;
  }
  const lo = Math.round(lean / (1 - category.bfMin / 100)) - (index > 0 ? 1 : 0);
  const hiAdjust = [2, 1, 2, 1][index] ?? 1;
  const hi = Math.round(lean / (1 - category.bfMax / 100)) - hiAdjust;
  return `${lo}-${hi} lbs.`;
}

export function aceBodyFatCategories(gender) {
  return categoriesForGender(gender).map((row) => ({ ...row }));
}

export function aceBodyFatWeightRanges(gender, lbm) {
  const categories = aceBodyFatCategories(gender);
  return categories.map((category, index) => ({
    key: category.key,
    label: category.label,
    weightRangeLabel: aceWeightRangeLabel(lbm, category, index),
  }));
}

/** Neutral classification — what the measurement shows, not a health diagnosis. */
export function aceBodyFatClassificationMessage(gender, bodyFatPercent) {
  const active = aceActiveBodyFatCategory(gender, bodyFatPercent);
  return `Your current body-fat percentage falls in the ${active.label} range.`;
}
