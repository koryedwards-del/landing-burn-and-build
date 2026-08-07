/** Auto-generated — node scripts/render-kwarner-locked-preview.mjs */
export const KWARNER_PREVIEW_BUILD = "2026-08-07T19-20-40-842Z";
export const KWARNER_PREVIEW_MD5 = "857dbe5dbfd13fc389499cdf1e4822dc";
export const KWARNER_LOCKED_PREVIEW_PDF = '../docs/samples/kwarner-preview-kristi-veg-fruit-v10.pdf';

export function kwarnerPreviewPdfUrl() {
  return `${KWARNER_LOCKED_PREVIEW_PDF}?build=${encodeURIComponent(KWARNER_PREVIEW_BUILD)}&md5=${KWARNER_PREVIEW_MD5.slice(0, 8)}`;
}
