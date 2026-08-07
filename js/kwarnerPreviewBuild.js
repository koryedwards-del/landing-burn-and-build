/** Auto-generated — node scripts/render-kwarner-locked-preview.mjs */
export const KWARNER_PREVIEW_BUILD = "2026-08-07T01-26-40-172Z";
export const KWARNER_PREVIEW_MD5 = "b3f9fb76518908836933f77ea9a97a05";
export const KWARNER_LOCKED_PREVIEW_PDF = '../docs/samples/kwarner-preview-kristi-veg-fruit-prep.pdf';

export function kwarnerPreviewPdfUrl() {
  return `${KWARNER_LOCKED_PREVIEW_PDF}?build=${encodeURIComponent(KWARNER_PREVIEW_BUILD)}&md5=${KWARNER_PREVIEW_MD5.slice(0, 8)}`;
}
