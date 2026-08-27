/** Sample diet preview fixtures — reuses golden verify package with preview metadata. */

import { buildGoldenSamplePackage, GOLDEN_SAMPLE_FORM } from './printoutVerifyFixtures.js';

export { GOLDEN_SAMPLE_FORM as SAMPLE_DIET_PREVIEW_FORM };

export function buildSampleDietPreviewPackage() {
  const pkg = buildGoldenSamplePackage();
  if (pkg.meta) {
    pkg.meta = { ...pkg.meta, source: 'sample-diet-preview' };
  }
  return pkg;
}
