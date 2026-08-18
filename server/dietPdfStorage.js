import fs from 'fs';
import path from 'path';
import { dietPdfDocumentLabel, dietPdfFilename } from '../js/dietPdfNaming.js';
import { prepareDatabasePath, resolveDatabasePath } from './dbPath.js';

export { dietPdfDocumentLabel, dietPdfFilename };

function dietPdfDirectory() {
  const dbPath = resolveDatabasePath();
  prepareDatabasePath(dbPath);
  const dir = path.join(path.dirname(dbPath), 'diet-pdfs');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function safeProgramId(programId) {
  return String(programId || '').replace(/[^a-zA-Z0-9-]/g, '');
}

export function dietPdfFilePath(programId) {
  const id = safeProgramId(programId);
  if (!id) throw new Error('Missing program id.');
  return path.join(dietPdfDirectory(), `${id}.pdf`);
}

export function readStoredDietPdf(programId) {
  const filePath = dietPdfFilePath(programId);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath);
}

export function writeStoredDietPdf(programId, pdfBuffer) {
  const filePath = dietPdfFilePath(programId);
  fs.writeFileSync(filePath, pdfBuffer);
  return filePath;
}
