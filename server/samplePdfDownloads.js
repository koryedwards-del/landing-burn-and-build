import fs from 'fs';
import path from 'path';

/** Public sample PDFs served from docs/samples/. */
export const PUBLIC_SAMPLE_FILES = Object.freeze({
  'sample-diet': { file: 'b&bsamplediet.pdf', filename: 'b&bsamplediet.pdf' },
  'menu-plan-worksheet': { file: 'menu-plan-worksheet.pdf', filename: 'menu-plan-worksheet.pdf' },
});

/** @param {string} root @param {string} slug */
export function resolveSamplePdfPath(root, slug) {
  const spec = PUBLIC_SAMPLE_FILES[slug];
  if (!spec) return null;
  const filePath = path.join(root, 'docs/samples', spec.file);
  if (!fs.existsSync(filePath)) return null;
  return { spec, filePath };
}
