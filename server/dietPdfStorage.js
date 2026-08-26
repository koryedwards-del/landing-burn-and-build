import fs from 'fs';
import path from 'path';
import { DIET_PDF_GENERATION_VERSION } from '../js/assetVersion.js';
import { dietPdfDocumentLabel, dietPdfFilename, dietPdfAttachmentFilename } from '../js/dietPdfNaming.js';
import { prepareDatabasePath, resolveDatabasePath } from './dbPath.js';

export { dietPdfDocumentLabel, dietPdfFilename, dietPdfAttachmentFilename };

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

function dietPdfMetaPath(programId) {
  return `${dietPdfFilePath(programId)}.meta.json`;
}

export function readStoredDietPdfMeta(programId) {
  const metaPath = dietPdfMetaPath(programId);
  if (!fs.existsSync(metaPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  } catch {
    return null;
  }
}

export function writeStoredDietPdfMeta(programId, meta) {
  fs.writeFileSync(dietPdfMetaPath(programId), JSON.stringify(meta, null, 2));
}

export function readStoredDietPdf(programId) {
  const filePath = dietPdfFilePath(programId);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath);
}

export function isStoredDietPdfCurrent(programId, { version = DIET_PDF_GENERATION_VERSION } = {}) {
  const pdf = readStoredDietPdf(programId);
  if (!pdf) return false;
  const meta = readStoredDietPdfMeta(programId);
  return meta?.version === version;
}

export function writeStoredDietPdf(programId, pdfBuffer, {
  version = DIET_PDF_GENERATION_VERSION,
} = {}) {
  const filePath = dietPdfFilePath(programId);
  fs.writeFileSync(filePath, pdfBuffer);
  writeStoredDietPdfMeta(programId, {
    version,
    generatedAt: new Date().toISOString(),
  });
  return filePath;
}

export function deleteStoredDietPdf(programId) {
  const filePath = dietPdfFilePath(programId);
  const metaPath = dietPdfMetaPath(programId);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
}
