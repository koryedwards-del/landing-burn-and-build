/** Auto-generated — node scripts/render-kwarner-locked-preview.mjs */
export const KWARNER_PREVIEW_BUILD = "2026-08-10T19-23-57-108Z";
export const KWARNER_PREVIEW_MD5 = "22dfa0ffcde6bb005a5b8441203305f9";
export const KWARNER_LOCKED_PREVIEW_FILE = "kwarner-locked-preview-kristi-94.pdf";
export const KWARNER_VEG_FRUIT_FILE = "kwarner-preview-kristi-veg-fruit-v98.pdf";
export const KWARNER_LOCKED_PREVIEW_PDF = '../docs/samples/' + "kwarner-locked-preview-kristi-94.pdf";
export const KWARNER_LOCKED_PREVIEW_LATEST_FILE = "kwarner-locked-preview-kristi-latest.pdf";
export const KWARNER_LOCKED_PREVIEW_DOWNLOAD_URL = 'https://raw.githubusercontent.com/koryedwards-del/landing-burn-and-build/main/docs/samples/' + "kwarner-locked-preview-kristi-94.pdf";
export const KWARNER_LOCKED_PREVIEW_LATEST_DOWNLOAD_URL = 'https://raw.githubusercontent.com/koryedwards-del/landing-burn-and-build/main/docs/samples/kwarner-locked-preview-kristi-latest.pdf';

export function kwarnerPreviewPdfUrl() {
  return `${KWARNER_LOCKED_PREVIEW_PDF}?build=${encodeURIComponent(KWARNER_PREVIEW_BUILD)}&md5=${KWARNER_PREVIEW_MD5.slice(0, 8)}`;
}
