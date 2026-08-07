/** Auto-generated — node scripts/render-kwarner-locked-preview.mjs */
export const KWARNER_PREVIEW_BUILD = "2026-08-07T22-51-39-329Z";
export const KWARNER_PREVIEW_MD5 = "eee1d39a07fdbcdac1dd63f5a0f4ba61";
export const KWARNER_LOCKED_PREVIEW_PDF = '../docs/samples/kwarner-preview-kristi-food-plan-v3.pdf';

export function kwarnerPreviewPdfUrl() {
  return `${KWARNER_LOCKED_PREVIEW_PDF}?build=${encodeURIComponent(KWARNER_PREVIEW_BUILD)}&md5=${KWARNER_PREVIEW_MD5.slice(0, 8)}`;
}
