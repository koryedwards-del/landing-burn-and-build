/** Auto-generated — node scripts/render-kwarner-locked-preview.mjs */
export const PROGRAM_REPORT_PREVIEW_BUILD = "2026-08-25T23-55-29-277Z";
export const PROGRAM_REPORT_PREVIEW_MD5 = "28a54e99365af8ec9c358ee1326cae6d";
export const PROGRAM_REPORT_SAMPLE_FILE = "burn-and-build-diet-kristi-7.pdf";
export const PROGRAM_REPORT_ARCHIVE_FILE = "burn-and-build-diet-kristi-archive-v6.pdf";
export const PROGRAM_REPORT_SAMPLE_PDF = '../docs/samples/' + "burn-and-build-diet-kristi-7.pdf";
export const PROGRAM_REPORT_SAMPLE_LATEST_FILE = "burn-and-build-diet-kristi-latest.pdf";
export const PROGRAM_REPORT_SAMPLE_DOWNLOAD_URL = 'https://raw.githubusercontent.com/koryedwards-del/landing-burn-and-build/main/docs/samples/' + "burn-and-build-diet-kristi-7.pdf";
export const PROGRAM_REPORT_SAMPLE_LATEST_DOWNLOAD_URL = 'https://raw.githubusercontent.com/koryedwards-del/landing-burn-and-build/main/docs/samples/burn-and-build-diet-kristi-latest.pdf';

export function programReportSamplePdfUrl() {
  return `${PROGRAM_REPORT_SAMPLE_PDF}?build=${encodeURIComponent(PROGRAM_REPORT_PREVIEW_BUILD)}&md5=${PROGRAM_REPORT_PREVIEW_MD5.slice(0, 8)}`;
}
