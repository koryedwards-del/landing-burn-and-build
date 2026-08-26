/** 1982 ACE body-fat categories and weight-goal ranges (5-page printout). */

const ACE_CATEGORIES = Object.freeze({
  female: [
    { key: 'extreme', label: 'Extreme', bfMin: 9, bfMax: 13.99, bfRangeLabel: '9%-13.99%' },
    { key: 'healthy', label: 'Healthy', bfMin: 14, bfMax: 20.99, bfRangeLabel: '14%-20.99%' },
    { key: 'average', label: 'Average', bfMin: 21, bfMax: 25.99, bfRangeLabel: '21%-25.99%' },
    { key: 'borderline', label: 'Borderline', bfMin: 26, bfMax: 31.99, bfRangeLabel: '26%-31.99%' },
    { key: 'atRisk', label: 'At Risk', bfMin: 32, bfMax: null, bfRangeLabel: 'Over 32 +%', openEnded: true },
  ],
  male: [
    { key: 'extreme', label: 'Extreme', bfMin: 6, bfMax: 13.99, bfRangeLabel: '6%-13.99%' },
    { key: 'healthy', label: 'Healthy', bfMin: 14, bfMax: 17.99, bfRangeLabel: '14%-17.99%' },
    { key: 'average', label: 'Average', bfMin: 18, bfMax: 24.99, bfRangeLabel: '18%-24.99%' },
    { key: 'borderline', label: 'Borderline', bfMin: 25, bfMax: 31.99, bfRangeLabel: '25%-31.99%' },
    { key: 'atRisk', label: 'At Risk', bfMin: 32, bfMax: null, bfRangeLabel: 'Over 32 +%', openEnded: true },
  ],
});

/** 1982 seminar rounding — tuned to match kwarner-1982-original.pdf (Kristi golden). */
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
  const key = gender === 'female' ? 'female' : 'male';
  return ACE_CATEGORIES[key].map((row) => ({ ...row }));
}

export function aceBodyFatWeightRanges(gender, lbm) {
  const categories = aceBodyFatCategories(gender);
  return categories.map((category, index) => ({
    label: category.label,
    weightRangeLabel: aceWeightRangeLabel(lbm, category, index),
  }));
}

export function aceRiskMessage(gender, bodyFatPercent) {
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
  if (active.key === 'atRisk') {
    return 'According to the American Council on Exercise you are at risk based on your current fat percentage.';
  }
  return `According to the American Council on Exercise you are ${active.label.toLowerCase()} based on your current fat percentage.`;
}
