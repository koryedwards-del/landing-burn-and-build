/** Print Shop view registry — shared by client and server. */

export const PRINT_SHOP_VIEWS = Object.freeze([
  'faq',
  'foodlist',
  'bestresults',
  'programreport',
]);

export const PRINT_SHOP_PERSONALIZED_VIEWS = Object.freeze(['programreport']);

/** Body bytes identical for every client; title only affects metadata. */
export const PRINT_SHOP_STATIC_BODY_VIEWS = Object.freeze(['faq', 'bestresults']);

export const PRINT_SHOP_VIEW_SET = new Set(PRINT_SHOP_VIEWS);
export const PRINT_SHOP_PERSONALIZED_VIEW_SET = new Set(PRINT_SHOP_PERSONALIZED_VIEWS);
export const PRINT_SHOP_STATIC_BODY_VIEW_SET = new Set(PRINT_SHOP_STATIC_BODY_VIEWS);

export function isPrintShopView(view) {
  return PRINT_SHOP_VIEW_SET.has(view);
}

export function isPersonalizedPrintShopView(view) {
  return PRINT_SHOP_PERSONALIZED_VIEW_SET.has(view);
}

export function isStaticPrintShopBody(view) {
  return PRINT_SHOP_STATIC_BODY_VIEW_SET.has(view);
}
