/** Scale food-list staple serving labels by plan servings (servings × unit weight). */

/**
 * @param {number} scaled
 * @param {string} singular — e.g. "whole egg", "egg white"
 */
function scaleEggUnitPhrase(scaled, singular) {
  const rounded = Math.round(scaled);
  const plural = rounded === 1 ? singular : `${singular}s`;
  return `${rounded} ${plural}`;
}

/**
 * @param {string} servingLabel — per-serving label from cutting staples (e.g. "26g", "2 whites")
 * @param {number} servings — multiplier from the user's plan for this food category
 */
export function scaleStapleServingLabel(servingLabel, servings) {
  const count = Number(servings);
  if (!Number.isFinite(count) || count <= 0) return String(servingLabel ?? '');

  const label = String(servingLabel);
  const gramMatch = label.match(/^([\d.]+)g$/);
  if (gramMatch) {
    return `${Math.round(Number(gramMatch[1]) * count)}g`;
  }

  const eggServingMatch = label.match(/^1 whole egg \(yolks optional\) \/ 1 egg white$/);
  if (eggServingMatch) {
    const scaled = count;
    return `${scaleEggUnitPhrase(scaled, 'whole egg')} (yolks optional) / ${scaleEggUnitPhrase(scaled, 'egg white')}`;
  }

  const eggServingLegacyMatch = label.match(/^1 whole egg \(YOLKS optional\) \/ 1 egg white$/);
  if (eggServingLegacyMatch) {
    const scaled = count;
    return `${scaleEggUnitPhrase(scaled, 'whole egg')} (yolks optional) / ${scaleEggUnitPhrase(scaled, 'egg white')}`;
  }

  const wholeEggMatch = label.match(/^1 whole egg \/ 1 egg white$/);
  if (wholeEggMatch) {
    const scaled = count;
    return `${scaleEggUnitPhrase(scaled, 'whole egg')} / ${scaleEggUnitPhrase(scaled, 'egg white')}`;
  }

  const countMatch = label.match(/^([\d.]+)\s+(.+)$/);
  if (countMatch) {
    const scaled = Number(countMatch[1]) * count;
    const unit = countMatch[2];
    if (Math.abs(scaled - Math.round(scaled)) < 0.05) {
      return `${Math.round(scaled)} ${unit}`;
    }
    return `${scaled.toFixed(1)} ${unit}`;
  }

  return label;
}

/**
 * Servings multiplier for each food-list section — matches meal/snack slots on the Servings page.
 * @param {Record<string, number>|null|undefined} planServings
 * @param {'protein'|'grains'|'vegetable'|'fruit'} category
 */
export function stapleCategoryServings(planServings, category) {
  if (!planServings) return 1;
  const value = (key) => {
    const n = Number(planServings[key]);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };

  switch (category) {
    case 'protein':
      return value('protein') / 3;
    case 'grains':
      return value('grainsStarches') / 3;
    case 'vegetable':
      return value('vegetables');
    case 'fruit':
      return value('fruits') / 3;
    default:
      return 1;
  }
}

/** @param {ReadonlyArray<{ name: string, serving?: string }>} rows */
export function scaleStapleRows(rows, servings) {
  const multiplier = Number(servings);
  if (!Number.isFinite(multiplier) || multiplier <= 0) return rows;
  return rows.map((row) => ({
    ...row,
    serving: scaleStapleServingLabel(row.serving, multiplier),
  }));
}
