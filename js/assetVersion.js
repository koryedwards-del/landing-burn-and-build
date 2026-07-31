/** Single source for static asset cache busting (HTML stamped at build; JS uses for dynamic URLs). */
export const ASSET_VERSION = '232';

/** Bump when data/foods.json changes so browsers refetch the catalog. */
export const FOODS_CATALOG_VERSION = '2026.07.31c';

/** Bump when a static Print Shop PDF body changes — appended as ?rev= on API fetch. */
export const PDF_PRINT_REVISIONS = {
  faq: '1',
  bestresults: '3',
};
