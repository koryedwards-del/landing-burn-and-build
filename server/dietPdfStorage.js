import fs from 'fs';
import path from 'path';
import { prepareDatabasePath, resolveDatabasePath } from './dbPath.js';

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

export function dietPdfFilename(preferredName) {
  const base = String(preferredName || 'Burn-Build')
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60) || 'Burn-Build';
  return `${base}-Burn-Build-Diet.pdf`;
}
