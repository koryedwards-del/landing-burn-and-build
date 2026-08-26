/** Auto-generated — node scripts/render-kwarner-locked-preview.mjs */
export const PROGRAM_REPORT_PREVIEW_BUILD = "2026-08-26T01-04-42-691Z";
export const PROGRAM_REPORT_PREVIEW_MD5 = "56a5adb3223e9cbd3730b2399406443d";
export const PROGRAM_REPORT_SAMPLE_FILE = "burn-and-build-diet-kristi-37.pdf";
export const PROGRAM_REPORT_ARCHIVE_FILE = "burn-and-build-diet-kristi-archive-v36.pdf";
export const PROGRAM_REPORT_SAMPLE_PDF = '../docs/samples/' + "burn-and-build-diet-kristi-37.pdf";
export const PROGRAM_REPORT_SAMPLE_LATEST_FILE = "burn-and-build-diet-kristi-latest.pdf";
export const PROGRAM_REPORT_SAMPLE_DOWNLOAD_URL = 'https://raw.githubusercontent.com/koryedwards-del/landing-burn-and-build/main/docs/samples/' + "burn-and-build-diet-kristi-37.pdf";
export const PROGRAM_REPORT_SAMPLE_LATEST_DOWNLOAD_URL = 'https://raw.githubusercontent.com/koryedwards-del/landing-burn-and-build/main/docs/samples/burn-and-build-diet-kristi-latest.pdf';

export function programReportSamplePdfUrl() {
  return `${PROGRAM_REPORT_SAMPLE_PDF}?build=${encodeURIComponent(PROGRAM_REPORT_PREVIEW_BUILD)}&md5=${PROGRAM_REPORT_PREVIEW_MD5.slice(0, 8)}`;
}
