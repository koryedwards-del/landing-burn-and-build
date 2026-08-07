/** Auto-generated — node scripts/render-kwarner-locked-preview.mjs */
export const KWARNER_PREVIEW_BUILD = "2026-08-07T20-02-13-753Z";
export const KWARNER_PREVIEW_MD5 = "8549f8ec4520081442bc72acebd7bd88";
export const KWARNER_LOCKED_PREVIEW_PDF = '../docs/samples/kwarner-preview-kristi-food-plan-v3.pdf';

export function kwarnerPreviewPdfUrl() {
  return `${KWARNER_LOCKED_PREVIEW_PDF}?build=${encodeURIComponent(KWARNER_PREVIEW_BUILD)}&md5=${KWARNER_PREVIEW_MD5.slice(0, 8)}`;
}
