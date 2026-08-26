/** Auto-generated — node scripts/render-kwarner-locked-preview.mjs */
export const PROGRAM_REPORT_PREVIEW_BUILD = "2026-08-26T00-02-03-314Z";
export const PROGRAM_REPORT_PREVIEW_MD5 = "a6de33561b4dd89875bc9a1d7db65bf8";
export const PROGRAM_REPORT_SAMPLE_FILE = "burn-and-build-diet-kristi-12.pdf";
export const PROGRAM_REPORT_ARCHIVE_FILE = "burn-and-build-diet-kristi-archive-v11.pdf";
export const PROGRAM_REPORT_SAMPLE_PDF = '../docs/samples/' + "burn-and-build-diet-kristi-12.pdf";
export const PROGRAM_REPORT_SAMPLE_LATEST_FILE = "burn-and-build-diet-kristi-latest.pdf";
export const PROGRAM_REPORT_SAMPLE_DOWNLOAD_URL = 'https://raw.githubusercontent.com/koryedwards-del/landing-burn-and-build/main/docs/samples/' + "burn-and-build-diet-kristi-12.pdf";
export const PROGRAM_REPORT_SAMPLE_LATEST_DOWNLOAD_URL = 'https://raw.githubusercontent.com/koryedwards-del/landing-burn-and-build/main/docs/samples/burn-and-build-diet-kristi-latest.pdf';

export function programReportSamplePdfUrl() {
  return `${PROGRAM_REPORT_SAMPLE_PDF}?build=${encodeURIComponent(PROGRAM_REPORT_PREVIEW_BUILD)}&md5=${PROGRAM_REPORT_PREVIEW_MD5.slice(0, 8)}`;
}
