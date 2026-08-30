/** Single source for static asset cache busting (HTML stamped at build; JS uses for dynamic URLs). */
export const ASSET_VERSION = '317';

/** Bump when data/foods.json changes so browsers refetch the catalog. */
export const FOODS_CATALOG_VERSION = '2026.08.26a';

/**
 * Bump when the Burn & Build Diet PDF template changes (layout, pages, copy pipeline).
 * Stored diet PDFs on Render are invalidated when this changes.
 */
export const DIET_PDF_GENERATION_VERSION = '2026.08.30.64';
