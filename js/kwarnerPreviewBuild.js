/** Auto-generated — node scripts/render-kwarner-locked-preview.mjs */
export const KWARNER_PREVIEW_BUILD = "2026-08-07T00-50-46-840Z";
export const KWARNER_PREVIEW_MD5 = "33aa282291f1138b597ca31268eac210";
export const KWARNER_LOCKED_PREVIEW_PDF = '../docs/samples/kwarner-locked-preview-kristi.pdf';

export function kwarnerPreviewPdfUrl() {
  return `${KWARNER_LOCKED_PREVIEW_PDF}?build=${encodeURIComponent(KWARNER_PREVIEW_BUILD)}&md5=${KWARNER_PREVIEW_MD5.slice(0, 8)}`;
}
