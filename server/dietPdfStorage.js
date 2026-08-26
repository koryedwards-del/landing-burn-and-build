import fs from 'fs';
import path from 'path';
import { DIET_PDF_GENERATION_VERSION } from '../js/assetVersionData.js';
import { dietPdfDocumentLabel, dietPdfFilename, dietPdfAttachmentFilename } from '../js/dietPdfNamingHelpers.js';
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

function dietPdfFilePath(programId) {
  const id = safeProgramId(programId);
  if (!id) throw new Error('Missing program id.');
  return path.join(dietPdfDirectory(), `${id}.pdf`);
}

function dietPdfMetaPath(programId) {
  return `${dietPdfFilePath(programId)}.meta.json`;
}

/** Write PDF + version metadata to disk (ops backup — downloads always render fresh). */
export function writeStoredDietPdf(programId, pdfBuffer, {
  version = DIET_PDF_GENERATION_VERSION,
} = {}) {
  const filePath = dietPdfFilePath(programId);
  fs.writeFileSync(filePath, pdfBuffer);
  fs.writeFileSync(dietPdfMetaPath(programId), JSON.stringify({
    version,
    generatedAt: new Date().toISOString(),
  }, null, 2));
  return filePath;
}
