/** Legacy singular foods.json names → canonical plural picker labels. */
export const FRUIT_NAME_ALIASES = {
  Apple: 'Apples',
  Banana: 'Bananas',
  Pear: 'Pears',
  Orange: 'Oranges',
  Peach: 'Peaches',
  Nectarine: 'Nectarines',
};

export function canonicalFruitName(name) {
  return FRUIT_NAME_ALIASES[name] || name;
}
