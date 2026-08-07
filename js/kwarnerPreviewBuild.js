/** Auto-generated — node scripts/render-kwarner-locked-preview.mjs */
export const KWARNER_PREVIEW_BUILD = "2026-08-07T00-32-52-021Z";
export const KWARNER_PREVIEW_MD5 = "161707a22f59ad5994c80fa546333802";
export const KWARNER_LOCKED_PREVIEW_PDF = '../docs/samples/kwarner-locked-preview-kristi.pdf';

export function kwarnerPreviewPdfUrl() {
  return `${KWARNER_LOCKED_PREVIEW_PDF}?build=${encodeURIComponent(KWARNER_PREVIEW_BUILD)}&md5=${KWARNER_PREVIEW_MD5.slice(0, 8)}`;
}
