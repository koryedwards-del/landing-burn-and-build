/** Bodybuilder cutting staples — program report PDF pages 5–6 (fixed copy + servings). */

/** P1 slot: 8g protein, ≤2g fat. */
export const CUTTING_STAPLES_PROTEIN = Object.freeze([
  { name: 'Chicken breast', serving: '26g' },
  { name: 'Turkey breast', serving: '28g' },
  { name: 'Lean ground beef (ground round)', serving: '27g' },
  { name: 'Sirloin steak', serving: '28g' },
  { name: 'Eye of round', serving: '25g' },
  { name: 'Cod', serving: '35g' },
  { name: 'Tilapia', serving: '31g' },
  { name: 'Shrimp', serving: '33g' },
  { name: 'Tuna (canned)', serving: '34g' },
  { name: 'Egg whites (small)', serving: '3 whites' },
  { name: 'Egg whites (extra large)', serving: '2 whites' },
]);

/** D1 slot: 8g P / 12g C / 2.44g F per serving (engine). Portions = whole grams @ ~8g protein, within slot C & F. */
export const CUTTING_STAPLES_DAIRY = Object.freeze([
  { name: 'Cottage cheese, nonfat', serving: '73g' },
  { name: 'Cottage cheese, 1%', serving: '73g' },
  { name: 'Cottage cheese, 2%', serving: '73g' },
  { name: 'Plain Greek yogurt, nonfat', serving: '78g' },
  { name: 'Greek yogurt, lowfat', serving: '84g' },
  { name: 'Yogurt, plain, nonfat', serving: '140g' },
  { name: 'Skim milk', serving: '237g' },
  { name: '1% milk', serving: '235g' },
  { name: 'Lactose-free skim milk', serving: '237g' },
  { name: 'Ricotta, nonfat', serving: '73g' },
]);
