import fs from 'fs';
import path from 'path';

/** Public sample PDFs — served with Content-Disposition: attachment for Safari downloads. */
export const PUBLIC_SAMPLE_FILES = Object.freeze({
  'sample-diet': { file: 'b&bsamplediet.pdf', filename: 'b&bsamplediet.pdf' },
  'menu-plan-template': { file: 'menu-plan-template.pdf', filename: 'menu-plan-template.pdf' },
});

/** @param {string} root @param {string} slug */
export function resolveSamplePdfPath(root, slug) {
  const spec = PUBLIC_SAMPLE_FILES[slug];
  if (!spec) return null;
  const filePath = path.join(root, 'docs/samples', spec.file);
  if (!fs.existsSync(filePath)) return null;
  return { spec, filePath };
}
