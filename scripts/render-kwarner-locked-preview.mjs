#!/usr/bin/env node
/** Preview: KWarner locked frame + seminar content — not production.
 *  Always writes a NEW versioned PDF (never overwrites) plus a stable latest copy. */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildKristiKwarnerPreviewPayload } from '../js/kwarnerLockedPreviewFixtures.js';
import { renderProgramReportKwarnerLockedPreview } from '../server/pdf/renderProgramReportKwarnerLockedPreview.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const samplesDir = path.join(root, 'docs/samples');
const programReportSamplesDir = path.join(root, 'program-report/samples');
const PREVIEW_BASENAME = 'kwarner-preview-kristi-veg-fruit-v';
const VERSION_RE = new RegExp(`^${PREVIEW_BASENAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d+)\\.pdf$`);
const LATEST_DOCS_NAME = 'kwarner-preview-kristi-latest.pdf';
const LATEST_PROGRAM_REPORT_NAME = 'kwarner-preview-latest.pdf';

function nextPreviewPdfName() {
  let maxVersion = 0;
  for (const entry of fs.readdirSync(samplesDir)) {
    const match = entry.match(VERSION_RE);
    if (match) maxVersion = Math.max(maxVersion, Number(match[1]));
  }
  return `${PREVIEW_BASENAME}${maxVersion + 1}.pdf`;
}

const PREVIEW_PDF_NAME = nextPreviewPdfName();
const buildLabel = new Date().toISOString().replace(/[:.]/g, '-');
const payload = buildKristiKwarnerPreviewPayload();
const pdf = await renderProgramReportKwarnerLockedPreview(payload, { buildLabel });

const versionedPath = path.join(samplesDir, PREVIEW_PDF_NAME);
const latestDocsPath = path.join(samplesDir, LATEST_DOCS_NAME);
const latestProgramReportPath = path.join(programReportSamplesDir, LATEST_PROGRAM_REPORT_NAME);

fs.mkdirSync(programReportSamplesDir, { recursive: true });
fs.writeFileSync(versionedPath, pdf);
fs.writeFileSync(latestDocsPath, pdf);
fs.writeFileSync(latestProgramReportPath, pdf);

const md5 = crypto.createHash('md5').update(pdf).digest('hex');
const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;

const buildModule = `/** Auto-generated — node scripts/render-kwarner-locked-preview.mjs */
export const KWARNER_PREVIEW_BUILD = ${JSON.stringify(buildLabel)};
export const KWARNER_PREVIEW_MD5 = ${JSON.stringify(md5)};
export const KWARNER_PREVIEW_VERSION = ${JSON.stringify(PREVIEW_PDF_NAME)};
export const KWARNER_LOCKED_PREVIEW_PDF = '/program-report/samples/${LATEST_PROGRAM_REPORT_NAME}';

export function kwarnerPreviewPdfUrl() {
  return \`\${KWARNER_LOCKED_PREVIEW_PDF}?build=\${encodeURIComponent(KWARNER_PREVIEW_BUILD)}&md5=\${KWARNER_PREVIEW_MD5.slice(0, 8)}\`;
}
`;

fs.writeFileSync(path.join(root, 'js/kwarnerPreviewBuild.js'), buildModule);

console.log(`Wrote versioned: ${versionedPath}`);
console.log(`Wrote latest:    ${latestDocsPath}`);
console.log(`Wrote open link: ${latestProgramReportPath}`);
console.log(`${pages} page(s), ${pdf.length} bytes, md5=${md5}, build=${buildLabel}`);
console.log(`Open: /program-report/?preview=1 then View KWarner preview PDF`);
