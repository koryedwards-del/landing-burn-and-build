/** Single source for static asset cache busting (HTML stamped at build; JS uses for dynamic URLs). */
export const ASSET_VERSION = '316';

/** Bump when data/foods.json changes so browsers refetch the catalog. */
export const FOODS_CATALOG_VERSION = '2026.08.26a';

/** Bump when a static Print Shop PDF body changes — appended as ?rev= on API fetch. */
export const PDF_PRINT_REVISIONS = {
  faq: '3',
  bestresults: '5',
};
