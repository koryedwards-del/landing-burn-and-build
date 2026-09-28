#!/usr/bin/env node
/**
 * One-off HARDKOR header logo test — does not overwrite docs/samples/b&bsamplediet.pdf.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildSampleDietPreviewPayload } from '../js/sampleDietPrintoutData.js';
import { PDF_HARDKOR_LOGO_REL } from '../server/pdf/constants.js';
import { renderSampleDietPrintout } from '../server/pdf/renderSampleDietPrintout.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultOut = path.join('/cursor/stores/self/media/hardkor-sample-diet-test.pdf');
const outArg = process.argv.find((arg) => arg.startsWith('--out='));
const deliverable = outArg ? path.resolve(outArg.slice('--out='.length)) : defaultOut;

const logoPath = path.join(root, PDF_HARDKOR_LOGO_REL);
if (!fs.existsSync(logoPath)) {
  console.error(`Missing HARDKOR logo: ${logoPath}`);
  console.error('Add img/brand/hardkor-logo-2026.png (transparent HARDKOR header mark).');
  process.exit(1);
}

const payload = buildSampleDietPreviewPayload();
const pdf = await renderSampleDietPrintout(payload, {
  title: 'HARDKOR Sample Diet (header test)',
  buildLabel: 'hardkor-header-test',
  headerLogoRel: PDF_HARDKOR_LOGO_REL,
});

fs.mkdirSync(path.dirname(deliverable), { recursive: true });
fs.writeFileSync(deliverable, pdf);

const stat = fs.statSync(deliverable);
const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
console.log(`OK ${deliverable}`);
console.log(`BYTES ${stat.size}`);
console.log(`PAGES ${pages}`);
