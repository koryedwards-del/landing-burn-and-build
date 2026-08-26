/** Sample-female preview PDF — Kristi Warner demo package, separate from program-report preview scripts. */

import { buildKristiPreviewPackage } from './programReportPreviewFixtures.js';
import { buildProgramReportLockedPayload } from './programReportLockedPayloadData.js';

export function buildSampleFemalePreviewPayload() {
  const pkg = buildKristiPreviewPackage();
  pkg.meta = { ...pkg.meta, source: 'sample-female-preview' };
  return buildProgramReportLockedPayload(pkg);
}
