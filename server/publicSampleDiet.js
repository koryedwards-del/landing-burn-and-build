import fs from 'fs';
import path from 'path';
import { buildSampleDietPrintoutPayload } from '../js/sampleDietPrintoutData.js';
import { dietPdfDocumentLabel } from '../js/dietPdfNamingHelpers.js';
import { getProgramById, normalizeEmail } from './db.js';
import { renderSampleDietPrintout } from './pdf/renderSampleDietPrintout.js';

const SAMPLE_DIET_FILENAME = 'b&bsamplediet.pdf';

function configFilePath() {
  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'programs.db');
  return path.join(path.dirname(dbPath), 'public-sample-diet.json');
}

/** @returns {{ email: string, programId: string, updatedAt?: string } | null} */
export function readPublicSampleDietConfig() {
  const filePath = configFilePath();
  if (fs.existsSync(filePath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const email = normalizeEmail(raw?.email);
      const programId = String(raw?.programId || '').trim();
      if (email && programId) {
        return {
          email,
          programId,
          updatedAt: raw?.updatedAt || null,
        };
      }
    } catch {
      // fall through to env
    }
  }

  const email = normalizeEmail(process.env.SAMPLE_DIET_EMAIL);
  const programId = String(process.env.SAMPLE_DIET_PROGRAM_ID || '').trim();
  if (!email || !programId) return null;
  return { email, programId, updatedAt: null };
}

export function writePublicSampleDietConfig({ email, programId }) {
  const normalizedEmail = normalizeEmail(email);
  const id = String(programId || '').trim();
  if (!normalizedEmail || !id) {
    throw new Error('email and programId are required.');
  }
  const payload = {
    email: normalizedEmail,
    programId: id,
    updatedAt: new Date().toISOString(),
  };
  const filePath = configFilePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return payload;
}

export function publicSampleDietFilename() {
  return SAMPLE_DIET_FILENAME;
}

/** Render the landing-page sample diet from the configured live program. */
export async function renderPublicSampleDietPdf() {
  const config = readPublicSampleDietConfig();
  if (!config) {
    throw new Error('Public sample diet is not configured. Set SAMPLE_DIET_EMAIL and SAMPLE_DIET_PROGRAM_ID on Render, or POST /api/admin/public-sample-diet.');
  }

  const pkg = getProgramById(config.email, config.programId);
  if (!pkg) {
    throw new Error('Configured sample program was not found in the database.');
  }

  const payload = buildSampleDietPrintoutPayload(pkg);
  const title = dietPdfDocumentLabel({ preferredName: pkg?.intake?.preferredName, pkg });
  return renderSampleDietPrintout(payload, { title });
}
