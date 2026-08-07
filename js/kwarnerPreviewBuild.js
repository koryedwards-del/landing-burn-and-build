/** Auto-generated — node scripts/render-kwarner-locked-preview.mjs */
export const KWARNER_PREVIEW_BUILD = "2026-08-07T19-25-30-413Z";
export const KWARNER_PREVIEW_MD5 = "b90b75ccfad0d6968d7671df342ad8dd";
export const KWARNER_PREVIEW_VERSION = "kwarner-preview-kristi-veg-fruit-v12.pdf";
export const KWARNER_LOCKED_PREVIEW_PDF = '/program-report/samples/kwarner-preview-latest.pdf';

export function kwarnerPreviewPdfUrl() {
  return `${KWARNER_LOCKED_PREVIEW_PDF}?build=${encodeURIComponent(KWARNER_PREVIEW_BUILD)}&md5=${KWARNER_PREVIEW_MD5.slice(0, 8)}`;
}
