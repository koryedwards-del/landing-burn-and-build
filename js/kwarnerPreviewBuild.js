/** Auto-generated — node scripts/render-kwarner-locked-preview.mjs */
export const KWARNER_PREVIEW_BUILD = "2026-08-07T19-27-46-203Z";
export const KWARNER_PREVIEW_MD5 = "4c89eebef8882563f9de2c16494af867";
export const KWARNER_PREVIEW_VERSION = "kwarner-preview-kristi-veg-fruit-v13.pdf";
export const KWARNER_LOCKED_PREVIEW_PDF = 'https://burnandbuilddiet.com/docs/samples/kwarner-preview-kristi-latest.pdf';
export const KWARNER_LOCKED_PREVIEW_VERSIONED_PDF = 'https://burnandbuilddiet.com/docs/samples/kwarner-preview-kristi-veg-fruit-v13.pdf';

export function kwarnerPreviewPdfUrl() {
  return `${KWARNER_LOCKED_PREVIEW_PDF}?build=${encodeURIComponent(KWARNER_PREVIEW_BUILD)}&md5=${KWARNER_PREVIEW_MD5.slice(0, 8)}`;
}
