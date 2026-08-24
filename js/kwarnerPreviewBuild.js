/** Auto-generated — node scripts/render-kwarner-locked-preview.mjs */
export const KWARNER_PREVIEW_BUILD = "2026-08-24T20-45-26-679Z";
export const KWARNER_PREVIEW_MD5 = "26a13a18d9b1b99782dd27d5ca9f2727";
export const KWARNER_LOCKED_PREVIEW_FILE = "kwarner-locked-preview-kristi-105.pdf";
export const KWARNER_VEG_FRUIT_FILE = "kwarner-preview-kristi-veg-fruit-v109.pdf";
export const KWARNER_LOCKED_PREVIEW_PDF = '../docs/samples/' + "kwarner-locked-preview-kristi-105.pdf";
export const KWARNER_LOCKED_PREVIEW_LATEST_FILE = "kwarner-locked-preview-kristi-latest.pdf";
export const KWARNER_LOCKED_PREVIEW_DOWNLOAD_URL = 'https://raw.githubusercontent.com/koryedwards-del/landing-burn-and-build/main/docs/samples/' + "kwarner-locked-preview-kristi-105.pdf";
export const KWARNER_LOCKED_PREVIEW_LATEST_DOWNLOAD_URL = 'https://raw.githubusercontent.com/koryedwards-del/landing-burn-and-build/main/docs/samples/kwarner-locked-preview-kristi-latest.pdf';

export function kwarnerPreviewPdfUrl() {
  return `${KWARNER_LOCKED_PREVIEW_PDF}?build=${encodeURIComponent(KWARNER_PREVIEW_BUILD)}&md5=${KWARNER_PREVIEW_MD5.slice(0, 8)}`;
}
