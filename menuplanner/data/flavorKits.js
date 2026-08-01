/**
 * Flavor kits — named pantry lists for the 8-Week Transformation meal prep program.
 * Not counted toward protein or G/S servings.
 */

/** @type {Readonly<Record<string, { id: string, label: string, flavors: readonly string[] }>>} */
export const FLAVOR_KITS = Object.freeze({
  fire: Object.freeze({
    id: 'fire',
    label: 'Fire',
    flavors: Object.freeze([
      'Chili powder',
      'Cumin',
      'Garlic powder',
      'Salt',
      'Black pepper',
    ]),
  }),
  iron: Object.freeze({
    id: 'iron',
    label: 'Iron',
    flavors: Object.freeze([
      'Salt',
      'Black pepper',
      'Garlic powder',
      'Onion powder',
    ]),
  }),
  green: Object.freeze({
    id: 'green',
    label: 'Green',
    flavors: Object.freeze([
      'Lemon pepper',
      'Garlic',
      'Dried basil',
    ]),
  }),
  earth: Object.freeze({
    id: 'earth',
    label: 'Earth',
    flavors: Object.freeze([
      'Sage',
      'Thyme',
      'Black pepper',
      'Mustard powder',
    ]),
  }),
});

export const FLAVOR_KIT_RULE =
  'Flavor kits don\u2019t count toward protein or G/S servings.';

/** @type {readonly string[]} */
export const FLAVOR_KIT_ORDER = Object.freeze(['fire', 'iron', 'green', 'earth']);

/**
 * @param {string} kitId
 * @returns {{ id: string, label: string, flavors: readonly string[] } | null}
 */
export function flavorKitById(kitId) {
  return FLAVOR_KITS[kitId] ?? null;
}

/** @returns {readonly { id: string, label: string, flavors: readonly string[] }[]} */
export function flavorKitList() {
  return FLAVOR_KIT_ORDER.map((id) => FLAVOR_KITS[id]);
}

/**
 * @param {{ id: string, label: string, flavors: readonly string[] }} kit
 * @returns {string}
 */
export function flavorKitItemsLabel(kit) {
  return kit.flavors.join(' \u00b7 ');
}

/**
 * @param {string[] | undefined} finish
 * @returns {string}
 */
export function flavorFinishLabel(finish) {
  if (!finish?.length) return '';
  const items = finish.join(', ');
  return `${items} (optional)`;
}
