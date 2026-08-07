/** Auto-generated — node scripts/render-kwarner-locked-preview.mjs */
export const KWARNER_PREVIEW_BUILD = "2026-08-07T01-13-43-455Z";
export const KWARNER_PREVIEW_MD5 = "650daf6db23c5a8009b842bcd31daeff";
export const KWARNER_LOCKED_PREVIEW_PDF = '../docs/samples/kwarner-locked-preview-kristi.pdf';

export function kwarnerPreviewPdfUrl() {
  return `${KWARNER_LOCKED_PREVIEW_PDF}?build=${encodeURIComponent(KWARNER_PREVIEW_BUILD)}&md5=${KWARNER_PREVIEW_MD5.slice(0, 8)}`;
}
