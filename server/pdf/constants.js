/** Shared program report PDF settings. */
export { PRINT_SHOP_VIEW_SET as PDF_VIEWS } from '../../js/printShopViews.js';
export {
  PRINT_SHOP_PERSONALIZED_VIEW_SET as PDF_PERSONALIZED_VIEWS,
  PRINT_SHOP_STATIC_BODY_VIEW_SET as STATIC_PDF_BODY_VIEWS,
  isPersonalizedPrintShopView as isPersonalizedPdfView,
  isPrintShopView as isPdfView,
  isStaticPrintShopBody as isStaticPdfBodyView,
} from '../../js/printShopViews.js';

/** Optimized for PDF embed (~40KB); full bblogo1.png is ~2MB and slows open/print. */
export const PDF_LOGO_REL = 'img/brand/bblogo-pdf.jpg';

/** Match program report sheet padding (0.35in vertical, 0.44in horizontal). */
export const PDF_MARGIN = {
  top: 0.35 * 72,
  bottom: 0.35 * 72,
  left: 0.44 * 72,
  right: 0.44 * 72,
};
