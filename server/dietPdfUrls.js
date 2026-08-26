import { normalizeEmail } from './db.js';

const RENDER_API_ORIGIN = String(
  process.env.DIET_PDF_DOWNLOAD_ORIGIN || 'https://program-creator-3tzd.onrender.com',
).replace(/\/$/, '');

/** Direct download link — always renders the current program-report PDF. */
export function dietPdfDownloadUrl(email, programId) {
  const params = new URLSearchParams({
    email: normalizeEmail(email),
    program_id: String(programId || '').trim(),
  });
  return `${RENDER_API_ORIGIN}/api/programs/diet-pdf?${params}`;
}
